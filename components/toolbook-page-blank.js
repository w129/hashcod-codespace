(function(){
'use strict';

if(window.__hashcodToolbookPageResetLoaded)return;
window.__hashcodToolbookPageResetLoaded=true;

var activated=false;
var bodyObserver=null;
var surfaceObserver=null;
var timer=0;

var PAD=6;
var MARK=16;
var ROW_HEIGHT=36;
var INDENT=40;
var TRUNK=14;
var RADIUS=10;
var LINE_WIDTH=1.5;
var DRAW_DURATION=400;
var FOLD_DURATION=300;

var MENU_ITEMS=[
  {
    label:'Getting started',
    children:[
      {value:'install',label:'Installation',icon:'download04'},
      {value:'quick',label:'Quick start',icon:'rocket01'},
      {value:'config',label:'Configuration',icon:'settings02'},
      {value:'theming',label:'Theming',icon:'paintBoard'}
    ]
  },
  {
    label:'Components',
    children:[
      {value:'buttons',label:'Buttons',icon:'cursorPointer01'},
      {value:'typography',label:'Typography',icon:'textFont'},
      {value:'overlays',label:'Overlays',icon:'layers01'},
      {value:'toasts',label:'Toasts',icon:'notification03'}
    ]
  }
];

var menuState={
  open:new Set([0,1]),
  active:'quick'
};

var ICONS={
  download04:'<path d="M16.9504 12.1817C17.1981 12.814 16.5076 13.5726 15.1267 15.0899C13.6702 16.6902 12.9201 17.4904 12 17.5C11.0799 17.4904 10.3298 16.6902 8.87331 15.0899C7.49239 13.5726 6.80193 12.814 7.04964 12.1817C7.05868 12.1586 7.06851 12.1359 7.0791 12.1135C7.34928 11.542 8.24477 11.5029 10 11.5002V4.99998C10 4.53501 10 4.30253 10.0511 4.11179C10.1898 3.59414 10.5941 3.1898 11.1118 3.05111C11.3025 3 11.535 3 12 3C12.4649 3 12.6974 3 12.8882 3.05111C13.4058 3.1898 13.8102 3.59414 13.9489 4.11179C14 4.30253 14 4.53501 14 4.99998V11.5002C15.7552 11.5029 16.6507 11.542 16.9209 12.1135C16.9315 12.1359 16.9413 12.1586 16.9504 12.1817Z"/><path d="M5.00006 21H19.0001"/>',
  rocket01:'<path d="M6.21875 11.618L3.31189 11.2378C2.71644 11.1606 2.31883 10.5841 2.58348 10.0458C3.42523 8.33365 5.6195 6.35437 9.73988 6.68079M6.21875 11.618C7.27445 9.85426 8.57175 8.00435 9.73988 6.68079M6.21875 11.618L11.882 17.2812M9.73988 6.68079C13.4105 2.58986 17.1745 1.728 19.5937 2.06685C20.5508 2.2009 21.2991 2.94917 21.4332 3.90626C21.772 6.32551 20.9101 10.0895 16.8192 13.7601M11.882 17.2812L12.2622 20.1881C12.3394 20.7836 12.9159 21.1812 13.4542 20.9165C15.1664 20.0748 17.1456 17.8805 16.8192 13.7601M11.882 17.2812C13.6457 16.2255 15.4956 14.9282 16.8192 13.7601"/><path d="M17.5 8C17.5 6.89543 16.6046 6 15.5 6C14.3954 6 13.5 6.89543 13.5 8C13.5 9.10457 14.3954 10 15.5 10C16.6046 10 17.5 9.10457 17.5 8Z"/><path d="M4 22L8 18M4 17L5.5 15.5"/>',
  settings02:'<path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z"/><path d="M21.011 14.0965C21.5329 13.9558 21.7939 13.8854 21.8969 13.7508C22 13.6163 22 13.3998 22 12.9669V11.0332C22 10.6003 22 10.3838 21.8969 10.2493C21.7938 10.1147 21.5329 10.0443 21.011 9.90358C19.0606 9.37759 17.8399 7.33851 18.3433 5.40087C18.4817 4.86799 18.5509 4.60156 18.4848 4.44529C18.4187 4.28902 18.2291 4.18134 17.8497 3.96596L16.125 2.98673C15.7528 2.77539 15.5667 2.66972 15.3997 2.69222C15.2326 2.71472 15.0442 2.90273 14.6672 3.27873C13.208 4.73448 10.7936 4.73442 9.33434 3.27864C8.95743 2.90263 8.76898 2.71463 8.60193 2.69212C8.43489 2.66962 8.24877 2.77529 7.87653 2.98663L6.15184 3.96587C5.77253 4.18123 5.58287 4.28891 5.51678 4.44515C5.45068 4.6014 5.51987 4.86787 5.65825 5.4008C6.16137 7.3385 4.93972 9.37763 2.98902 9.9036C2.46712 10.0443 2.20617 10.1147 2.10308 10.2492C2 10.3838 2 10.6003 2 11.0332V12.9669C2 13.3998 2 13.6163 2.10308 13.7508C2.20615 13.8854 2.46711 13.9558 2.98902 14.0965C4.9394 14.6225 6.16008 16.6616 5.65672 18.5992C5.51829 19.1321 5.44907 19.3985 5.51516 19.5548C5.58126 19.7111 5.77092 19.8188 6.15025 20.0341L7.87495 21.0134C8.24721 21.2247 8.43334 21.3304 8.6004 21.3079C8.76746 21.2854 8.95588 21.0973 9.33271 20.7213C10.7927 19.2644 13.2088 19.2643 14.6689 20.7212C15.0457 21.0973 15.2341 21.2853 15.4012 21.3078C15.5682 21.3303 15.7544 21.2246 16.1266 21.0133L17.8513 20.034C18.2307 19.8187 18.4204 19.711 18.4864 19.5547C18.5525 19.3984 18.4833 19.132 18.3448 18.5991C17.8412 16.6616 19.0609 14.6226 21.011 14.0965Z"/>',
  paintBoard:'<path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C12.8417 22 14 22.1163 14 21C14 20.391 13.6832 19.9212 13.3686 19.4544C12.9082 18.7715 12.4523 18.0953 13 17C13.6667 15.6667 14.7778 15.6667 16.4815 15.6667C17.3334 15.6667 18.3334 15.6667 19.5 15.5C21.601 15.1999 22 13.9084 22 12Z"/><circle cx="9.5" cy="8.5" r="1.5"/><circle cx="16.5" cy="9.5" r="1.5"/><path d="M7.125 15H7M7.25 15C7.25 15.1381 7.13807 15.25 7 15.25C6.86193 15.25 6.75 15.1381 6.75 15C6.75 14.8619 6.86193 14.75 7 14.75C7.13807 14.75 7.25 14.8619 7.25 15Z"/>',
  cursorPointer01:'<path d="M12.0033 19.4056L9.88486 13.3197L9.88485 13.3197C9.08816 11.031 8.68981 9.88664 9.28857 9.28834C9.88733 8.69005 11.0326 9.08809 13.3231 9.88417L19.401 11.9966C20.6716 12.4382 21.3069 12.659 21.4441 13.0867C21.4819 13.2045 21.4949 13.329 21.4824 13.4521C21.4369 13.8989 20.8612 14.2464 19.7097 14.9415C18.9714 15.3872 18.6023 15.61 18.5039 15.9462C18.476 16.0414 18.4641 16.1405 18.4686 16.2396C18.4845 16.5896 18.7902 16.8935 19.4018 17.5012L21.4116 19.4988L21.4117 19.4988C21.7125 19.7979 21.863 19.9474 21.932 20.1147C22.0223 20.3335 22.0227 20.5792 21.9329 20.7983C21.8644 20.9657 21.7143 21.1157 21.4142 21.4155L21.4142 21.4156C21.1148 21.7147 20.9652 21.8642 20.7979 21.9328C20.5791 22.0224 20.3337 22.0224 20.1149 21.9328C19.9476 21.8642 19.7979 21.7147 19.4986 21.4156L19.4986 21.4155L17.4812 19.3998L17.4812 19.3998C16.8797 18.7987 16.5789 18.4982 16.2338 18.4802C16.1293 18.4747 16.0247 18.4875 15.9246 18.5179C15.594 18.6185 15.3745 18.9825 14.9355 19.7106L14.9355 19.7106C14.2491 20.8492 13.9059 21.4185 13.4653 21.4686C13.3353 21.4833 13.2037 21.4696 13.0796 21.4284C12.6588 21.2887 12.4403 20.661 12.0033 19.4056Z"/><path d="M10.8576 7.08329C11.0714 7.43808 11.5323 7.55239 11.8871 7.33861C12.2419 7.12483 12.3562 6.66392 12.1424 6.30913L10.8576 7.08329ZM6.30914 12.1424C6.66392 12.3562 7.12483 12.2419 7.33861 11.8871C7.55239 11.5323 7.43808 11.0714 7.08329 10.8576L6.30914 12.1424ZM5.75 8.5C5.75 6.98122 6.98123 5.75 8.5 5.75V4.25C6.15281 4.25 4.25 6.15279 4.25 8.5H5.75ZM8.5 5.75C9.49944 5.75 10.3752 6.28272 10.8576 7.08329L12.1424 6.30913C11.3999 5.07687 10.0469 4.25 8.5 4.25V5.75ZM7.08329 10.8576C6.28272 10.3752 5.75 9.49945 5.75 8.5H4.25C4.25 10.0469 5.07688 11.3999 6.30914 12.1424L7.08329 10.8576Z" fill="currentColor" stroke="none"/><path d="M14.2515 8.13498C14.2778 8.54836 14.6342 8.86216 15.0476 8.83587C15.461 8.80958 15.7748 8.45316 15.7485 8.03979L14.2515 8.13498ZM8.04118 15.7485C8.45457 15.7747 8.81093 15.4608 8.83714 15.0475C8.86335 14.6341 8.54948 14.2777 8.1361 14.2515L8.04118 15.7485ZM2.75 8.50661C2.75 5.32733 5.32736 2.75 8.50664 2.75V1.25C4.49895 1.25 1.25 4.49889 1.25 8.50661H2.75ZM8.50664 2.75C11.561 2.75 14.0604 5.12926 14.2515 8.13498L15.7485 8.03979C15.5074 4.24925 12.3576 1.25 8.50664 1.25V2.75ZM8.1361 14.2515C5.12986 14.0609 2.75 11.5614 2.75 8.50661H1.25C1.25 12.358 4.25002 15.5081 8.04118 15.7485L8.1361 14.2515Z" fill="currentColor" stroke="none"/>',
  textFont:'<path d="M14 19L11.1069 10.7479C9.76348 6.91597 9.09177 5 8 5C6.90823 5 6.23652 6.91597 4.89309 10.7479L2 19M4.5 12H11.5"/><path d="M21.9692 13.9392V18.4392M21.9692 13.9392C22.0164 13.1161 22.0182 12.4891 21.9194 11.9773C21.6864 10.7709 20.4258 10.0439 19.206 9.89599C18.0385 9.75447 17.1015 10.055 16.1535 11.4363M21.9692 13.9392L19.1256 13.9392C18.6887 13.9392 18.2481 13.9603 17.8272 14.0773C15.2545 14.7925 15.4431 18.4003 18.0233 18.845C18.3099 18.8944 18.6025 18.9156 18.8927 18.9026C19.5703 18.8724 20.1955 18.545 20.7321 18.1301C21.3605 17.644 21.9692 16.9655 21.9692 15.9392V13.9392Z"/>',
  layers01:'<path d="M8.64298 3.14559L6.93816 3.93362C4.31272 5.14719 3 5.75397 3 6.75C3 7.74603 4.31272 8.35281 6.93817 9.56638L8.64298 10.3544C10.2952 11.1181 11.1214 11.5 12 11.5C12.8786 11.5 13.7048 11.1181 15.357 10.3544L17.0618 9.56638C19.6873 8.35281 21 7.74603 21 6.75C21 5.75397 19.6873 5.14719 17.0618 3.93362L15.357 3.14559C13.7048 2.38186 12.8786 2 12 2C11.1214 2 10.2952 2.38186 8.64298 3.14559Z"/><path d="M20.788 11.0972C20.9293 11.2959 21 11.5031 21 11.7309C21 12.7127 19.6873 13.3109 17.0618 14.5072L15.357 15.284C13.7048 16.0368 12.8786 16.4133 12 16.4133C11.1214 16.4133 10.2952 16.0368 8.64298 15.284L6.93817 14.5072C4.31272 13.3109 3 12.7127 3 11.7309C3 11.5031 3.07067 11.2959 3.212 11.0972"/><path d="M20.3767 16.2661C20.7922 16.5971 21 16.927 21 17.3176C21 18.2995 19.6873 18.8976 17.0618 20.0939L15.357 20.8707C13.7048 21.6236 12.8786 22 12 22C11.1214 22 10.2952 21.6236 8.64298 20.8707L6.93817 20.0939C4.31272 18.8976 3 18.2995 3 17.3176C3 16.927 3.20778 16.5971 3.62334 16.2661"/>',
  notification03:'<path d="M20 18.5011L18.349 7.93407C17.8603 4.80601 15.166 2.5 12 2.5C8.83398 2.5 6.13971 4.80601 5.65098 7.93407L4 18.5011"/><path d="M20 18.5C20 16.8431 16.4183 15.5 12 15.5C7.58172 15.5 4 16.8431 4 18.5C4 20.1569 7.58172 21.5 12 21.5C16.4183 21.5 20 20.1569 20 18.5Z"/><path d="M13 18.5H11"/>'
};

function visibleToolbookSurface(){
  var panel=document.querySelector('.toolbox-panel');
  if(panel){
    var style=window.getComputedStyle(panel);
    var rect=panel.getBoundingClientRect();
    if(style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)!==0&&rect.width>=300&&rect.height>=300&&rect.right>0&&rect.left<window.innerWidth&&rect.bottom>0&&rect.top<window.innerHeight)return panel;
  }

  var slots=Array.from(document.querySelectorAll('.tb-slot')).filter(function(slot){
    var style=window.getComputedStyle(slot);
    var rect=slot.getBoundingClientRect();
    return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>40&&rect.height>40;
  });
  if(slots.length>=12)return slots[0];

  var labels=Array.from(document.querySelectorAll('button,[role="button"]')).filter(function(node){
    var style=window.getComputedStyle(node);
    var rect=node.getBoundingClientRect();
    return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;
  }).map(function(node){return (node.textContent||'').trim();});
  if(['S1TB','S2TB','S3TB','S4TB'].every(function(label){return labels.indexOf(label)!==-1;}))return document.body;

  return null;
}

function platformEntered(){
  var root=document.documentElement;
  if(!root)return false;
  return root.dataset.hashcodPlatformEntered==='true'||root.classList.contains('hashcod-platform-entered')||(document.body&&document.body.classList.contains('hashcod-platform-entered'));
}

function rowY(k){
  return PAD+k*ROW_HEIGHT+ROW_HEIGHT/2;
}

function branchPath(k){
  var r=Math.min(RADIUS,ROW_HEIGHT/2-2);
  var endX=INDENT-8;
  return 'M '+TRUNK+' '+(rowY(k)-r)+' A '+r+' '+r+' 0 0 0 '+(TRUNK+r)+' '+rowY(k)+' H '+endX;
}

function reachPath(k){
  var r=Math.min(RADIUS,ROW_HEIGHT/2-2);
  var endX=INDENT-8;
  return 'M '+TRUNK+' 0 V '+(rowY(k)-r)+' A '+r+' '+r+' 0 0 0 '+(TRUNK+r)+' '+rowY(k)+' H '+endX;
}

function pathLength(k){
  var r=Math.min(RADIUS,ROW_HEIGHT/2-2);
  var endX=INDENT-8;
  return rowY(k)-r+(Math.PI*r)/2+(endX-TRUNK-r);
}

function iconMarkup(name){
  if(!name||!ICONS[name])return '';
  return '<span class="branched-menu__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+ICONS[name]+'</svg></span>';
}

function placeMarker(menu,glide){
  if(!menu)return;
  var marker=menu.querySelector('.branched-menu__marker');
  var activeSection=MENU_ITEMS.findIndex(function(item){
    return item.children&&item.children.some(function(kid){return kid.value===menuState.active;});
  });
  var section=menu.querySelector('.branched-menu__section[data-group-index="'+activeSection+'"]');
  var head=section&&section.querySelector('.branched-menu__head');
  var shown=activeSection>=0&&menuState.open.has(activeSection)&&head;
  if(!marker)return;
  if(!glide)marker.style.transition='none';
  if(shown)marker.style.top=(head.offsetTop+(head.offsetHeight-MARK)/2)+'px';
  if(shown)marker.setAttribute('data-on','');
  else marker.removeAttribute('data-on');
  if(!glide){
    void marker.offsetHeight;
    marker.style.transition='';
  }
}

function updateActive(menu){
  if(!menu)return;
  menu.querySelectorAll('.branched-menu__item').forEach(function(button){
    var active=button.dataset.value===menuState.active;
    if(active){
      button.setAttribute('aria-current','true');
      button.setAttribute('data-active','');
    }else{
      button.removeAttribute('aria-current');
      button.removeAttribute('data-active');
    }
  });
  menu.querySelectorAll('.branched-menu__reach').forEach(function(path){
    var length=Number(path.dataset.length||0);
    path.style.strokeDasharray=String(length);
    path.style.strokeDashoffset=path.dataset.value===menuState.active?'0':String(length);
  });
  placeMarker(menu,true);
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
  try{
    window.dispatchEvent(new CustomEvent('hashcod:branched-menu-select',{detail:{value:value,item:item}}));
  }catch(_){}
}

function selectItem(menu,value,item){
  menuState.active=value;
  updateActive(menu);
  navigate(value,item);
}

function toggleGroup(menu,index){
  if(menuState.open.has(index))menuState.open.delete(index);
  else menuState.open.add(index);

  var section=menu.querySelector('.branched-menu__section[data-group-index="'+index+'"]');
  var isOpen=menuState.open.has(index);
  if(section){
    if(isOpen)section.setAttribute('data-open','');
    else section.removeAttribute('data-open');
    var head=section.querySelector('.branched-menu__head');
    if(head)head.setAttribute('aria-expanded',isOpen?'true':'false');
    section.querySelectorAll('.branched-menu__item').forEach(function(item){
      item.tabIndex=isOpen?0:-1;
    });
  }
  placeMarker(menu,true);
  try{
    window.dispatchEvent(new CustomEvent('hashcod:branched-menu-toggle',{detail:{index:index,open:isOpen}}));
  }catch(_){}
}

function renderGroup(menu,group,index){
  var section=document.createElement('div');
  section.className='branched-menu__section';
  section.dataset.groupIndex=String(index);
  if(menuState.open.has(index))section.setAttribute('data-open','');

  var head=document.createElement('button');
  head.type='button';
  head.className='branched-menu__head';
  head.textContent=group.label;
  head.setAttribute('aria-expanded',menuState.open.has(index)?'true':'false');
  head.addEventListener('click',function(){toggleGroup(menu,index);});
  section.appendChild(head);

  var body=document.createElement('div');
  body.className='branched-menu__body';

  var fold=document.createElement('div');
  fold.className='branched-menu__fold';

  var tree=document.createElement('div');
  tree.className='branched-menu__tree';
  var bodyH=PAD*2+group.children.length*ROW_HEIGHT;
  tree.style.height=bodyH+'px';

  var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('class','branched-menu__lines');
  svg.setAttribute('width',String(INDENT));
  svg.setAttribute('height',String(bodyH));
  svg.setAttribute('aria-hidden','true');

  var r=Math.min(RADIUS,ROW_HEIGHT/2-2);
  var base=document.createElementNS('http://www.w3.org/2000/svg','path');
  base.setAttribute('class','branched-menu__base');
  base.setAttribute('d','M '+TRUNK+' 0 V '+(rowY(group.children.length-1)-r));
  svg.appendChild(base);

  group.children.forEach(function(kid,k){
    var branch=document.createElementNS('http://www.w3.org/2000/svg','path');
    branch.setAttribute('class','branched-menu__base');
    branch.setAttribute('d',branchPath(k));
    svg.appendChild(branch);
  });

  group.children.forEach(function(kid,k){
    var reach=document.createElementNS('http://www.w3.org/2000/svg','path');
    var length=pathLength(k);
    reach.setAttribute('class','branched-menu__reach');
    reach.setAttribute('d',reachPath(k));
    reach.dataset.value=kid.value;
    reach.dataset.length=String(length);
    reach.style.strokeDasharray=String(length);
    reach.style.strokeDashoffset=kid.value===menuState.active?'0':String(length);
    svg.appendChild(reach);
  });

  tree.appendChild(svg);

  group.children.forEach(function(kid){
    var button=document.createElement('button');
    button.type='button';
    button.className='branched-menu__item';
    button.dataset.value=kid.value;
    if(kid.value===menuState.active){
      button.setAttribute('aria-current','true');
      button.setAttribute('data-active','');
    }
    button.tabIndex=menuState.open.has(index)?0:-1;
    button.innerHTML=iconMarkup(kid.icon)+'<span class="branched-menu__label"></span>';
    button.querySelector('.branched-menu__label').textContent=kid.label;
    button.addEventListener('click',function(){selectItem(menu,kid.value,kid);});
    tree.appendChild(button);
  });

  fold.appendChild(tree);
  body.appendChild(fold);
  section.appendChild(body);
  return section;
}

function mountBranchedMenu(blank){
  if(!blank)return null;
  var existing=blank.querySelector('#hashcodToolbookBranchedMenu');
  if(existing)return existing;

  var panel=document.createElement('section');
  panel.id='hashcodToolbookBranchedMenuPanel';
  panel.setAttribute('aria-label','Branched menu panel');

  var menu=document.createElement('nav');
  menu.id='hashcodToolbookBranchedMenu';
  menu.className='branched-menu';
  menu.setAttribute('aria-label','Branched menu');
  menu.style.setProperty('--bm-w','240px');
  menu.style.setProperty('--bm-ink','#f5f5f5');
  menu.style.setProperty('--bm-accent','#f5f5f5');
  menu.style.setProperty('--bm-line','#3f3f46');
  menu.style.setProperty('--bm-font','14px');
  menu.style.setProperty('--bm-row','36px');
  menu.style.setProperty('--bm-indent','40px');
  menu.style.setProperty('--bm-line-w','1.5');
  menu.style.setProperty('--bm-draw','400ms');
  menu.style.setProperty('--bm-fold','300ms');

  var marker=document.createElement('span');
  marker.className='branched-menu__marker';
  marker.setAttribute('aria-hidden','true');
  menu.appendChild(marker);

  MENU_ITEMS.forEach(function(group,index){
    menu.appendChild(renderGroup(menu,group,index));
  });

  panel.appendChild(menu);
  blank.appendChild(panel);

  requestAnimationFrame(function(){
    placeMarker(menu,false);
  });

  if(typeof ResizeObserver==='function'){
    var first=true;
    var ro=new ResizeObserver(function(){
      if(first){first=false;return;}
      placeMarker(menu,false);
    });
    ro.observe(menu);
  }

  window.HashcodBranchedMenu={
    items:MENU_ITEMS,
    config:{
      defaultOpen:[0,1],
      defaultActive:'quick',
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
    select:function(value){
      for(var g=0;g<MENU_ITEMS.length;g++){
        for(var i=0;i<MENU_ITEMS[g].children.length;i++){
          if(MENU_ITEMS[g].children[i].value===value){
            selectItem(menu,value,MENU_ITEMS[g].children[i]);
            return true;
          }
        }
      }
      return false;
    },
    toggle:function(index){toggleGroup(menu,index);},
    getActive:function(){return menuState.active;},
    getOpen:function(){return Array.from(menuState.open);}
  };

  return menu;
}

function createBlankRoot(){
  var blank=document.createElement('main');
  blank.id='hashcodToolbookBlankPage';
  blank.setAttribute('aria-label','Toolbook workspace');
  blank.setAttribute('data-hashcod-toolbook-blank','true');
  mountBranchedMenu(blank);
  return blank;
}

function keepBlank(){
  if(!activated||!document.body)return;
  var blank=document.getElementById('hashcodToolbookBlankPage');
  if(!blank){
    blank=createBlankRoot();
    document.body.appendChild(blank);
  }else{
    mountBranchedMenu(blank);
  }
  Array.from(document.body.children).forEach(function(node){
    if(node===blank)return;
    try{node.remove();}catch(_){}
  });
}

function activate(){
  if(activated||!document.body)return;
  activated=true;
  document.documentElement.dataset.hashcodToolbookPageBlank='true';
  document.documentElement.classList.add('hashcod-toolbook-page-blank');

  try{
    if(document.getAnimations)document.getAnimations().forEach(function(animation){try{animation.cancel();}catch(_){}});
  }catch(_){}

  var blank=createBlankRoot();
  document.body.replaceChildren(blank);
  document.body.className='hashcod-toolbook-page-blank-body';
  document.body.removeAttribute('style');

  if(surfaceObserver){surfaceObserver.disconnect();surfaceObserver=null;}
  if(timer){window.clearInterval(timer);timer=0;}

  if(typeof MutationObserver==='function'){
    bodyObserver=new MutationObserver(function(){keepBlank();});
    bodyObserver.observe(document.body,{childList:true});
  }

  window.HashcodToolbookBlankPage={active:true,version:'20261003-blank3'};
  try{window.dispatchEvent(new CustomEvent('hashcod:toolbook-page-blanked'));}catch(_){}
}

function watch(){
  if(platformEntered()||visibleToolbookSurface()){activate();return;}

  window.addEventListener('hashcod:platform-entered',activate,{once:true});

  if(document.body&&typeof MutationObserver==='function'){
    surfaceObserver=new MutationObserver(function(){
      if(platformEntered()||visibleToolbookSurface())activate();
    });
    surfaceObserver.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden','aria-hidden']});
  }

  var attempts=0;
  timer=window.setInterval(function(){
    attempts++;
    if(platformEntered()||visibleToolbookSurface()){activate();return;}
    if(attempts>240){
      window.clearInterval(timer);
      timer=0;
      if(surfaceObserver){surfaceObserver.disconnect();surfaceObserver=null;}
    }
  },125);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});
else watch();
})();