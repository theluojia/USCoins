(()=>{
  const coins=window.US_COINS||[];
  const coinImages=window.US_COIN_IMAGES||{};
  const storeKey='uscoins-owned-v2';
  let owned={};
  try{owned=JSON.parse(localStorage.getItem(storeKey)||'{}')}catch(_){owned={}}
  const diameters={'1¢':19.05,'10¢':17.91,'5¢':21.21,'25¢':24.26,'$1':26.49,'50¢':30.61};
  const denominationOrder=['25¢','$1','1¢','10¢','5¢','50¢'];
  const originalOrder=new Map(coins.map((coin,index)=>[coin.id,index]));
  const seriesZh=window.US_SERIES_ZH||{};
  const $=selector=>document.querySelector(selector);
  const controls={mode:$('#mode'),group:$('#group'),side:$('#side')};
  const yearOf=coin=>Number((coin.year.match(/\d{4}/)||['9999'])[0]);
  const imageFor=(coin,side)=>{
    return coinImages[coin.id]?.[side]||'';
  };
  const escapeHtml=value=>String(value).replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));

  function options(){
    const values=controls.mode.value==='denomination'
      ?denominationOrder.filter(value=>coins.some(coin=>coin.denomination===value))
      :[...new Set(coins.map(coin=>coin.series))];
    const previous=controls.group.value;
    controls.group.replaceChildren(...values.map(value=>{
      const option=document.createElement('option');option.value=value;
      option.textContent=controls.mode.value==='series'?(seriesZh[value]||value):value;
      return option;
    }));
    if(values.includes(previous))controls.group.value=previous;
  }

  function fitSheetToViewport(){
    const frame=$('#sheetFrame'),sheets=[...document.querySelectorAll('.sheet')];
    if(!frame||!sheets.length)return;
    const viewportWidth=window.visualViewport?.width||document.documentElement.clientWidth||window.innerWidth;
    const pagePadding=viewportWidth<=820?16:36;
    const availableWidth=Math.max(1,viewportWidth-pagePadding);
    const scale=Math.min(1,availableWidth/sheets[0].offsetWidth);
    frame.style.width=`${sheets[0].offsetWidth*scale}px`;
    sheets.forEach(sheet=>{
      const page=sheet.closest('.sheet-page');
      sheet.style.transform=`scale(${scale})`;
      page.style.width=`${sheet.offsetWidth*scale}px`;
      page.style.height=`${sheet.offsetHeight*scale}px`;
    });
  }

  function createPage(frame,title,summary){
    const page=document.createElement('div');
    page.className='sheet-page';
    page.innerHTML=`<main class="sheet"><header><p>UNITED STATES CIRCULATING COMMEMORATIVES</p><h1>${escapeHtml(title)}</h1><div class="meta"><span>${escapeHtml(summary)}</span><span class="collection-legend"><b>●</b> 已收藏　○ 未收藏</span><span class="page-number"></span></div></header><section class="coin-flow"></section><a class="sheet-site-link" href="https://theluojia.github.io/USCoins/">theluojia.github.io/USCoins/</a></main>`;
    frame.append(page);
    return page.querySelector('.coin-flow');
  }

  function yearBadge(year){
    const badge=document.createElement('span');
    badge.className='year-badge';
    badge.textContent=year;
    return badge;
  }

  function coinItem(coin,side){
    const src=imageFor(coin,side),diameter=coin.diameter||diameters[coin.denomination]||24.26;
    const mintBadges=coin.mints.map(mint=>{
      const collected=Boolean(owned[`${coin.id}|${mint}`]);
      return `<span class="mint-badge${collected?' owned':''}" title="${escapeHtml(mint)} · ${collected?'已收藏':'未收藏'}" aria-label="${escapeHtml(mint)}，${collected?'已收藏':'未收藏'}">${escapeHtml(mint)}</span>`;
    }).join('');
    const item=document.createElement('article');
    item.className='coin-item';
    item.style.setProperty('--diameter',diameter);
    item.title=`${coin.name} · ${diameter} mm`;
    item.innerHTML=`<div class="coin-face${src?'':' missing'}">${src?`<img src="../${escapeHtml(src)}" alt="${escapeHtml(coin.nameZh)}" loading="lazy">`:''}<div class="mint-status">${mintBadges}</div></div><div class="coin-name">${escapeHtml(coin.nameZh)}</div>`;
    return item;
  }

  function render(){
    const mode=controls.mode.value,group=controls.group.value,side=controls.side.value;
    const selected=coins.filter(coin=>coin[mode]===group).sort((a,b)=>yearOf(a)-yearOf(b)||(originalOrder.get(a.id)??0)-(originalOrder.get(b.id)??0));
    const label=mode==='series'?(seriesZh[group]||group):group;
    const title=`${label} · ${side==='reverse'?'反面':'正面'}全景图`;
    const themes=[...new Set(selected.map(coin=>coin.series))];
    const themeNames=themes.map(theme=>seriesZh[theme]||theme);
    const summary=`${selected.length} 枚 · ${themes.length} 个相关主题：${themeNames.join('、')}`;
    const frame=$('#sheetFrame');
    frame.replaceChildren();
    let flow=createPage(frame,title,summary);
    let lastYear='';
    for(const coin of selected){
      const yearChanged=coin.year!==lastYear;
      const nodes=yearChanged?[yearBadge(coin.year),coinItem(coin,side)]:[coinItem(coin,side)];
      nodes.forEach(node=>flow.append(node));
      if(flow.scrollHeight>flow.clientHeight+1){
        nodes.forEach(node=>node.remove());
        flow=createPage(frame,title,summary);
        nodes.forEach(node=>flow.append(node));
      }
      lastYear=coin.year;
    }
    const pages=[...frame.querySelectorAll('.sheet-page')];
    pages.forEach((page,index)=>page.querySelector('.page-number').textContent=`第 ${index+1} / ${pages.length} 页`);
    requestAnimationFrame(()=>requestAnimationFrame(fitSheetToViewport));
  }

  controls.mode.addEventListener('change',()=>{options();render()});
  controls.group.addEventListener('change',render);
  controls.side.addEventListener('change',render);
  $('#print').addEventListener('click',()=>window.print());
  let resizeFrame;
  window.addEventListener('resize',()=>{
    cancelAnimationFrame(resizeFrame);
    resizeFrame=requestAnimationFrame(fitSheetToViewport);
  },{passive:true});
  window.visualViewport?.addEventListener('resize',()=>{
    cancelAnimationFrame(resizeFrame);
    resizeFrame=requestAnimationFrame(fitSheetToViewport);
  },{passive:true});
  window.addEventListener('load',fitSheetToViewport,{once:true});
  window.addEventListener('pageshow',fitSheetToViewport);
  window.addEventListener('storage',event=>{
    if(event.key!==storeKey)return;
    try{owned=JSON.parse(event.newValue||'{}')}catch(_){owned={}}
    render();
  });
  options();render();
  fitSheetToViewport();
})();
