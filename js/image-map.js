(()=>{
  const M='https://www.usmint.gov/content/dam/usmint/image-library/coins';
  const key=(denomination,year,name)=>`${denomination}|${year}|${name}`;
  const map={};
  const add=(denomination,year,name,obverse,reverse)=>{map[key(denomination,year,name)]={obverse,reverse,source:'United States Mint'};};

  add('10¢','2026','Emerging Liberty Dime',`${M}/2026/SemiQ-Dime-Obverse-Unc-P.jpg`,`${M}/2026/SemiQ-Dime-Reverse-Unc.jpg`);
  add('5¢','2026','1776 ~ 2026 Nickel',`${M}/2026/SemiQ-Nickel-Obverse-Unc-P.jpg`,`${M}/2026/SemiQ-Nickel-Reverse-Unc.jpg`);
  add('50¢','2026','Enduring Liberty',`${M}/2026/SemiQ-Half-Dollar-Obverse-Unc-P.jpg`,`${M}/2026/SemiQ-Half-Dollar-Reverse-Unc.jpg`);
  add('$1','2026','President Donald J. Trump',`${M}/2026/Donald-Trump-Circulating-Dollar-Obverse.jpg`,`${M}/2026/Donald-Trump-Circulating-Dollar-Reverse.jpg`);

  const semiQ={
    'Mayflower Compact':'Mayflower',
    'Revolutionary War':'Revolutionary-War',
    'Declaration of Independence':'Declaration',
    'U.S. Constitution':'Constitution',
    'Gettysburg Address':'Gettysburg'
  };
  Object.entries(semiQ).forEach(([name,file])=>add('25¢','2026',name,
    `${M}/2026/SemiQ-${file}-Obverse-Unc-P.jpg`,`${M}/2026/SemiQ-${file}-Reverse-Unc.jpg`));

  ['Baseball','Golf','Soccer','Softball','Snowboarding'].forEach(name=>add('25¢','2027',name,
    `${M}/2027/youth-sports-quarter-obverse.jpg`,`${M}/2027/youth-sports-quarter-${name.toLowerCase()}-reverse.jpg`));
  add('50¢','2027','Wheelchair Basketball',`${M}/2027/half-dollar-proof-obverse.jpg`,`${M}/2027/half-dollar-proof-reverse.jpg`);

  window.US_COIN_IMAGE_MAP={map,key};
})();
