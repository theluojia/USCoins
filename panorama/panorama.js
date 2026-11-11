(()=>{
  const coins=window.US_COINS||[];
  const official=window.US_COIN_IMAGE_MAP||{map:{},key:()=>''};
  const localImages=window.US_COIN_LOCAL_IMAGES||{};
  const diameters={'10¢':17.91,'5¢':21.21,'25¢':24.26,'$1':26.49,'50¢':30.61};
  const denominationOrder=['25¢','$1','10¢','5¢','50¢'];
  const originalOrder=new Map(coins.map((coin,index)=>[coin.id,index]));
  const seriesZh={'U.S. Bicentennial Coinage':'美国建国二百周年','50 State Quarters':'美国五十州','D.C. & U.S. Territories':'哥伦比亚特区与美国领地','America the Beautiful':'美丽国家公园','Washington Quarter':'华盛顿25美分','American Women Quarters':'美国杰出女性','Semiquincentennial':'美国建国250周年','Youth Sports':'青少年体育','Sacagawea Dollar':'萨卡加维亚1美元','Native American Dollar':'美国原住民1美元','Presidential Dollar':'美国总统1美元','American Innovation':'美国创新1美元','Westward Journey':'西进之旅','Paralympic Sports':'残奥体育'};
  const $=selector=>document.querySelector(selector);
  const controls={mode:$('#mode'),group:$('#group'),side:$('#side')};
  const commons=file=>file?`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(file)}?width=640`:'';
  const yearOf=coin=>Number((coin.year.match(/\d{4}/)||['9999'])[0]);
  const imageFor=(coin,side)=>{
    const fixed=official.map[official.key(coin.denomination,coin.year,coin.name)];
    const source=fixed?.[side]||commons(coin[`${side}File`]);
    return source?localImages[source]||'':'';
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

  function fit(){
    const flow=$('#flow');
    let scale=2.35;
    document.documentElement.style.setProperty('--coin-scale',`${scale}px`);
    for(let i=0;i<7&&flow.scrollHeight>flow.clientHeight;i++){
      scale=Math.max(1.2,scale*Math.sqrt(flow.clientHeight/flow.scrollHeight)*.975);
      document.documentElement.style.setProperty('--coin-scale',`${scale}px`);
    }
  }

  function fitSheetToViewport(){
    const sheet=$('#sheet'),frame=$('#sheetFrame');
    if(!sheet||!frame)return;
    const viewportWidth=window.visualViewport?.width||document.documentElement.clientWidth||window.innerWidth;
    const pagePadding=viewportWidth<=820?16:36;
    const availableWidth=Math.max(1,viewportWidth-pagePadding);
    const scale=Math.min(1,availableWidth/sheet.offsetWidth);
    sheet.style.setProperty('transform',`scale(${scale})`,'important');
    frame.style.width=`${sheet.offsetWidth*scale}px`;
    frame.style.height=`${sheet.offsetHeight*scale}px`;
  }

  function render(){
    const mode=controls.mode.value,group=controls.group.value,side=controls.side.value;
    const selected=coins.filter(coin=>coin[mode]===group).sort((a,b)=>yearOf(a)-yearOf(b)||(originalOrder.get(a.id)??0)-(originalOrder.get(b.id)??0));
    let lastYear='';
    const html=[];
    for(const coin of selected){
      if(coin.year!==lastYear){html.push(`<span class="year-badge">${escapeHtml(coin.year)}</span>`);lastYear=coin.year}
      const src=imageFor(coin,side),diameter=coin.diameter||diameters[coin.denomination]||24.26;
      html.push(`<article class="coin-item" style="--diameter:${diameter}" title="${escapeHtml(coin.name)} · ${diameter} mm">`+
        `<div class="coin-face${src?'':' missing'}">${src?`<img src="../${escapeHtml(src)}" alt="${escapeHtml(coin.nameZh)}" loading="lazy">`:''}</div>`+
        `<div class="coin-name">${escapeHtml(coin.nameZh)}</div></article>`);
    }
    $('#flow').innerHTML=html.join('');
    const label=mode==='series'?(seriesZh[group]||group):group;
    $('#title').textContent=`${label} · ${side==='reverse'?'反面':'正面'}全景图`;
    const sizes=[...new Set(selected.map(coin=>`${coin.denomination} ${coin.diameter||diameters[coin.denomination]} mm`))];
    $('#summary').textContent=`${selected.length} 种面型 · ${sizes.join(' / ')}`;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{fit();fitSheetToViewport()}));
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
  options();render();
  fitSheetToViewport();
})();
