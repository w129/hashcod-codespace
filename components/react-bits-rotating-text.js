(function(){
'use strict';

if(window.__hashcodReactBitsRotatingTextLoaded)return;
window.__hashcodReactBitsRotatingTextLoaded=true;

function splitCharacters(text){
  if(typeof Intl!=='undefined'&&Intl.Segmenter){
    try{
      var segmenter=new Intl.Segmenter('en',{granularity:'grapheme'});
      return Array.from(segmenter.segment(text),function(part){return part.segment;});
    }catch(_){}
  }
  return Array.from(text);
}

function boot(){
  var body=document.body;
  if(!body||body.getAttribute('data-hashcod-entry-intro')!=='1')return;

  var root=document.getElementById('d5RotatingTextHero');
  var viewport=document.getElementById('d5RotatingTextViewport');
  var live=document.getElementById('d5RotatingTextLive');
  if(!root||!viewport||!live)return;

  var texts=(root.getAttribute('data-texts')||'React|Bits|Is|Cool!').split('|').filter(Boolean);
  if(!texts.length)return;

  var rotationInterval=Math.max(400,Number(root.getAttribute('data-rotation-interval'))||2000);
  var staggerDuration=Math.max(0,Number(root.getAttribute('data-stagger-duration'))||25);
  var staggerFrom=root.getAttribute('data-stagger-from')||'last';
  var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var index=0;
  var currentLayer=null;
  var timer=0;
  var busy=false;

  function staggerDelay(charIndex,total){
    if(staggerFrom==='last')return (total-1-charIndex)*staggerDuration;
    if(staggerFrom==='center'){
      var center=Math.floor(total/2);
      return Math.abs(center-charIndex)*staggerDuration;
    }
    return charIndex*staggerDuration;
  }

  function createLayer(text){
    var layer=document.createElement('span');
    layer.className='entry-rotating-text-layer';
    layer.setAttribute('aria-hidden','true');

    var words=text.split(' ');
    var total=words.reduce(function(sum,word){return sum+splitCharacters(word).length;},0);
    var consumed=0;

    words.forEach(function(word,wordIndex){
      var wordEl=document.createElement('span');
      wordEl.className='entry-rotating-text-word';

      splitCharacters(word).forEach(function(char,charIndex){
        var element=document.createElement('span');
        element.className='entry-rotating-text-element';
        element.textContent=char;
        element.style.setProperty('--rotating-stagger',staggerDelay(consumed+charIndex,total)+'ms');
        wordEl.appendChild(element);
      });

      consumed+=splitCharacters(word).length;
      layer.appendChild(wordEl);

      if(wordIndex!==words.length-1){
        var space=document.createElement('span');
        space.className='entry-rotating-text-space';
        space.textContent=' ';
        layer.appendChild(space);
      }
    });

    viewport.appendChild(layer);
    return layer;
  }

  function fitViewport(layer){
    if(!layer)return;
    var width=Math.ceil(layer.getBoundingClientRect().width);
    viewport.style.width=Math.max(1,width)+'px';
  }

  function enter(text,immediate){
    var layer=createLayer(text);
    currentLayer=layer;
    live.textContent=text;
    fitViewport(layer);

    if(immediate||reduced){
      layer.classList.add('is-active');
      return;
    }

    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        if(layer.isConnected)layer.classList.add('is-active');
      });
    });
  }

  function showAt(nextIndex,immediate){
    nextIndex=Math.max(0,Math.min(nextIndex,texts.length-1));
    index=nextIndex;
    enter(texts[index],Boolean(immediate));
  }

  function changeTo(nextIndex){
    if(busy||nextIndex===index)return;
    busy=true;

    var old=currentLayer;
    var oldText=texts[index]||'';
    var oldChars=splitCharacters(oldText.replace(/\s/g,'')).length;
    var maxDelay=Math.max(0,oldChars-1)*staggerDuration;
    var exitMs=reduced?0:420+maxDelay;

    if(old&&!reduced)old.classList.add('is-exiting');

    window.setTimeout(function(){
      if(old&&old.parentNode)old.parentNode.removeChild(old);
      index=nextIndex;
      enter(texts[index],reduced);
      window.setTimeout(function(){busy=false;},reduced?0:540+maxDelay);
    },exitMs);
  }

  function next(){
    changeTo(index===texts.length-1?0:index+1);
  }

  function previous(){
    changeTo(index===0?texts.length-1:index-1);
  }

  function jumpTo(nextIndex){
    var valid=Math.max(0,Math.min(Number(nextIndex)||0,texts.length-1));
    changeTo(valid);
  }

  function reset(){
    if(index===0)return;
    changeTo(0);
  }

  function start(){
    window.clearInterval(timer);
    timer=window.setInterval(next,rotationInterval);
  }

  showAt(0,true);
  start();

  document.addEventListener('visibilitychange',function(){
    if(document.hidden){
      window.clearInterval(timer);
      timer=0;
    }else{
      start();
    }
  });

  window.HashcodRotatingText={
    next:next,
    previous:previous,
    jumpTo:jumpTo,
    reset:reset,
    getIndex:function(){return index;},
    getText:function(){return texts[index];}
  };
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',boot,{once:true});
}else{
  boot();
}
})();