(function(){
'use strict';

if(window.__hashcodBranchedMenuLoaded)return;
window.__hashcodBranchedMenuLoaded=true;

var ITEMS=[
  {
    label:'Getting started',
    children:[
      {value:'install',label:'Installation',icon:'download04'},
      {value:'quick',label:'Quick start',icon:'rocket01'},
      {value:'config',label:'Configuration',icon:'settings02'}
    ]
  },
  {
    label:'Components',
    children:[
      {value:'buttons',label:'Buttons'},
      {value:'overlays',label:'Overlays'}
    ]
  }
];

var DEFAULT_OPEN=[0];
var DEFAULT_ACTIVE='quick';
var state={open:new Set(DEFAULT_OPEN),active:DEFAULT_ACTIVE};
var root=null;

var ICONS={
  download04:[
    '<path d="M16.9504 12.1817C17.1981 12.814 16.5076 13.5726 15.1267 15.0899C13.6702 16.6902 12.9201 17.4904 12 17.5C11.0799 17.4904 10.3298 16.6902 8.87331 15.0899C7.49239 13.5726 6.80193 12.814 7.04964 12.1817C7.05868 12.1586 7.06851 12.1359 7.0791 12.1135C7.34928 11.542 8.24477 11.5029 10 11.5002V4.99998C10 4.53501 10 4.30253 10.0511 4.11179C10.1898 3.59414 10.5941 3.1898 11.1118 3.05111C11.3025 3 11.535 3 12 3C12.4649 3 12.6974 3 12.8882 3.05111C13.4058 3.1898 13.8102 3.59414 13.9489 4.11179C14 4.30253 14 4.53501 14 4.99998V11.5002C15.7552 11.5029 16.6507 11.542 16.9209 12.1135C16.9315 12.1359 16.9413 12.1586 16.9504 12.1817Z"/>',
    '<path d="M5.00006 21H19.0001"/>'
  ].join(''),
  rocket01:[
    '<path d="M6.21875 11.618L3.31189 11.2378C2.71644 11.1606 2.31883 10.5841 2.58348 10.0458C3.42523 8.33365 5.6195 6.35437 9.73988 6.68079M6.21875 11.618C7.27445 9.85426 8.57175 8.00435 9.73988 6.68079M6.21875 11.618L11.882 17.2812M9.73988 6.68079C13.4105 2.58986 17.1745 1.728 19.5937 2.06685C20.5508 2.2009 21.2991 2.94917 21.4332 3.90626C21.772 6.32551 20.9101 10.0895 16.8192 13.7601M11.882 17.2812L12.2622 20.1881C12.3394 20.7836 12.9159 21.1812 13.4542 20.9165C15.1664 20.0748 17.1456 17.8805 16.8192 13.7601M11.882 17.2812C13.6457 16.2255 15.4956 14.9282 16.8192 13.7601"/>',
    '<path d="M17.5 8C17.5 6.89543 16.6046 6 15.5 6C14.3954 6 13.5 6.89543 13.5 8C13.5 9.10457 14.3954 10 15.5 10C16.6046 10 17.5 9.10457 17.5 8Z"/>',
    '<path d="M4 22L8 18M4 17L5.5 15.5"/>'
  ].join(''),
  settings02:[
    '<path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z"/>',
    '<path d="M21.011 14.0965C21.5329 13.9558 21.7939 13.8854 21.8969 13.7508C22 13.6163 22 13.3998 22 12.9669V11.0332C22 10.6003 22 10.3838 21.8969 10.2493C21.7938 10.1147 21.5329 10.0443 21.011 9.90358C19.0606 9.37759 17.8399 7.33851 18.3433 5.40087C18.4817 4.86799 18.5509 4.60156 18.4848 4.44529C18.4187 4.28902 18.2291 4.18134 17.8497 3.96596L16.125 2.98673C15.7528 2.77539 15.5667 2.66972 15.3997 2.69222C15.2326 2.71472 15.0442 2.90273 14.6672 3.27873C13.208 4.73448 10.7936 4.73442 9.33434 3.27864C8.95743 2.90263 8.76898 2.71463 8.60193 2.69212C8.43489 2.66962 8.24877 2.77529 7.87653 2.98663L6.15184 3.96587C5.77253 4.18123 5.58287 4.28891 5.51678 4.44515C5.45068 4.6014 5.51987 4.86787 5.65825 5.4008C6.16137 7.3385 4.93972 9.37763 2.98902 9.9036C2.46712 10.0443 2.20617 10.1147 2.10308 10.2492C2 10.3838 2 10.6003 2 11.0332V12.9669C2 13.3998 2 13.6163 2.10308 13.7508C2.20615 13.8854 2.46711 13.9558 2.98902 14.0965C4.9394 14.6225 6.16008 16.6616 5.65672 18.5992C5.51829 19.1321 5.44907 19.3985 5.51516 19.5548C5.58126 19.7111 5.77092 19.8188 6.15025 20.0341L7.87495 21.0134C8.24721 21.2247 8.43334 21.3304 8.6004 21.3079C8.76746 21.2854 8.95588 21.0973 9.33271 20.7213C10.7927 19.2644 13.2088 19.2643 14.6689 20.7212C15.0457 21.0973 15.2341 21.2853 15.4012 21.3078C15.5682 21.3303 15.7544 21.2246 16.1266 21.0133L17.8513 20.034C18.2307 19.8187 18.4204 19.711 18.4864 19.5547C18.5525 19.3984 18.4833 19.132 18.3448 18.5991C17.8412 16.6616 19.0609 14.6226 21.011 14.0965Z"/>'
  ].join('')
};

function iconMarkup(name){
  if(!name||!ICONS[name])return '';
  return '<span class="hashcod-branched-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+ICONS[name]+'</svg></span>';
}

function chevron(){
  return '<span class="hashcod-branched-chevron" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></span>';
}

function render(){
  if(root&&root.parentNode)root.parentNode.removeChild(root);

  root=document.createElement('aside');
  root.id='hashcodBranchedMenu';
  root.setAttribute('aria-label','Branched menu');
  root.setAttribute('data-hashcod-branched-menu','true');
  root.hidden=true;

  var list=document.createElement('div');
  list.className='hashcod-branched-menu-list';
  list.setAttribute('role','tree');

  ITEMS.forEach(function(group,index){
    var section=document.createElement('section');
    section.className='hashcod-branched-group';
    section.dataset.groupIndex=String(index);
    section.dataset.open=state.open.has(index)?'true':'false';

    var parent=document.createElement('button');
    parent.type='button';
    parent.className='hashcod-branched-parent';
    parent.setAttribute('aria-expanded',state.open.has(index)?'true':'false');
    parent.innerHTML='<span class="hashcod-branched-label"></span>'+chevron();
    parent.querySelector('.hashcod-branched-label').textContent=group.label;
    parent.addEventListener('click',function(){
      toggle(index);
    });

    var wrap=document.createElement('div');
    wrap.className='hashcod-branched-children-wrap';

    var children=document.createElement('div');
    children.className='hashcod-branched-children';
    children.setAttribute('role','group');

    group.children.forEach(function(item){
      var button=document.createElement('button');
      button.type='button';
      button.className='hashcod-branched-child';
      button.dataset.value=item.value;
      button.setAttribute('role','treeitem');
      if(state.active===item.value)button.setAttribute('aria-current','page');
      button.innerHTML=iconMarkup(item.icon)+'<span class="hashcod-branched-label"></span>';
      button.querySelector('.hashcod-branched-label').textContent=item.label;
      button.addEventListener('click',function(){
        select(item.value,item);
      });
      children.appendChild(button);
    });

    wrap.appendChild(children);
    section.appendChild(parent);
    section.appendChild(wrap);
    list.appendChild(section);
  });

  root.appendChild(list);
  document.body.appendChild(root);
  showWhenToolboxReady();
}

function toggle(index){
  var isOpen=state.open.has(index);
  if(isOpen)state.open.delete(index);else state.open.add(index);

  var section=root&&root.querySelector('[data-group-index="'+index+'"]');
  if(section){
    section.dataset.open=isOpen?'false':'true';
    var parent=section.querySelector('.hashcod-branched-parent');
    if(parent)parent.setAttribute('aria-expanded',isOpen?'false':'true');
  }

  window.dispatchEvent(new CustomEvent('hashcod:branched-menu-toggle',{
    detail:{index:index,open:!isOpen}
  }));
}

function updateActive(){
  if(!root)return;
  root.querySelectorAll('.hashcod-branched-child').forEach(function(button){
    if(button.dataset.value===state.active)button.setAttribute('aria-current','page');
    else button.removeAttribute('aria-current');
  });
}

function navigate(value,item){
  if(typeof window.hashcodBranchedMenuNavigate==='function'){
    window.hashcodBranchedMenuNavigate(value,item);
  }else{
    try{
      var url=new URL(window.location.href);
      url.hash=value;
      history.replaceState(history.state,'',url.pathname+url.search+url.hash);
    }catch(_){}
  }

  window.dispatchEvent(new CustomEvent('hashcod:branched-menu-select',{
    detail:{value:value,item:item}
  }));
}

function select(value,item){
  state.active=value;
  updateActive();
  navigate(value,item);
}

function getToolboxPanel(){
  var panel=document.querySelector('.toolbox-panel');
  if(!panel)return null;
  var style=window.getComputedStyle(panel);
  var rect=panel.getBoundingClientRect();
  if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0)return null;
  if(rect.width<180||rect.height<180)return null;
  if(rect.bottom<=0||rect.top>=window.innerHeight)return null;
  return panel;
}

function positionBesideToolbox(){
  if(!root)return false;
  var panel=getToolboxPanel();
  if(!panel)return false;

  if(window.innerWidth>900){
    var rect=panel.getBoundingClientRect();
    var menuWidth=240;
    var gap=20;
    var left=Math.max(16,Math.round(rect.left-menuWidth-gap));
    var top=Math.max(72,Math.round(rect.top+8));
    root.style.setProperty('left',left+'px','important');
    root.style.setProperty('top',top+'px','important');
    root.style.setProperty('width',menuWidth+'px','important');
    root.setAttribute('data-hashcod-toolbox-anchor','true');
  }else{
    root.style.removeProperty('left');
    root.style.removeProperty('top');
    root.style.removeProperty('width');
    root.removeAttribute('data-hashcod-toolbox-anchor');
  }
  return true;
}

function show(){
  if(!root)return;
  root.hidden=false;
  root.style.setProperty('display','block','important');
  root.style.setProperty('visibility','visible','important');
  root.style.setProperty('opacity','1','important');
  root.setAttribute('data-hashcod-branched-menu-visible','true');
  positionBesideToolbox();
}

function showWhenToolboxReady(){
  if(getToolboxPanel()){
    show();
    return;
  }

  var observer=null;
  if(document.body&&typeof MutationObserver==='function'){
    observer=new MutationObserver(function(){
      if(getToolboxPanel()){
        observer.disconnect();
        show();
      }
    });
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden']});
  }

  var attempts=0;
  var timer=window.setInterval(function(){
    attempts++;
    if(getToolboxPanel()){
      window.clearInterval(timer);
      if(observer)observer.disconnect();
      show();
      return;
    }
    if(attempts>160){
      window.clearInterval(timer);
      if(observer)observer.disconnect();
    }
  },125);
}

function boot(){
  if(document.getElementById('hashcodBranchedMenu'))return;
  render();
}

window.addEventListener('hashcod:platform-entered',function(){
  if(getToolboxPanel())show();
});
window.addEventListener('resize',function(){
  if(root&&!root.hidden)positionBesideToolbox();
},{passive:true});

window.HashcodBranchedMenu={
  items:ITEMS,
  config:{
    defaultOpen:DEFAULT_OPEN.slice(),
    defaultActive:DEFAULT_ACTIVE,
    color:'#f5f5f5',
    accentColor:'#f5f5f5',
    lineColor:'#3f3f46',
    width:240,
    rowHeight:36,
    indent:40,
    trunk:14,
    radius:10,
    lineWidth:1.5,
    fontSize:14,
    drawDuration:400,
    foldDuration:300
  },
  toggle:toggle,
  select:function(value){
    for(var g=0;g<ITEMS.length;g++){
      for(var i=0;i<ITEMS[g].children.length;i++){
        if(ITEMS[g].children[i].value===value){
          select(value,ITEMS[g].children[i]);
          return true;
        }
      }
    }
    return false;
  },
  navigate:navigate,
  getActive:function(){return state.active;},
  getOpen:function(){return Array.from(state.open);}
};

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',boot,{once:true});
}else{
  boot();
}
})();