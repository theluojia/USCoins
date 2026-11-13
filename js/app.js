(()=>{
  const coins=window.US_COINS||[];
  const coinImages=window.US_COIN_IMAGES||{};
  const descriptions=window.US_COIN_DESCRIPTIONS||{};
  const i18n=window.US_I18N;
  const storeKey='uscoins-owned-v2';
  const text={
    zh:{catalog:'图鉴',panorama:'全景图',eyebrow:'CIRCULATING COMMEMORATIVES',heroTitle:'美国流通纪念币<br><em>图鉴</em>',heroText:'按面值、系列和年份浏览美国流通纪念币，并记录个人收藏状态。',coinTypes:'种面型',seriesCount:'个系列',owned:'已收藏',search:'搜索',searchPlaceholder:'州、人物、系列…',denomination:'面值',series:'系列',year:'年份',all:'全部',reset:'重置',empty:'没有符合条件的币种。',result:'显示 {shown} / {total} 种面型',obverse:'正面',reverse:'反面',mintTitle:'厂标 {mint}：点击切换收藏状态',mintAria:'{mint}，{state}',collected:'已收藏',notCollected:'未收藏',footerNote:'US COINS · 静态图鉴 · 收藏状态保存在当前浏览器',pageTitle:'US Coins · 美国流通纪念币图鉴',pageDescription:'美国流通纪念币图鉴与收藏记录'},
    en:{catalog:'Catalog',panorama:'Panorama',eyebrow:'CIRCULATING COMMEMORATIVES',heroTitle:'United States<br><em>Coin Guide</em>',heroText:'Browse United States circulating commemoratives by denomination, series, and year, then track your collection.',coinTypes:'coin designs',seriesCount:'series',owned:'collected',search:'Search',searchPlaceholder:'State, person, or series…',denomination:'Denomination',series:'Series',year:'Year',all:'All',reset:'Reset',empty:'No coins match these filters.',result:'Showing {shown} of {total} coin designs',obverse:'OBVERSE',reverse:'REVERSE',mintTitle:'Mint mark {mint}: click to toggle collection status',mintAria:'{mint}, {state}',collected:'Collected',notCollected:'Not collected',footerNote:'US COINS · STATIC GUIDE · COLLECTION STATUS IS STORED IN THIS BROWSER',pageTitle:'US Coins · Circulating Commemorative Coin Guide',pageDescription:'A guide to United States circulating commemorative coins and a browser-local collection record'}
  };
  let language=i18n.language;
  let owned={};
  try{owned=JSON.parse(localStorage.getItem(storeKey)||'{}')}catch(_){owned={}}
  const $=s=>document.querySelector(s);
  const grid=$('#coinGrid'),template=$('#cardTemplate');
  const controls={search:$('#search'),denomination:$('#denomination'),series:$('#series'),year:$('#year')};
  const denominationOrder=new Map(['25¢','$1','1¢','10¢','5¢','50¢'].map((value,index)=>[value,index]));
  const originalOrder=new Map(coins.map((coin,index)=>[coin.id,index]));
  const seriesZh=window.US_SERIES_ZH||{};
  const copy=key=>text[language][key]||key;
  const interpolate=(value,variables={})=>value.replace(/\{(\w+)\}/g,(_,key)=>variables[key]??'');
  const localSeries=series=>language==='zh'?(seriesZh[series]||series):series;
  const localName=coin=>language==='zh'?(coin.nameZh||coin.name):coin.name;
  const descriptionFor=coin=>{
    const saved=descriptions[coin.id]?.[language];
    if(saved)return saved;
    if(coin.series==='Presidential Dollar')return language==='zh'?`${coin.nameZh||coin.name}肖像；美国总统1美元系列。`:`Portrait of ${coin.name}; Presidential $1 Coin Program.`;
    return '';
  };
  const issueYear=coin=>Number((coin.year.match(/\d{4}/)||['9999'])[0]);
  const chronological=(a,b)=>(denominationOrder.get(a.denomination)??99)-(denominationOrder.get(b.denomination)??99)||issueYear(a)-issueYear(b)||(originalOrder.get(a.id)??0)-(originalOrder.get(b.id)??0);
  const unique=field=>[...new Set(coins.map(c=>c[field]))].sort((a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true}));

  function applyChrome(){
    document.title=copy('pageTitle');
    document.querySelector('meta[name="description"]').content=copy('pageDescription');
    document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=copy(el.dataset.i18n));
    document.querySelectorAll('[data-i18n-html]').forEach(el=>el.innerHTML=copy(el.dataset.i18nHtml));
    controls.search.placeholder=copy('searchPlaceholder');
    document.querySelector('.toolbar').setAttribute('aria-label',language==='zh'?'筛选':'Filters');
    document.querySelectorAll('a.panorama-link').forEach(link=>{link.href=i18n.link('panorama/')});
    document.querySelectorAll('[data-language]').forEach(button=>{
      const active=button.dataset.language===language;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
  }
  function fillControls(){
    const previous=Object.fromEntries(Object.entries(controls).map(([key,el])=>[key,el.value]));
    const fill=(el,items,label=value=>value)=>{
      el.replaceChildren();
      const all=document.createElement('option');all.value='';all.textContent=copy('all');el.append(all);
      items.forEach(value=>{const option=document.createElement('option');option.value=value;option.textContent=label(value);el.append(option)});
    };
    fill(controls.denomination,unique('denomination'));
    fill(controls.series,unique('series'),localSeries);
    fill(controls.year,unique('year'));
    Object.entries(previous).forEach(([key,value])=>{controls[key].value=value});
  }
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
  function render(){
    const q=controls.search.value.trim().toLowerCase();
    const filtered=coins.filter(c=>(!controls.denomination.value||c.denomination===controls.denomination.value)&&(!controls.series.value||c.series===controls.series.value)&&(!controls.year.value||c.year===controls.year.value)&&(!q||`${c.name} ${c.nameZh} ${c.series} ${seriesZh[c.series]||''}`.toLowerCase().includes(q))).sort(chronological);
    grid.replaceChildren();
    filtered.forEach(coin=>{
      const node=template.content.cloneNode(true),card=node.querySelector('.coin-card');
      const name=localName(coin),description=descriptionFor(coin);
      card.dataset.id=coin.id;
      card.title=[name,description].filter(Boolean).join(' · ');
      node.querySelector('.denom').textContent=coin.denomination;
      node.querySelector('.year').textContent=coin.year;
      node.querySelector('.series-name').textContent=localSeries(coin.series);
      node.querySelector('h3').textContent=name;
      const descriptionEl=node.querySelector('.description');
      descriptionEl.textContent=description;
      descriptionEl.hidden=!description;
      node.querySelector('.obverse-caption').textContent=copy('obverse');
      node.querySelector('.reverse-caption').textContent=copy('reverse');
      const images=coinImages[coin.id]||{};
      setImage(node.querySelector('.obverse'),images.obverse,`${name} · ${copy('obverse')}`);
      setImage(node.querySelector('.reverse'),images.reverse,`${name} · ${copy('reverse')}`);
      const mints=node.querySelector('.mints');
      coin.mints.forEach(m=>{
        const id=`${coin.id}|${m}`,collected=Boolean(owned[id]);
        const button=document.createElement('button');
        button.type='button';button.className=collected?'owned':'';button.textContent=m;
        button.title=interpolate(copy('mintTitle'),{mint:m});
        button.setAttribute('aria-label',interpolate(copy('mintAria'),{mint:m,state:collected?copy('collected'):copy('notCollected')}));
        button.setAttribute('aria-pressed',String(collected));
        button.addEventListener('click',()=>{
          owned[id]=!owned[id];button.classList.toggle('owned',owned[id]);
          button.setAttribute('aria-pressed',String(owned[id]));
          button.setAttribute('aria-label',interpolate(copy('mintAria'),{mint:m,state:owned[id]?copy('collected'):copy('notCollected')}));save();
        });
        mints.append(button);
      });
      grid.append(node);
    });
    $('#resultCount').textContent=interpolate(copy('result'),{shown:filtered.length,total:coins.length});
    $('#empty').hidden=filtered.length!==0;
  }
  i18n.onChange(next=>{language=next;applyChrome();fillControls();render()});
  Object.values(controls).forEach(el=>el.addEventListener(el===controls.search?'input':'change',render));
  $('#reset').addEventListener('click',()=>{Object.values(controls).forEach(el=>el.value='');render()});
  document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>i18n.set(button.dataset.language)));

  const siteFooter=$('#siteFooter');
  const updateFooterState=()=>{
    const root=document.documentElement;
    const atBottom=window.scrollY+window.innerHeight>=root.scrollHeight-4;
    siteFooter.dataset.state=atBottom?'bottom':window.scrollY<24?'top':'middle';
  };
  let footerFrame;
  window.addEventListener('scroll',()=>{cancelAnimationFrame(footerFrame);footerFrame=requestAnimationFrame(updateFooterState)},{passive:true});
  window.addEventListener('resize',updateFooterState,{passive:true});
  $('#jumpTop').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  $('#jumpBottom').addEventListener('click',()=>{siteFooter.dataset.state='middle';requestAnimationFrame(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'}))});
  applyChrome();fillControls();updateStats();render();updateFooterState();
})();
