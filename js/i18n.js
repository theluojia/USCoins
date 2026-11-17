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
    try{
      const value=localStorage.getItem(key);
      return supported.includes(value)?value:null;
    }catch(_){return null}
  };
  const readLanguage=()=>storedLanguage()||urlLanguage()||'zh';
  const listeners=new Set();
  let language=readLanguage();

  const applyDocument=()=>{document.documentElement.lang=language==='zh'?'zh-CN':'en'};
  const remember=next=>{
    try{localStorage.setItem(key,next)}catch(_){}
  };
  const notify=()=>{listeners.forEach(listener=>listener(language))};
  const setLanguage=next=>{
    const normalized=normalize(next);
    if(normalized===language){remember(language);applyDocument();return}
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

  if(!storedLanguage()&&urlLanguage())remember(language);

  window.addEventListener('storage',event=>{
    if(event.key!==key)return;
    const next=normalize(event.newValue);
    if(next===language)return;
    language=next;
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
    onChange(listener){listeners.add(listener);return()=>listeners.delete(listener)}
  };
})();
