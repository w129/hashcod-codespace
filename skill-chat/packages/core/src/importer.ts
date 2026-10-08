import YAML from 'yaml';
import {z} from 'zod';
import type {Block,Package} from './model.js';
import {assertPackage,textSchema,rejectDangerous,packageName,descriptionSchema,pathSchema} from './safety.js';
function yaml(content:string):Record<string,unknown>{
 const doc=YAML.parseDocument(content,{uniqueKeys:true,version:'1.2',schema:'core'});if(doc.errors.length||doc.warnings.length)throw new Error('YAML inválido');
 const value=doc.toJS({maxAliasCount:0});rejectDangerous(value);if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('YAML debe ser un objeto');return value;
}
export function markdownBlocks(body:string):Block[]{
 const paragraphs:string[]=[];let current:string[]=[];let fence:string|null=null;
 for(const line of body.replace(/\r\n/g,'\n').split('\n')){
  const opening=line.match(/^(`{3,})[A-Za-z0-9_+-]*$/);
  if(fence){current.push(line);if(line===fence)fence=null;continue;}
  if(opening){fence=opening[1];current.push(line);continue;}
  if(!line.trim()){if(current.length){paragraphs.push(current.join('\n'));current=[];}}else current.push(line);
 }
 if(current.length)paragraphs.push(current.join('\n'));
 const blocks:Block[]=[];for(const paragraph of paragraphs){
 const head=paragraph.match(/^(#{1,6}) ([^\n]*)$/);if(head){blocks.push({type:'heading',level:head[1].length as 1,text:head[2]});continue;}
 const fence=paragraph.match(/^(`{3,})([A-Za-z0-9_+-]*)\n([\s\S]*)\n\1$/);if(fence){blocks.push({type:'code',lang:fence[2],content:fence[3]});continue;}
 if(paragraph==='---'){blocks.push({type:'divider'});continue;}
 if(paragraph.split('\n').every(l=>l.startsWith('> '))){blocks.push({type:'quote',text:paragraph.split('\n').map(l=>l.slice(2)).join('\n')});continue;}
 const ex=paragraph.match(/^\*\*Entrada:\*\* ([\s\S]*)\n\*\*Salida:\*\* ([\s\S]*)$/);if(ex){blocks.push({type:'example',input:ex[1],output:ex[2]});continue;}
 if(paragraph.startsWith('- **Regla:** ')){blocks.push({type:'rule',text:paragraph.slice(13)});continue;}
 const lines=paragraph.split('\n');if(lines.every(l=>/^(- |\d+\. )/.test(l))){blocks.push({type:'list',ordered:/^\d/.test(lines[0]),items:lines.map(l=>l.replace(/^(- |\d+\. )/,''))});continue;}
 blocks.push({type:'text',text:paragraph});
 }
 return blocks;
}
export function importPackage(name:string,content:string):Package{
 pathSchema.parse(name);textSchema.parse(content);
 if(name.endsWith('.md')){
 const match=content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);if(!match)throw new Error('SKILL.md requiere frontmatter YAML');
 const data=z.object({name:packageName,description:descriptionSchema,version:z.string().optional(),triggers:z.array(z.string()).optional()}).strict().parse(yaml(match[1]));
 return assertPackage({kind:'skill',...data,version:data.version??'1.0.0',triggers:data.triggers??[],instructions:markdownBlocks(match[2]),tools:[],references:[]});
 }
 if(name.endsWith('.yaml')){
 const data=z.object({name:packageName,title:z.string().optional(),description:descriptionSchema,version:z.string().optional(),model:z.string().optional(),tools:z.array(z.string()).optional(),skills:z.array(z.string()).optional(),variables:z.record(z.string()).optional(),instructions:z.string().optional()}).strict().parse(yaml(content));
 return assertPackage({kind:'role',...data,title:data.title??data.name,version:data.version??'1.0.0',tools:data.tools??[],skills:data.skills??[],variables:data.variables??{},instructions:markdownBlocks(data.instructions??'')});
 }
 throw new Error('Importa SKILL.md o role.yaml');
}
