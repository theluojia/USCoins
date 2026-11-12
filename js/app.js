(()=>{
  const coins=window.US_COINS||[];
  const coinImages=window.US_COIN_IMAGES||{};
  const storeKey='uscoins-owned-v2';
  let owned={};
  try{owned=JSON.parse(localStorage.getItem(storeKey)||'{}')}catch(_){owned={}}
  const $=s=>document.querySelector(s);
  const grid=$('#coinGrid'),template=$('#cardTemplate');
  const controls={search:$('#search'),denomination:$('#denomination'),series:$('#series'),year:$('#year')};
  const denominationOrder=new Map(['25¢','$1','1¢','10¢','5¢','50¢'].map((value,index)=>[value,index]));
  const originalOrder=new Map(coins.map((coin,index)=>[coin.id,index]));
  const issueYear=coin=>Number((coin.year.match(/\d{4}/)||['9999'])[0]);
  const chronological=(a,b)=>(denominationOrder.get(a.denomination)??99)-(denominationOrder.get(b.denomination)??99)||issueYear(a)-issueYear(b)||(originalOrder.get(a.id)??0)-(originalOrder.get(b.id)??0);

  const unique=(field)=>[...new Set(coins.map(c=>c[field]))].sort((a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true}));
  const fill=(el,items)=>items.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;el.append(o)});
  fill(controls.denomination,unique('denomination'));
  fill(controls.series,unique('series'));
  fill(controls.year,unique('year'));

  const save=()=>{localStorage.setItem(storeKey,JSON.stringify(owned));updateStats()};
  const updateStats=()=>{
    $('#statCoins').textContent=coins.length;
    $('#statSeries').textContent=unique('series').length;
    $('#statOwned').textContent=Object.values(owned).filter(Boolean).length;
  };
  const setImage=(img,url,alt)=>{
    const box=img.closest('.coin-image');img.alt=alt;
    if(!url){box.classList.add('missing');return}
    img.addEventListener('load',()=>box.classList.add('loaded'),{once:true});
    img.addEventListener('error',()=>{img.removeAttribute('src');box.classList.remove('loaded');box.classList.add('missing')},{once:true});
    img.src=url;
  };
  const render=()=>{
    const q=controls.search.value.trim().toLowerCase();
    const filtered=coins.filter(c=>(!controls.denomination.value||c.denomination===controls.denomination.value)&&(!controls.series.value||c.series===controls.series.value)&&(!controls.year.value||c.year===controls.year.value)&&(!q||`${c.name} ${c.nameZh} ${c.series} ${c.year}`.toLowerCase().includes(q))).sort(chronological);
    grid.replaceChildren();
    filtered.forEach(coin=>{
      const node=template.content.cloneNode(true),card=node.querySelector('.coin-card');
      card.dataset.id=coin.id;
      card.title=`${coin.name} · ${coin.nameZh}`;
      node.querySelector('.denom').textContent=coin.denomination;
      node.querySelector('.year').textContent=coin.year;
      node.querySelector('.series-name').textContent=coin.series;
      node.querySelector('h3').textContent=coin.name;
      node.querySelector('.name-zh').textContent=coin.nameZh;
      const images=coinImages[coin.id]||{};
      setImage(node.querySelector('.obverse'),images.obverse,`${coin.name} 正面`);
      setImage(node.querySelector('.reverse'),images.reverse,`${coin.name} 反面`);
      const mints=node.querySelector('.mints');
      coin.mints.forEach(m=>{const id=`${coin.id}|${m}`;const b=document.createElement('button');b.type='button';b.className=owned[id]?'owned':'';b.textContent=m;b.title=`${m}：点击切换收藏状态`;b.setAttribute('aria-pressed',owned[id]?'true':'false');b.addEventListener('click',()=>{owned[id]=!owned[id];b.classList.toggle('owned',owned[id]);b.setAttribute('aria-pressed',String(owned[id]));save()});mints.append(b)});
      grid.append(node);
    });
    $('#resultCount').textContent=`显示 ${filtered.length} / ${coins.length} 种面型`;
    $('#empty').hidden=filtered.length!==0;
  };
  Object.values(controls).forEach(el=>el.addEventListener(el===controls.search?'input':'change',render));
  $('#reset').addEventListener('click',()=>{Object.values(controls).forEach(el=>el.value='');render()});

  const siteFooter=$('#siteFooter');
  const updateFooterState=()=>{
    const root=document.documentElement;
    const atBottom=window.scrollY+window.innerHeight>=root.scrollHeight-4;
    const state=atBottom?'bottom':window.scrollY<24?'top':'middle';
    siteFooter.dataset.state=state;
  };
  let footerFrame;
  window.addEventListener('scroll',()=>{
    cancelAnimationFrame(footerFrame);
    footerFrame=requestAnimationFrame(updateFooterState);
  },{passive:true});
  window.addEventListener('resize',updateFooterState,{passive:true});
  $('#jumpTop').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  $('#jumpBottom').addEventListener('click',()=>{
    siteFooter.dataset.state='middle';
    requestAnimationFrame(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'}));
  });
  updateStats();render();
  updateFooterState();
})();
