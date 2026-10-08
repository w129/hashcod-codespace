import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
export function Icon({children,size=16}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;}
export default function Composer({commands,files,activeFile,disabled,onSend,onOpen,onImport,celebrate}){
 const [draft,setDraft]=useState(''),[forced,setForced]=useState(null),[dismissed,setDismissed]=useState(false),[active,setActive]=useState(0),[fileOpen,setFileOpen]=useState(false);
 const root=useRef(null),input=useRef(null),upload=useRef(null),options=useRef([]);
 const match=/(^|\s)([@/])([\w./-]*)$/.exec(draft),token=match?{kind:match[2]==='@'?'at':'slash',query:match[3].toLowerCase(),start:match.index+match[1].length}:null;
 const menu=forced||(dismissed?null:token?.kind),query=forced?'':token?.query||'';
 const rows=menu==='slash'?commands.filter(c=>c.name.replace(/^\//,'').startsWith(query)).map(c=>({key:c.name,name:c.name.startsWith('/')?c.name:'/'+c.name,desc:c.desc,group:({file:'Archivos',package:'Paquete',content:'Contenido',exec:'Ejecución',system:'Sistema'})[c.kind]||'Comandos',hint:c.usage})):menu==='at'?files.filter(f=>f.path.toLowerCase().includes(query)).map(f=>({key:f.path,name:f.path,desc:f.ext,group:'Archivos del proyecto'})):[];
 const block=/^\s*\/(code|example)\b/.test(draft);
 useEffect(()=>{setActive(0);},[menu,query]);
 useEffect(()=>{options.current[active]?.scrollIntoView({block:'nearest'});},[active]);
 useEffect(()=>{const close=e=>{if(!root.current?.contains(e.target)){setForced(null);setFileOpen(false);setDismissed(true);}};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[]);
 useLayoutEffect(()=>{if(input.current){input.current.style.height='28px';input.current.style.height=Math.min(Math.max(input.current.scrollHeight,28),116)+'px';}},[draft]);
 function pick(row){if(menu==='slash')setDraft(`${token&&!forced?draft.slice(0,token.start):draft}${row.name} `);else setDraft(`${token&&!forced?draft.slice(0,token.start):draft}@${row.name} `);setForced(null);setDismissed(true);input.current?.focus();}
 async function send(){if(disabled||!draft.trim())return;const text=draft.trim();const sent=await onSend(text);if(sent){setDraft('');setForced(null);setDismissed(false);}}
 return <div ref={root} className={'hsc-composer-anchor'+(celebrate?' hsc-celebrate':'')} onKeyDown={e=>{if(e.key==='Escape'&&(fileOpen||forced)){e.preventDefault();e.stopPropagation();setFileOpen(false);setForced(null);setDismissed(true);}}}>
  {menu&&<div className="hsc-command-menu" id="hsc-command-list" role="listbox" aria-label={menu==='slash'?'Comandos disponibles':'Archivos disponibles'}>{rows.map((row,i)=><React.Fragment key={row.key}>{(i===0||rows[i-1].group!==row.group)&&<div className="hsc-menu-group">{row.group}</div>}<button ref={n=>options.current[i]=n} id={'hsc-option-'+i} role="option" aria-selected={i===active} tabIndex={-1} className={i===active?'hsc-menu-active':''} onMouseDown={e=>e.preventDefault()} onMouseEnter={()=>setActive(i)} onClick={()=>pick(row)}><strong>{row.name}</strong><span>{row.desc}</span>{row.hint&&<small>{row.hint}</small>}</button></React.Fragment>)}{!rows.length&&<p>No hay coincidencias.</p>}<div className="hsc-menu-foot">↑↓ para elegir · Enter para insertar · Esc para cerrar</div></div>}
  {fileOpen&&<div className="hsc-file-menu"><strong>Archivo activo</strong>{files.map(f=><button key={f.path} aria-pressed={f.path===activeFile} onClick={()=>{setFileOpen(false);onOpen(f.path);}} disabled={disabled}>{f.path}<span>{f.ext}</span></button>)}{!files.length&&<p>Crea un archivo con /new o importa uno.</p>}</div>}
  <div className="hsc-composer"><textarea ref={input} aria-label="Comando o texto del editor" role="combobox" aria-autocomplete="list" aria-expanded={Boolean(menu)} aria-controls={menu?'hsc-command-list':undefined} aria-activedescendant={menu&&rows.length?'hsc-option-'+active:undefined} placeholder="Escribe una instrucción, /comando o @archivo…" value={draft} maxLength={1024*1024} disabled={disabled} onChange={e=>{setDraft(e.target.value);setDismissed(false);setForced(null);}} onKeyDown={e=>{
   if(e.nativeEvent.isComposing)return;
   if(menu&&e.key==='Escape'){e.preventDefault();e.stopPropagation();setForced(null);setDismissed(true);return;}
   if(menu&&rows.length&&['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();setActive(n=>(n+(e.key==='ArrowDown'?1:rows.length-1))%rows.length);return;}
   if(menu&&rows.length&&e.key==='Enter'&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault();pick(rows[active]);return;}
   if(e.key==='Enter'&&!e.shiftKey&&(!block||e.ctrlKey||e.metaKey)){e.preventDefault();send();}
  }}/><div className="hsc-composer-controls"><input ref={upload} type="file" hidden accept=".md,.yaml,.yml,.coffee,.dart,.json" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)onImport(file);}}/>
   <button type="button" className="hsc-icon" aria-label="Importar archivo" onClick={()=>upload.current?.click()} disabled={disabled}><Icon><path d="M12 5v14M5 12h14"/></Icon></button>
   <button type="button" className="hsc-icon" aria-label="Abrir comandos" aria-expanded={menu==='slash'} onClick={()=>{setForced(menu==='slash'?null:'slash');setDismissed(false);setFileOpen(false);input.current?.focus();}} disabled={disabled}>/</button>
   <button type="button" className="hsc-icon" aria-label="Mencionar archivo" aria-expanded={menu==='at'} onClick={()=>{setForced(menu==='at'?null:'at');setDismissed(false);setFileOpen(false);input.current?.focus();}} disabled={disabled}>@</button>
   <button type="button" className="hsc-file-picker" aria-label="Cambiar archivo activo" aria-expanded={fileOpen} onClick={()=>{setFileOpen(!fileOpen);setForced(null);setDismissed(true);}} disabled={disabled}>{activeFile?activeFile.split('/').at(-1):'Archivo activo'}<Icon size={12}><path d="m6 9 6 6 6-6"/></Icon></button>
   <button type="button" className="hsc-send" aria-label="Enviar comando" disabled={disabled||!draft.trim()} onClick={send}><Icon><path d="M12 19V5M5 12l7-7 7 7"/></Icon></button>
  </div></div><div className="hsc-composer-hint">{block?'Enter: nueva línea · Ctrl/⌘ + Enter: enviar':'Enter: enviar · Shift + Enter: nueva línea'}</div>
 </div>;
}
