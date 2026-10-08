export const PREFIX='/api/skill-chat';
export function createClient(){
  let csrf='',disposed=false;const controllers=new Set();
  async function request(path,{method='GET',body,binary=false}={}){
    if(disposed)throw new Error('El editor está cerrado.');
    const controller=new AbortController();controllers.add(controller);const timer=setTimeout(()=>controller.abort(),95000);
    try{
      const response=await fetch(PREFIX+path,{method,credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:method==='GET'?{}:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest','X-Hashcod-Skill-CSRF':csrf},body:body===undefined?undefined:JSON.stringify(body)});
      if(binary&&response.ok){if(Number(response.headers.get('Content-Length'))>20*1024*1024)throw new Error('La descarga supera el tamaño permitido.');const blob=await response.blob();if(blob.size>20*1024*1024)throw new Error('La descarga supera el tamaño permitido.');return blob;}
      let result;try{result=await response.json();}catch{throw new Error('El servidor no está disponible. Intenta reconectar.');}
      if(result.csrf)csrf=result.csrf;
      if(!response.ok||!result.ok){const error=new Error(result.error||'No se pudo completar la acción.');error.status=response.status;throw error;}
      return result;
    }catch(error){if(error.name==='AbortError')throw new Error('La conexión tardó demasiado. Reconecta para consultar el resultado.');throw error;}finally{clearTimeout(timer);controllers.delete(controller);}
  }
  return {request,dispose(){disposed=true;controllers.forEach(c=>c.abort());controllers.clear();}};
}
export function downloadBlob(blob,name){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name.replace(/[^a-zA-Z0-9._-]/g,'_');document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function validVirtualPath(path){return typeof path==='string'&&path.length<=240&&!path.startsWith('/')&&!path.includes('\\')&&!/[:\u0000-\u001f\u007f]/.test(path)&&!path.split('/').some(p=>!p||p==='.'||p==='..');}
