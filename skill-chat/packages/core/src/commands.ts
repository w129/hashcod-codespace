import {z} from 'zod';
import type {CommandInfo,CommandResult,Context,Package,Block,VirtualFile,FileExt,Snapshot} from './model.js';
import {createContext,clone,snapshot,withSnapshot,bounded,changedContext,mergeGenerated,trimContext} from './context.js';
import {parse} from './parser.js';
import {assertContext,assertSnapshot,pathSchema,packageName,identifier,textSchema,descriptionSchema,rejectDangerous,normalizePath,LIMITS} from './safety.js';
import {buildPackage} from './generators/index.js';
import {validatePackage} from './validator.js';
import {importPackage} from './importer.js';
const defs:CommandInfo[]=[];
const schemas=new Map<string,z.ZodTypeAny>();
const noArgs=z.string().length(0,'Este comando no acepta argumentos');
const requiredText=textSchema.refine(s=>s.trim().length>0,'Escribe el texto');
function def(name:string,kind:CommandInfo['kind'],desc:string,usage:string,schema:z.ZodTypeAny=noArgs,opts:Partial<CommandInfo>={}){defs.push({name,kind,desc,usage,...opts});schemas.set(name,schema);}
const active={needsActiveFile:true};const pkg={needsPackage:true};
const extSchema=z.enum(['md','yaml','coffee','dart']);
for(const [name,desc]of [['name','Define el nombre del archivo activo'],['rename','Renombra el archivo activo'],['dup','Duplica el archivo activo']]as const)def(name,'file',desc,`/${name} <nombre>`,pathSchema,active);
def('ext','file','Cambia el formato del archivo activo','/ext md|yaml|coffee|dart',extSchema,active);
def('new','file','Crea un archivo de texto','/new <nombre.ext>',pathSchema);
def('open','file','Abre un archivo existente','/open <archivo>',pathSchema);
def('delete','file','Elimina el archivo activo tras confirmar','/delete',noArgs,{...active,confirm:true});
def('save','file','Guarda una versión del proyecto','/save');
def('close','file','Cierra el archivo activo','/close');
def('ls','file','Lista los archivos','/ls');
def('tree','file','Muestra archivos y carpetas','/tree');
def('mkdir','file','Crea una carpeta virtual','/mkdir <carpeta>',pathSchema);
def('mv','file','Mueve un archivo a una carpeta','/mv <archivo> <carpeta>',z.string().refine(s=>{const a=s.split(/\s+/);return a.length===2&&a.every(p=>pathSchema.safeParse(p).success);},'Indica archivo y carpeta'));
for(const kind of ['skill','role']as const)def(kind,'package',`Crea un ${kind}`,`/${kind} <nombre>`,packageName);
def('desc','package','Descripción y activación del paquete','/desc <texto>',descriptionSchema.refine(s=>s.length>0,'Descripción obligatoria'),pkg);
def('version','package','Versión semántica','/version <x.y.z>',z.string().regex(/^\d{1,6}\.\d{1,6}\.\d{1,6}$/,'Usa x.y.z'),pkg);
def('trigger','package','Frase que activa el skill','/trigger <frase>',z.string().min(1).max(1024),pkg);
def('model','package','Modelo del rol','/model <id>',z.string().regex(/^[a-zA-Z0-9._:/-]{1,128}$/,'Modelo inválido'),pkg);
def('allow','package','Permite una herramienta al rol','/allow <herramienta>',identifier,pkg);
def('attach','package','Asigna un skill al rol','/attach <skill>',packageName,pkg);
def('detach','package','Quita un skill del rol','/detach <skill>',packageName,pkg);
def('var','package','Variable del rol','/var clave=valor',z.string().max(8192).refine(s=>{const i=s.indexOf('=');return i>0&&identifier.safeParse(s.slice(0,i)).success&&s.slice(i+1).length<=4096;},'Usa clave=valor; la clave no puede ser reservada'),pkg);
def('tool','package','Crea y activa una herramienta','/tool <nombre>',identifier,pkg);
def('param','package','Parámetro de la herramienta activa','/param nombre:string|number|boolean|object!',z.string().refine(s=>{const m=s.match(/^([a-z][a-z0-9_]{0,63}):(string|number|boolean|object)(!?)$/);return !!m&&identifier.safeParse(m[1]).success;},'Usa nombre:tipo!'),pkg);
def('text','content','Añade instrucciones o texto al archivo','/text <texto>',requiredText);
for(let i=1;i<=6;i++)def('h'+i,'content','Añade un encabezado de nivel '+i,'/h'+i+' <texto>',requiredText,pkg);
for(const [name,desc]of [['list','Lista de elementos'],['olist','Lista ordenada'],['quote','Cita'],['step','Paso'],['rule','Regla']]as const)def(name,'content',desc,`/${name} <texto>`,requiredText,pkg);
def('code','content','Bloque de código o cuerpo de herramienta','/code <lang>\n<código>',z.string().refine(s=>/^[A-Za-z0-9_+-]{1,32}\s+[\s\S]+$/.test(s),'Indica lenguaje y código'),pkg);
def('example','content','Ejemplo de entrada y salida','/example <entrada> => <salida>',z.string().refine(s=>{const i=s.indexOf('=>');return i>0&&s.slice(i+2).trim().length>0;},'Usa entrada => salida'),pkg);
def('hr','content','Añade un separador','/hr',noArgs,pkg);
def('edit','content','Edita un bloque numerado desde 1','/edit <n> <texto>',z.string().refine(s=>/^[1-9]\d{0,3}\s+[\s\S]+$/.test(s),'Indica número y texto'),pkg);
def('del','content','Elimina un bloque','/del <n>',z.string().regex(/^[1-9]\d{0,3}$/,'Indica el número del bloque'),pkg);
def('move','content','Reordena un bloque','/move <de> <a>',z.string().regex(/^[1-9]\d{0,3}\s+[1-9]\d{0,3}$/,'Indica dos números de bloque'),pkg);
for(const [name,desc]of [['validate','Valida metadatos y solicita compilación aislada'],['build','Genera los archivos del paquete'],['compile','Compila CoffeeScript y analiza Dart']]as const)def(name,'exec',desc,`/${name}`,noArgs,name==='compile'?{}:pkg);
def('run','exec','Ejecuta una herramienta en aislamiento','/run <herramienta> [coffee|dart] <JSON>',z.string().min(1).max(65536).refine(s=>!!s.match(/^([a-z][a-z0-9_]{0,63})(?:\s+(coffee|dart))?(?:\s+([\s\S]+))?$/),'Indica herramienta y argumentos JSON'),pkg);
def('test','exec','Prueba el paquete con tu modelo de IA','/test <entrada>',z.string().min(1).max(16384),pkg);
def('preview','exec','Muestra el archivo activo','/preview');
def('diff','exec','Compara una versión guardada','/diff [versión]',z.string().regex(/^(?:[1-9]\d{0,8})?$/,'Versión inválida'));
def('import','exec','Importa un documento propio existente','/import <archivo>',pathSchema);
def('export','exec','Descarga archivos del proyecto','/export zip|md|yaml|coffee|dart',z.enum(['zip','md','yaml','coffee','dart']));
def('unpublish','exec','Retira las publicaciones propias del catálogo','/unpublish',noArgs,{confirm:true});
def('publish','exec','Publica una instantánea congelada en el catálogo','/publish',noArgs,{...pkg,confirm:true});
for(const [name,desc]of [['undo','Deshace el último cambio'],['redo','Rehace un cambio'],['history','Muestra comandos recientes'],['clear','Limpia el proyecto tras confirmar'],['yes','Confirma la acción pendiente'],['no','Cancela la acción pendiente']]as const)def(name,'system',desc,`/${name}`,noArgs,name==='clear'?{confirm:true}:{});
def('restore','system','Restaura una versión guardada','/restore <versión>',z.string().regex(/^[1-9]\d{0,8}$/,'Versión inválida'));
def('help','system','Ayuda del catálogo de comandos','/help [comando]',z.string().regex(/^(?:\/?[a-z][a-z0-9-]{0,31})?$/,'Comando inválido'));
export const commands:readonly CommandInfo[]=Object.freeze(defs.map(d=>Object.freeze(d)));
function currentFile(ctx:Context):VirtualFile{const f=ctx.files.find(f=>f.path===ctx.activeFile);if(!f)throw new Error('No hay archivo activo. Usa /new u /open');return f;}
function fileExt(path:string):FileExt{return extSchema.parse(path.split('.').pop());}
function setFilePath(ctx:Context,path:string,duplicate=false):void{
 const file=currentFile(ctx);if(!/\.(md|yaml|coffee|dart)$/.test(path))path+='.'+file.ext;normalizePath(path);
 if(ctx.files.some(f=>f.path===path))throw new Error('Ya existe un archivo con ese nombre');
 const changed={...file,path,ext:fileExt(path)};ctx.files=duplicate?[...ctx.files,changed]:ctx.files.map(f=>f===file?changed:f);ctx.activeFile=path;ctx.dirtyFiles=(ctx.dirtyFiles??[]).map(p=>p===file.path?path:p);
}
function typedPackage(ctx:Context,kind:'skill'|'role'){
 if(ctx.pkg?.kind!==kind)throw new Error(kind==='skill'?'Primero crea un skill con /skill':'Primero crea un rol con /role');return ctx.pkg;
}
function pushBlock(ctx:Context,block:Block):void{if(!ctx.pkg)throw new Error('Crea un skill o rol primero');ctx.pkg.instructions.push(block);}
function diffSnapshot(a:Snapshot,b:Snapshot):string{
 const lines:string[]=[];if(JSON.stringify(a.pkg)!==JSON.stringify(b.pkg)){
  if(a.pkg&&b.pkg){for(const key of new Set([...Object.keys(a.pkg),...Object.keys(b.pkg)]))if(JSON.stringify((a.pkg as unknown as Record<string,unknown>)[key])!==JSON.stringify((b.pkg as unknown as Record<string,unknown>)[key]))lines.push('~ '+key);}
  else lines.push('~ package');
 }
 for(const path of new Set([...a.files.map(f=>f.path),...b.files.map(f=>f.path)])){const left=a.files.find(f=>f.path===path),right=b.files.find(f=>f.path===path);if(!left)lines.push('+ '+path);else if(!right)lines.push('- '+path);else if(left.content!==right.content)lines.push('~ '+path);}
 return lines.join('\n')||'Sin diferencias';
}
function execute(ctx:Context,name:string,args:string):Omit<CommandResult,'context'> & {context?:Context}{
 let message='Cambio guardado';const extras:Omit<CommandResult,'context'|'message'>={};
 switch(name){
 case 'skill':case 'role':{
  const common={name:args,description:'',version:'1.0.0',instructions:[]};
  ctx.pkg=name==='skill'?{...common,kind:'skill',triggers:[],tools:[],references:[]}:{...common,kind:'role',title:args,tools:[],skills:[],variables:{}};
  ctx.files=[];ctx.folders=[];ctx.activeFile=null;ctx.activeTool=null;ctx.dirtyFiles=[];message=`${name==='skill'?'Skill':'Rol'} ${args} creado`;break;
 }
 case 'desc':ctx.pkg!.description=args;break;
 case 'version':ctx.pkg!.version=args;break;
 case 'trigger':{const p=typedPackage(ctx,'skill');if(p.kind==='skill'&&!p.triggers.includes(args))p.triggers.push(args);break;}
 case 'model':{const p=typedPackage(ctx,'role');if(p.kind==='role')p.model=args;break;}
 case 'allow':{const p=typedPackage(ctx,'role');if(p.kind==='role'&&!p.tools.includes(args))p.tools.push(args);break;}
 case 'attach':case 'detach':{const p=typedPackage(ctx,'role');if(p.kind==='role')p.skills=name==='attach'?[...new Set([...p.skills,args])]:p.skills.filter(s=>s!==args);break;}
 case 'var':{const p=typedPackage(ctx,'role');if(p.kind==='role'){const i=args.indexOf('=');p.variables[args.slice(0,i)]=args.slice(i+1);}break;}
 case 'tool':{const p=typedPackage(ctx,'skill');if(p.kind==='skill'){if(!p.tools.some(t=>t.name===args))p.tools.push({name:args,description:'',params:[],body:{}});ctx.activeTool=args;}message=`Herramienta ${args} activa`;break;}
 case 'param':{
  const p=typedPackage(ctx,'skill');if(p.kind!=='skill'||!ctx.activeTool)throw new Error('Primero crea una herramienta con /tool');
  const t=p.tools.find(t=>t.name===ctx.activeTool)!;const m=args.match(/^([^:]+):(string|number|boolean|object)(!?)$/)!;
  if(t.params.some(p=>p.name===m[1]))throw new Error('El parámetro ya existe');t.params.push({name:m[1],type:m[2] as 'string',required:m[3]==='!'});break;
 }
 case 'new':{
  const ext=fileExt(args);if(ctx.files.some(f=>f.path===args))throw new Error('El archivo ya existe');ctx.files.push({path:args,ext,content:''});ctx.activeFile=args;break;
 }
 case 'open':if(!ctx.files.some(f=>f.path===args))throw new Error('Archivo no disponible');ctx.activeFile=args;break;
 case 'name':{
  packageName.parse(args);const f=currentFile(ctx);const dir=f.path.includes('/')?f.path.slice(0,f.path.lastIndexOf('/')+1):'';setFilePath(ctx,dir+args+'.'+f.ext);break;
 }
 case 'rename':case 'dup':setFilePath(ctx,args,name==='dup');break;
 case 'ext':{const f=currentFile(ctx);setFilePath(ctx,f.path.slice(0,-f.ext.length)+args);break;}
 case 'close':ctx.activeFile=null;break;
 case 'delete':ctx.files=ctx.files.filter(f=>f.path!==ctx.activeFile);ctx.activeFile=null;message='Archivo eliminado';break;
 case 'mkdir':{const parts=args.split('/');for(let i=1;i<=parts.length;i++){const p=parts.slice(0,i).join('/');if(!ctx.folders.includes(p))ctx.folders.push(p);}break;}
 case 'mv':{
  const [file,folder]=args.split(/\s+/);if(!ctx.folders.includes(folder))throw new Error('Crea la carpeta con /mkdir');
  const f=ctx.files.find(f=>f.path===file);if(!f)throw new Error('Archivo no disponible');const path=folder+'/'+file.split('/').pop();if(ctx.files.some(f=>f.path===path))throw new Error('El destino ya existe');
  ctx.files=ctx.files.map(x=>x===f?{...x,path}:x);if(ctx.activeFile===file)ctx.activeFile=path;break;
 }
 case 'ls':message=ctx.files.map(f=>f.path).join('\n')||'No hay archivos';break;
 case 'tree':message=[...ctx.folders.map(f=>f+'/'),...ctx.files.map(f=>f.path)].sort().join('\n')||'No hay archivos';break;
 case 'text':{
  if(ctx.pkg)pushBlock(ctx,{type:'text',text:args});else{const file=currentFile(ctx);file.content+=(file.content?'\n':'')+args;}break;
 }
 case 'h1':case 'h2':case 'h3':case 'h4':case 'h5':case 'h6':pushBlock(ctx,{type:'heading',level:Number(name[1]) as 1,text:args});break;
 case 'list':case 'olist':pushBlock(ctx,{type:'list',ordered:name==='olist',items:args.split('\n').map(s=>s.replace(/^\s*(?:- |\d+\. )/,''))});break;
 case 'quote':case 'step':case 'rule':pushBlock(ctx,{type:name,text:args});break;
 case 'hr':pushBlock(ctx,{type:'divider'});break;
 case 'example':{const i=args.indexOf('=>');pushBlock(ctx,{type:'example',input:args.slice(0,i).trim(),output:args.slice(i+2).trim()});break;}
 case 'code':{
  const m=args.match(/^([A-Za-z0-9_+-]+)\s+([\s\S]+)$/)!;
  if(ctx.pkg?.kind==='skill'&&ctx.activeTool&&(m[1]==='coffee'||m[1]==='dart')){ctx.pkg.tools.find(t=>t.name===ctx.activeTool)!.body[m[1] as 'coffee']=m[2];message='Cuerpo de herramienta actualizado';}
  else pushBlock(ctx,{type:'code',lang:m[1],content:m[2]});break;
 }
 case 'edit':case 'del':case 'move':{
  const a=args.split(/\s+/);const index=Number(a[0])-1;const blocks=ctx.pkg!.instructions;if(!blocks[index])throw new Error('Bloque no disponible');
  if(name==='del')blocks.splice(index,1);
  else if(name==='move'){const target=Number(a[1])-1;if(target<0||target>=blocks.length)throw new Error('Bloque de destino no disponible');const [item]=blocks.splice(index,1);blocks.splice(target,0,item);}
  else{const text=args.replace(/^\d+\s+/,'');const block=blocks[index];switch(block.type){case 'list':blocks[index]={...block,items:text.split('\n')};break;case 'code':blocks[index]={...block,content:text};break;case 'example':{const i=text.indexOf('=>');if(i<1||!text.slice(i+2).trim())throw new Error('Usa entrada => salida');blocks[index]={type:'example',input:text.slice(0,i).trim(),output:text.slice(i+2).trim()};break;}case 'divider':throw new Error('El separador no contiene texto');default:blocks[index]={...block,text};}}
  break;
 }
 case 'build':{
  const issues=validatePackage(ctx.pkg!);extras.issues=issues;if(issues.some(i=>i.level==='error'))throw new Error('Corrige los errores antes de construir');
  const next=mergeGenerated(ctx,buildPackage(ctx.pkg!));Object.assign(ctx,next);extras.job={type:'build',payload:{files:clone(ctx.files),pkg:clone(ctx.pkg)}};message='Archivos generados; comprobación aislada en cola';break;
 }
 case 'validate':{
  const issues=validatePackage(ctx.pkg!);extras.issues=issues;message=issues.map(i=>`${i.level==='error'?'Error':'Aviso'}: ${i.field}: ${i.message}`).join('\n')||'Metadatos válidos; comprobación de código en cola';
  if(!issues.some(i=>i.level==='error'))extras.job={type:'compile',payload:{files:buildPackage(ctx.pkg!),pkg:clone(ctx.pkg)}};break;
 }
 case 'compile':if(!ctx.files.length&&!ctx.pkg)throw new Error('Crea o importa un archivo antes de compilar');extras.job={type:'compile',payload:{files:ctx.files.length?clone(ctx.files):buildPackage(ctx.pkg!),pkg:clone(ctx.pkg)}};message='Compilación aislada en cola';break;
 case 'run':{
  const m=args.match(/^([a-z][a-z0-9_]{0,63})(?:\s+(coffee|dart))?(?:\s+([\s\S]+))?$/)!;identifier.parse(m[1]);
  if(ctx.pkg?.kind!=='skill'||!ctx.pkg.tools.some(t=>t.name===m[1]))throw new Error('Herramienta no disponible');
  let data:unknown;try{data=JSON.parse(m[3]??'{}');}catch{throw new Error('Argumentos JSON inválidos');}rejectDangerous(data);const input=z.record(z.unknown()).parse(data);
  const lang=m[2] as 'coffee'|'dart'|undefined??(ctx.activeFile?.endsWith('.dart')?'dart':'coffee');
  const files=ctx.files.length?clone(ctx.files):buildPackage(ctx.pkg!);if(!files.some(f=>f.path===`scripts/${m[1]}.${lang}`))throw new Error('Genera la herramienta con /build');
  extras.job={type:'run',payload:{files,pkg:clone(ctx.pkg),tool:m[1],lang,args:input}};message='Ejecución aislada en cola';break;
 }
 case 'test':extras.job={type:'test',payload:{files:ctx.files.length?clone(ctx.files):buildPackage(ctx.pkg!),pkg:clone(ctx.pkg),input:args}};message='Prueba con IA en cola; requiere clave, consentimiento y presupuesto';break;
 case 'preview':message=ctx.activeFile?currentFile(ctx).content:ctx.pkg?buildPackage(ctx.pkg)[0].content:'Selecciona un archivo';break;
 case 'export':if(!ctx.files.length&&!ctx.pkg)throw new Error('No hay archivos para exportar');extras.download={format:args};message='Descarga preparada';break;
 case 'import':{
  const file=ctx.files.find(f=>f.path===args);if(!file)throw new Error('Sube el archivo con el botón + antes de importarlo');ctx.pkg=importPackage(args,file.content);ctx.activeTool=null;message='Paquete importado';break;
 }
 case 'save':{
  const n=Math.max(ctx.nextVersion,(ctx.versions.at(-1)?.number??0)+1);ctx.nextVersion=n+1;ctx.versions=bounded([...ctx.versions,{number:n,createdAt:new Date().toISOString(),snapshot:snapshot(ctx)}]);extras.saveVersion=true;message=`Versión ${n} guardada`;break;
 }
 case 'diff':{
  const n=args?Number(args):ctx.versions.at(-1)?.number;const version=ctx.versions.find(v=>v.number===n);if(!version)throw new Error('Versión no disponible');extras.diffVersion=n;message=diffSnapshot(version.snapshot,snapshot(ctx));break;
 }
 case 'restore':{
  const n=Number(args);const v=ctx.versions.find(v=>v.number===n);if(!v)throw new Error('Versión no disponible');Object.assign(ctx,withSnapshot(ctx,v.snapshot));extras.restoreVersion=n;message=`Versión ${n} restaurada`;break;
 }
 case 'clear':Object.assign(ctx,{...createContext(),history:ctx.history,undo:ctx.undo,redo:ctx.redo,versions:ctx.versions,nextVersion:ctx.nextVersion});message='Proyecto limpiado';break;
 case 'unpublish':extras.unpublish=true;message='Publicaciones confirmadas para retirada del catálogo';break;
 case 'publish':{
  const issues=validatePackage(ctx.pkg!);if(issues.some(i=>i.level==='error'))throw new Error('Corrige el paquete antes de publicar');extras.publish=true;message='Instantánea confirmada para publicación';break;
 }
 case 'history':message=ctx.history.slice(-30).map(h=>h.input).join('\n')||'Sin historial';break;
 case 'help':{const cmd=commands.find(c=>c.name===args.replace(/^\//,''));if(args&&!cmd)throw new Error('Comando desconocido');message=cmd?`${cmd.usage}\n${cmd.desc}`:commands.map(c=>`${c.usage} — ${c.desc}`).join('\n');break;}
 default:throw new Error('Comando desconocido');
 }
 return {message,...extras};
}
export function executeCommand(inputContext:Context,input:string):CommandResult{
 let original:Context;try{original=assertContext(inputContext);}catch{return {context:createContext(),message:'Estado inválido. Abre una sesión válida',changed:false};}
 let name:string,args:string,raw:string;
 try{({name,args,raw}=parse(input));}catch{return {context:clone(original),message:'Entrada inválida o demasiado grande',changed:false};}
 const command=commands.find(c=>c.name===name);
 if(!command)return {context:clone(original),message:'Comando desconocido. Escribe /help',changed:false};
 try{
  schemas.get(name)!.parse(args);
  if(original.pendingConfirm&&name!=='yes'&&name!=='no')return {context:clone(original),message:'Responde /yes o /no primero',changed:false};
  if(command.needsPackage&&!original.pkg)throw new Error('Crea un skill o rol primero (/skill o /role)');
  if(command.needsActiveFile&&!original.activeFile)throw new Error('No hay archivo activo. Usa /new u /open');
  let ctx=clone(original);let result:Omit<CommandResult,'context'>;let avoidUndo=false;
  if(name==='yes'||name==='no'){
   const pending=ctx.pendingConfirm;if(!pending)throw new Error('No hay confirmación pendiente');ctx.pendingConfirm=null;
   if(name==='no')result={message:'Acción cancelada'};
   else{ctx=withSnapshot(ctx,pending.snapshot);result=execute(ctx,pending.command,pending.args);}
  }else if(name==='undo'||name==='redo'){
   const stack=name==='undo'?ctx.undo:ctx.redo;const item=stack.pop();if(!item)throw new Error(name==='undo'?'No hay cambios para deshacer':'No hay cambios para rehacer');
   const other=name==='undo'?'redo':'undo';ctx[other]=bounded([...ctx[other],snapshot(ctx)]);ctx=withSnapshot(ctx,item);avoidUndo=true;result={message:name==='undo'?'Cambio deshecho':'Cambio rehecho'};
  }else if(command.confirm||(name==='build'&&ctx.pkg&&buildPackage(ctx.pkg).some(g=>(ctx.dirtyFiles??[]).includes(g.path)&&ctx.files.some(f=>f.path===g.path&&f.content!==g.content)))){
   let frozen=snapshot(ctx);
   if(name==='publish'){
    const issues=validatePackage(ctx.pkg!);if(issues.some(i=>i.level==='error'))return {context:ctx,message:'Corrige el paquete antes de publicar',issues,changed:false};
    frozen=snapshot(mergeGenerated(ctx,buildPackage(ctx.pkg!)));
   }
   ctx.pendingConfirm={command:name as 'delete'|'clear'|'publish'|'unpublish'|'build',args,snapshot:frozen};result={message:name==='publish'?'Publicarás una copia congelada de todos los archivos del proyecto. Confirma con /yes o cancela con /no':name==='build'?'La regeneración cambiará archivos editados manualmente. Confirma con /yes o conserva los archivos con /no':'¿Seguro? Responde /yes o /no'};
  }else result=execute(ctx,name,args);
  const contentChanged=JSON.stringify(snapshot(ctx))!==JSON.stringify(snapshot(original));
  if(contentChanged&&!avoidUndo)ctx=changedContext(original,ctx);
  ctx.history=bounded([...ctx.history,{input:raw,message:result.message}],LIMITS.history);ctx=trimContext(ctx);assertContext(ctx);
  return {...result,context:ctx,changed:contentChanged||JSON.stringify(ctx.pendingConfirm)!==JSON.stringify(original.pendingConfirm)||!!result.saveVersion};
 }catch(error){
  const message=error instanceof z.ZodError?`${error.issues[0]?.message??'Argumentos inválidos'}. Uso: ${command.usage}`:error instanceof Error&&!(error instanceof SyntaxError)?error.message:'Comando inválido';
  return {context:clone(original),message:message.slice(0,2000),changed:false};
 }
}
