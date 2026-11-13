(()=>{
  const key='uscoins-language';
  const supported=['zh','en'];
  const normalize=value=>supported.includes(value)?value:'zh';
  const urlLanguage=()=>{
    try{
      const value=new URLSearchParams(window.location.search).get('lang');
      return supported.includes(value)?value:null;
    }catch(_){return null}
  };
  const storedLanguage=()=>{
    try{return normalize(localStorage.getItem(key))}catch(_){return 'zh'}
  };
  const readLanguage=()=>urlLanguage()||storedLanguage();
  const listeners=new Set();
  let language=readLanguage();

  const applyDocument=()=>{document.documentElement.lang=language==='zh'?'zh-CN':'en'};
  const remember=next=>{
    try{localStorage.setItem(key,next)}catch(_){}
    try{
      const url=new URL(window.location.href);
      if(url.searchParams.get('lang')!==next){
        url.searchParams.set('lang',next);
        window.history.replaceState(null,'',url.href);
      }
    }catch(_){}
  };
  const notify=()=>{listeners.forEach(listener=>listener(language))};
  const setLanguage=next=>{
    const normalized=normalize(next);
    if(normalized===language){applyDocument();return}
    language=normalized;
    remember(language);
    applyDocument();
    notify();
  };
  const refresh=()=>{
    const next=readLanguage();
    if(next===language){applyDocument();return false}
    language=next;
    applyDocument();
    notify();
    return true;
  };

  if(urlLanguage())remember(language);

  window.addEventListener('storage',event=>{
    if(event.key!==key)return;
    const next=normalize(event.newValue);
    if(next===language)return;
    language=next;
    remember(language);
    applyDocument();
    notify();
  });
  window.addEventListener('pageshow',refresh);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh()});

  applyDocument();

  window.US_I18N={
    key,
    supported,
    get language(){return language},
    get locale(){return language==='zh'?'zh-CN':'en'},
    set:setLanguage,
    refresh,
    onChange(listener){listeners.add(listener);return()=>listeners.delete(listener)},
    link(href){
      const url=new URL(href,window.location.href);
      url.searchParams.set('lang',language);
      return url.href;
    }
  };
})();
