export type Block =
  | { type: 'heading'; level: 1|2|3|4|5|6; text: string }
  | { type: 'text'|'quote'|'step'|'rule'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'code'; lang: string; content: string }
  | { type: 'example'; input: string; output: string }
  | { type: 'divider' };
export type ParamType = 'string'|'number'|'boolean'|'object';
export type ToolDef = {name:string;description:string;params:{name:string;type:ParamType;required:boolean}[];body:{coffee?:string;dart?:string}};
export type Skill = {kind:'skill';name:string;description:string;version:string;triggers:string[];instructions:Block[];tools:ToolDef[];references:{path:string;content:string}[]};
export type Role = {kind:'role';name:string;title:string;description:string;version:string;model?:string;tools:string[];skills:string[];variables:Record<string,string>;instructions:Block[]};
export type Package = Skill|Role;
export type FileExt = 'md'|'yaml'|'coffee'|'dart';
export type VirtualFile = {path:string;ext:FileExt;content:string};
export type Issue = {level:'error'|'warning';field:string;message:string};
export type Snapshot = {pkg:Package|null;files:VirtualFile[];folders:string[];activeFile:string|null;activeTool:string|null;dirtyFiles?:string[]};
export type Version = {number:number;createdAt:string;snapshot:Snapshot};
export type PendingConfirm = {command:'delete'|'clear'|'publish'|'unpublish'|'build';args:string;snapshot:Snapshot};
export type Context = Snapshot & {pendingConfirm:PendingConfirm|null;history:{input:string;message:string}[];undo:Snapshot[];redo:Snapshot[];versions:Version[];nextVersion:number};
export type CommandInfo = {name:string;kind:'file'|'package'|'content'|'exec'|'system';desc:string;usage:string;confirm?:boolean;needsPackage?:boolean;needsActiveFile?:boolean};
export type Job = {type:'build'|'compile'|'run'|'test';payload:{files:VirtualFile[];pkg:Package|null;tool?:string;lang?:'coffee'|'dart';args?:Record<string,unknown>;input?:string}};
export type CommandResult = {context:Context;message:string;job?:Job;download?:{format:string};publish?:boolean;unpublish?:boolean;issues?:Issue[];changed?:boolean;saveVersion?:boolean;restoreVersion?:number;diffVersion?:number};
