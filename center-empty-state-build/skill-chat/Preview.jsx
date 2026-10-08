import React,{useEffect,useState} from 'react';
import {createHighlighterCore} from 'shiki/core';
import {createJavaScriptRegexEngine} from 'shiki/engine/javascript';
import markdown from '@shikijs/langs/markdown';
import yaml from '@shikijs/langs/yaml';
import coffee from '@shikijs/langs/coffee';
import dart from '@shikijs/langs/dart';
import theme from '@shikijs/themes/github-light';
let highlighter;
const languages={md:'markdown',yaml:'yaml',yml:'yaml',coffee:'coffee',dart:'dart'};
function getHighlighter(){return highlighter||(highlighter=createHighlighterCore({langs:[markdown,yaml,coffee,dart],themes:[theme],engine:createJavaScriptRegexEngine({target:'ES2018'})}));}
export default function Preview({content,ext}){
 const [tokens,setTokens]=useState(null);
 useEffect(()=>{let active=true;setTokens(null);const lang=languages[ext];if(!lang||content.length>16000||content.split('\n').some(line=>line.length>1600))return;
  const timer=setTimeout(()=>{getHighlighter().then(h=>{const result=h.codeToTokens(content,{lang,theme:'github-light'});if(active)setTokens(result.tokens);}).catch(()=>{});},120);return()=>{active=false;clearTimeout(timer);};
 },[content,ext]);
 return <pre className="hsc-highlight" aria-label="Vista previa del archivo">{tokens?tokens.map((line,i)=><React.Fragment key={i}>{line.map((token,j)=><span key={j} style={{color:/^#[a-fA-F0-9]{3,8}$/.test(token.color||'')?token.color:undefined}}>{token.content}</span>)}{i<tokens.length-1?'\n':''}</React.Fragment>):content||'Archivo vacío.'}</pre>;
}
