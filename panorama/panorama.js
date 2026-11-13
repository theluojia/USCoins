(()=>{
  const coins=window.US_COINS||[];
  const coinImages=window.US_COIN_IMAGES||{};
  const i18n=window.US_I18N;
  const storeKey='uscoins-owned-v2';
  let language=i18n.language;
  let owned={};
  try{owned=JSON.parse(localStorage.getItem(storeKey)||'{}')}catch(_){owned={}}
  const text={
    zh:{
      pageTitle:'US Coins · 钱币全景图',
      pageDescription:'美国流通纪念币全景图：按面值或主题分组，打印或保存为 PDF。',
      sheetEyebrow:'美国流通纪念币',
      controlsLabel:'全景图设置',
      backAria:'返回图鉴',
      backWide:'← 返回图鉴',
      mode:'分组方式',
      byDenomination:'按币值',
      bySeries:'按主题',
      range:'选择范围',
      sideLabel:'展示币面',
      reverse:'反面',
      obverse:'正面',
      printWide:'打印 / 保存 PDF',
      printCompact:'PDF',
      collected:'已收藏',
      notCollected:'未收藏'
    },
    en:{
      pageTitle:'US Coins · Coin Panorama',
      pageDescription:'A print-ready panorama of United States circulating commemorative coins, grouped by denomination or series.',
      sheetEyebrow:'UNITED STATES CIRCULATING COMMEMORATIVES',
      controlsLabel:'Panorama settings',
      backAria:'Back to the catalog',
      backWide:'← Back to the catalog',
      mode:'Group by',
      byDenomination:'By denomination',
      bySeries:'By series',
      range:'Range',
      sideLabel:'Coin side',
      reverse:'Reverse',
      obverse:'Obverse',
      printWide:'Print / Save PDF',
      printCompact:'PDF',
      collected:'Collected',
      notCollected:'Not collected'
    }
  };
  const diameters={'1¢':19.05,'10¢':17.91,'5¢':21.21,'25¢':24.26,'$1':26.49,'50¢':30.61};
  const denominationOrder=['25¢','$1','1¢','10¢','5¢','50¢'];
  const originalOrder=new Map(coins.map((coin,index)=>[coin.id,index]));
  const seriesZh=window.US_SERIES_ZH||{};
  const $=selector=>document.querySelector(selector);
  const controls={mode:$('#mode'),group:$('#group'),side:$('#side')};
  const copy=key=>(text[language][key]??key);
  const localSeries=value=>language==='zh'?(seriesZh[value]||value):value;
  const localName=coin=>language==='zh'?(coin.nameZh||coin.name):coin.name;
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
      option.textContent=controls.mode.value==='series'?localSeries(value):value;
      return option;
    }));
    if(values.includes(previous))controls.group.value=previous;
  }

  function applyChrome(){
    document.title=copy('pageTitle');
    const description=document.querySelector('meta[name="description"]');
    if(description)description.content=copy('pageDescription');
    document.querySelector('.controls').setAttribute('aria-label',copy('controlsLabel'));
    document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=copy(el.dataset.i18n)});
    document.querySelectorAll('[data-i18n-aria]').forEach(el=>{el.setAttribute('aria-label',copy(el.dataset.i18nAria))});
    document.querySelector('.back').href=i18n.link('../index.html');
    document.querySelectorAll('[data-language]').forEach(button=>{
      const active=button.dataset.language===language;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
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
    page.innerHTML=`<main class="sheet"><header><p>${escapeHtml(copy('sheetEyebrow'))}</p><h1>${escapeHtml(title)}</h1><div class="meta"><span class="meta-summary">${escapeHtml(summary)}</span><span class="meta-status"><span class="collection-legend"><b>●</b> ${escapeHtml(copy('collected'))}　○ ${escapeHtml(copy('notCollected'))}</span><span class="page-number"></span></span></div></header><section class="coin-flow"></section><a class="sheet-site-link" href="https://theluojia.github.io/USCoins/">theluojia.github.io/USCoins/</a></main>`;
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
    const name=localName(coin);
    const mintBadges=coin.mints.map(mint=>{
      const collected=Boolean(owned[`${coin.id}|${mint}`]);
      const state=collected?copy('collected'):copy('notCollected');
      const stateSeparator=language==='zh'?'，':', ';
      return `<span class="mint-badge${collected?' owned':''}" title="${escapeHtml(`${mint} · ${state}`)}" aria-label="${escapeHtml(`${mint}${stateSeparator}${state}`)}">${escapeHtml(mint)}</span>`;
    }).join('');
    const item=document.createElement('article');
    item.className='coin-item';
    item.style.setProperty('--diameter',diameter);
    item.title=`${name} · ${diameter} mm`;
    item.innerHTML=`<div class="coin-face${src?'':' missing'}">${src?`<img src="../${escapeHtml(src)}" alt="${escapeHtml(name)}" loading="lazy">`:''}<div class="mint-status">${mintBadges}</div></div><div class="coin-name">${escapeHtml(name)}</div>`;
    return item;
  }

  function yearStart(coin,side){
    const start=document.createElement('div');
    start.className='year-start';
    start.append(yearBadge(coin.year),coinItem(coin,side));
    return start;
  }

  function render(){
    const mode=controls.mode.value,group=controls.group.value,side=controls.side.value;
    const selected=coins.filter(coin=>coin[mode]===group).sort((a,b)=>yearOf(a)-yearOf(b)||(originalOrder.get(a.id)??0)-(originalOrder.get(b.id)??0));
    const label=mode==='series'?localSeries(group):group;
    const sideLabel=copy(side);
    const title=language==='zh'?`${label} · ${sideLabel}全景图`:`${label} · ${sideLabel} Panorama`;
    const themes=[...new Set(selected.map(coin=>coin.series))];
    const themeNames=themes.map(localSeries);
    const summary=language==='zh'
      ?`${selected.length} 枚 · ${themes.length} 个相关主题：${themeNames.join('、')}`
      :`${selected.length} ${selected.length===1?'coin':'coins'} · ${themes.length} related series: ${themeNames.join(', ')}`;
    const frame=$('#sheetFrame');
    frame.replaceChildren();
    let flow=createPage(frame,title,summary);
    let lastYear='';
    for(const coin of selected){
      const yearChanged=coin.year!==lastYear;
      const nodes=yearChanged?[yearStart(coin,side)]:[coinItem(coin,side)];
      nodes.forEach(node=>flow.append(node));
      if(flow.scrollHeight>flow.clientHeight+1){
        nodes.forEach(node=>node.remove());
        flow=createPage(frame,title,summary);
        nodes.forEach(node=>flow.append(node));
      }
      lastYear=coin.year;
    }
    const pages=[...frame.querySelectorAll('.sheet-page')];
    pages.forEach((page,index)=>{page.querySelector('.page-number').textContent=language==='zh'?`第 ${index+1} / ${pages.length} 页`:`Page ${index+1} / ${pages.length}`});
    requestAnimationFrame(()=>requestAnimationFrame(fitSheetToViewport));
  }

  i18n.onChange(next=>{
    language=next;
    applyChrome();
    options();
    render();
  });
  document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>i18n.set(button.dataset.language)));
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
  window.addEventListener('pageshow',()=>{i18n.refresh();fitSheetToViewport()});
  window.addEventListener('storage',event=>{
    if(event.key!==storeKey)return;
    try{owned=JSON.parse(event.newValue||'{}')}catch(_){owned={}}
    render();
  });
  applyChrome();options();render();
  fitSheetToViewport();
})();
