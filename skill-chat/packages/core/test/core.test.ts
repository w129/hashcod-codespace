import {describe,it,expect} from 'vitest';
import {createContext,parse,executeCommand,buildPackage,validatePackage,importPackage,updateFile,normalizePath,commands} from '../src/index.js';
const run=(inputs:string[])=>inputs.reduce((ctx,input)=>executeCommand(ctx,input).context,createContext());
const skill=()=>run(['/skill facturacion-dgii','/desc Valida datos aportados por el usuario cuando solicita preparar una factura.','/h2 Pasos','/step Solicita el RNC','/rule Nunca inventes datos','/example 123 => válido','/tool validar_rnc','/param rnc:string!']);
describe('parser',()=>{
 it('parses plain, case insensitive, multiline and malformed inputs',()=>{
  expect(parse(' Hola ')).toEqual({name:'text',args:'Hola',raw:'Hola'});
  expect(parse('/CODE coffee\na = 1')).toMatchObject({name:'code',args:'coffee\na = 1'});
  expect(parse('/ls')).toMatchObject({name:'ls',args:''});
  expect(()=>parse('/!')).toThrow();
  expect(()=>parse('a'.repeat(1048577))).toThrow();
 });
});
describe('core commands',()=>{
 it('creates deterministic full skill and job descriptors without executing',()=>{
  let ctx=skill();ctx=executeCommand(ctx,'/code coffee\nreturn {ok: args.rnc.length is 9}').context;
  const built=executeCommand(ctx,'/build');
  expect(built.job?.type).toBe('build');
  expect(built.context.files.map(f=>f.path)).toEqual(['SKILL.md','scripts/validar_rnc.coffee','scripts/validar_rnc.dart']);
  expect(buildPackage(built.context.pkg!)).toEqual(buildPackage(built.context.pkg!));
  expect(validatePackage(ctx.pkg!)).toEqual([]);
  expect(executeCommand(built.context,'/run validar_rnc {"rnc":"123"}').job?.payload).toMatchObject({tool:'validar_rnc',lang:'coffee',args:{rnc:'123'}});
  expect(executeCommand(built.context,'/test verifica el rnc').job?.type).toBe('test');
 });
 it('supports all file operations, folders, active files and confirmation',()=>{
  let ctx=run(['/new notes.md','texto','/name draft','/ext yaml','/rename renamed.yaml','/dup copy.yaml','/mkdir docs','/mv copy.yaml docs','/open renamed.yaml']);
  expect(ctx.files.map(f=>f.path)).toEqual(['renamed.yaml','docs/copy.yaml']);
  expect(executeCommand(ctx,'/ls').message).toContain('docs/copy.yaml');
  expect(executeCommand(ctx,'/tree').message).toContain('docs/');
  ctx=executeCommand(ctx,'/delete').context;
  expect(ctx.files).toHaveLength(2);
  expect(executeCommand(ctx,'/text cannot mutate').message).toContain('/yes');
  ctx=executeCommand(ctx,'/yes').context;expect(ctx.files).toHaveLength(1);
  ctx=executeCommand(ctx,'/undo').context;expect(ctx.files).toHaveLength(2);
  ctx=executeCommand(ctx,'/redo').context;expect(ctx.files).toHaveLength(1);
  ctx=executeCommand(ctx,'/close').context;expect(ctx.activeFile).toBeNull();
 });
 it('roles, metadata, versions, restore, diff, attachments',()=>{
  let ctx=run(['/role accountant','/desc Prepara información contable según los datos proporcionados por el cliente.','/version 2.1.0','/model claude-sonnet-5-5','/allow validar_rnc','/attach facturacion-dgii','/var currency=DOP','/text Instrucciones']);
  expect(ctx.pkg).toMatchObject({kind:'role',variables:{currency:'DOP'},skills:['facturacion-dgii']});
  expect(validatePackage(ctx.pkg!,['facturacion-dgii'])).toEqual([]);
  expect(validatePackage(ctx.pkg!,[])[0]).toMatchObject({level:'error'});
  ctx=executeCommand(ctx,'/detach facturacion-dgii').context;
  ctx=executeCommand(ctx,'/save').context;
  ctx=executeCommand(ctx,'/desc Cambiada').context;
  expect(executeCommand(ctx,'/diff 1').message).toContain('description');
  ctx=executeCommand(ctx,'/restore 1').context;
  expect(ctx.pkg?.description).toContain('Prepara');
  expect(importPackage('role.yaml',buildPackage(ctx.pkg!)[0].content)).toMatchObject({kind:'role',name:'accountant'});
 });
 it('content blocks edit, delete, move, lists, headings and code',()=>{
  let ctx=run(['/skill content','/desc Describe contenido para ayudar cuando se construyen instrucciones de agente.','/h1 A','/h3 B','/h4 C','/h5 D','/h6 E','/list uno\ndos','/olist tres\ncuatro','/quote cita','/step paso','/rule regla','/example entrada => salida','/hr','/code js\nconsole.log("ok")','/edit 1 Título','/move 1 2','/del 2']);
  expect(ctx.pkg!.instructions).toHaveLength(12);
  expect(ctx.pkg!.instructions[0]).toMatchObject({type:'heading',text:'B'});
  const md=buildPackage(ctx.pkg!)[0].content;
  expect(md).toContain('```js');expect(md).toContain('**Entrada:** entrada');
  expect(md).toContain('> cita');expect(md).toContain('1. paso');
 });
 it('publish is confirmed and frozen; cancel/delete/clear are reversible',()=>{
  let ctx=skill(); const pending=executeCommand(ctx,'/publish');
  expect(pending.publish).toBeUndefined();expect(pending.context.pendingConfirm?.snapshot.files.length).toBeGreaterThan(0);
  expect(executeCommand(pending.context,'/desc Modified').changed).toBe(false);
  const confirmed=executeCommand(pending.context,'/yes');
  expect(confirmed.publish).toBe(true);expect(confirmed.context.pkg!.description).toEqual(ctx.pkg!.description);
  ctx=executeCommand(ctx,'/clear').context;ctx=executeCommand(ctx,'/no').context;expect(ctx.pkg).not.toBeNull();
  ctx=executeCommand(ctx,'/clear').context;ctx=executeCommand(ctx,'/yes').context;expect(ctx.pkg).toBeNull();
  ctx=executeCommand(ctx,'/undo').context;expect(ctx.pkg).not.toBeNull();
 });
 it('validates every argument and never mutates input on failure',()=>{
  const ctx=skill();
  for(const input of ['/param constructor:string!','/tool class','/var __proto__=x','/new ../evil.md','/mkdir /root','/version 1.0','/example no separator','/run validar_rnc {"__proto__":{}}','/export html','/ls extra','/no extra','/unknown']){
   const before=JSON.stringify(ctx); const r=executeCommand(ctx,input);expect(r.changed,input).toBe(false);expect(JSON.stringify(ctx)).toEqual(before);
  }
 });
 it('uses bounded paths, bytes, types and uploads',()=>{
  for(const path of ['/a.md','../a.md','a/../b.md','a\\b.md','a\0.md','http://host/a.md','a//b.md','__proto__/b.md'])expect(()=>normalizePath(path)).toThrow();
  let ctx=run(['/new text.md']); expect(()=>updateFile(ctx,'text.md','€'.repeat(400000))).toThrow();
  expect(()=>importPackage('role.yaml','name: safe\nname: again')).toThrow();
  expect(()=>importPackage('role.yaml','__proto__: {polluted: yes}')).toThrow();
  expect(()=>importPackage('role.yaml','name: safe\ninstructions: &a [*a]')).toThrow();
  ctx=updateFile(ctx,'text.md','editable');expect(ctx.files[0].content).toBe('editable');
  expect(commands.length).toBeGreaterThan(50);
 });
 it('imports actual documents and preserves manual edits through build',()=>{
  let ctx=skill();ctx=executeCommand(ctx,'/build').context;
  ctx=updateFile(ctx,'scripts/validar_rnc.coffee','module.exports =\n  run: (args) -> args.rnc');
  expect(ctx.pkg?.kind==='skill'&&ctx.pkg.tools[0].body.coffee).toContain('module.exports');
  // Editing generated tools is kept verbatim, not wrapped twice.
  const built=executeCommand(ctx,'/build').context;
  expect(built.files.find(f=>f.path.endsWith('.coffee'))?.content).toContain('module.exports');
  const imported=importPackage('SKILL.md',built.files[0].content);
  expect(imported).toMatchObject({name:'facturacion-dgii',kind:'skill'});
  expect(executeCommand(ctx,'/preview').message).toContain('module.exports');
  expect(executeCommand(ctx,'/history').message).toContain('/build');
  expect(executeCommand(ctx,'/help run').message).toContain('/run');
  expect(executeCommand(ctx,'/export zip').download).toEqual({format:'zip'});
 });
});
