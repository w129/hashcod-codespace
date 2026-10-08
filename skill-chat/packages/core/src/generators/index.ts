import YAML from 'yaml';
import type {Block,Package,Skill,Role,ToolDef,VirtualFile} from '../model.js';
import {assertPackage,assertFiles} from '../safety.js';
export function blocksToMd(blocks:Block[]):string{
 let step=0;return blocks.map(b=>{
 switch(b.type){
 case 'heading':return '#'.repeat(b.level)+' '+b.text;
 case 'text':return b.text;
 case 'list':return b.items.map((s,i)=>(b.ordered?`${i+1}. `:'- ')+s).join('\n');
 case 'code':{const matches=b.content.match(/`+/g)??[];const fence='`'.repeat(Math.max(3,...matches.map(s=>s.length+1)));return `${fence}${b.lang}\n${b.content}\n${fence}`;}
 case 'quote':return b.text.split('\n').map(s=>'> '+s).join('\n');
 case 'step':return `${++step}. ${b.text}`;
 case 'rule':return '- **Regla:** '+b.text;
 case 'example':return `**Entrada:** ${b.input}\n**Salida:** ${b.output}`;
 case 'divider':return '---';
 }
 }).join('\n\n');
}
export const skillMd=(s:Skill)=>`---\n${YAML.stringify({name:s.name,description:s.description,version:s.version,...(s.triggers.length?{triggers:s.triggers}:{})},{lineWidth:0})}---\n\n${blocksToMd(s.instructions)}\n`;
export const roleYaml=(r:Role)=>YAML.stringify({name:r.name,title:r.title,description:r.description,version:r.version,...(r.model?{model:r.model}:{}),tools:r.tools,skills:r.skills,variables:r.variables,instructions:blocksToMd(r.instructions)},{lineWidth:0});
const coffeeString=(s:string)=>JSON.stringify(s).replace(/#\{/g,'\\#{').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const dartString=(s:string)=>JSON.stringify(s).replace(/\$/g,'\\$').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const indent=(s:string,n:number)=>s.split('\n').map(line=>' '.repeat(n)+line).join('\n');
// Full generated file edits remain full files; /code supplies function bodies.
export function toolCoffee(t:ToolDef):string{
 if(t.body.coffee?.startsWith('# hashcod:full-file\n'))return t.body.coffee.slice(20);
 const checks=t.params.flatMap(p=>[
 ...(p.required?[`    throw new Error ${coffeeString('Falta '+p.name)} unless Object::hasOwnProperty.call(args, ${coffeeString(p.name)}) and args[${coffeeString(p.name)}]?`]:[]),
 `    if args[${coffeeString(p.name)}]?`,
 p.type==='object'?`      throw new Error ${coffeeString(p.name+' debe ser object')} unless typeof args[${coffeeString(p.name)}] is "object" and not Array.isArray(args[${coffeeString(p.name)}])`:`      throw new Error ${coffeeString(p.name+' debe ser '+p.type)} unless typeof args[${coffeeString(p.name)}] is ${coffeeString(p.type)}`,
 ]).join('\n');
 return `# Herramienta generada por Hashcod Codespace\nmodule.exports =\n  name: ${coffeeString(t.name)}\n  description: ${coffeeString(t.description)}\n  params: ${JSON.stringify(t.params)}\n  run: (args = {}) ->\n    throw new Error "Argumentos inválidos" unless args? and typeof args is "object" and not Array.isArray(args)\n${checks}${checks?'\n':''}${indent(t.body.coffee??'return { ok: true, args }',4)}\n`;
}
export function toolDart(t:ToolDef):string{
 if(t.body.dart?.startsWith('// hashcod:full-file\n'))return t.body.dart.slice(21);
 const cls=t.name.split('_').map(s=>s[0].toUpperCase()+s.slice(1)).join('')+'Tool';
 const types={string:'String',number:'num',boolean:'bool',object:'Map<String, dynamic>'};
 const checks=t.params.map(p=>`    final ${p.name} = args[${dartString(p.name)}];\n${p.required?`    if (${p.name} == null) throw ArgumentError(${dartString('Falta '+p.name)});\n`:''}    if (${p.name} != null && ${p.name} is! ${types[p.type]}) throw ArgumentError(${dartString(p.name+' debe ser '+p.type)});`).join('\n');
 return `// Herramienta generada por Hashcod Codespace\nclass ${cls} {\n  static const name = ${dartString(t.name)};\n  static const description = ${dartString(t.description)};\n  Map<String, dynamic> run(Map<String, dynamic> args) {\n${checks}${checks?'\n':''}${indent(t.body.dart??"return {'ok': true, 'args': args};",4)}\n  }\n}\n`;
}
export function buildPackage(value:Package):VirtualFile[]{
 const pkg=assertPackage(value);
 if(pkg.kind==='role')return assertFiles([{path:'role.yaml',ext:'yaml',content:roleYaml(pkg)}]);
 const files:VirtualFile[]=[{path:'SKILL.md',ext:'md',content:skillMd(pkg)},...pkg.tools.flatMap(t=>[{path:`scripts/${t.name}.coffee`,ext:'coffee' as const,content:toolCoffee(t)},{path:`scripts/${t.name}.dart`,ext:'dart' as const,content:toolDart(t)}]),...pkg.references.map(r=>({path:`references/${r.path}`,ext: r.path.split('.').pop() as VirtualFile['ext'],content:r.content}))];
 return assertFiles(files);
}
