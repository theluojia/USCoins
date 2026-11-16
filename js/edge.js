/* Edge lettering of United States dollar coins, drawn as an unrolled band.
   Data follows the U.S. Mint / Wikipedia descriptions:
   - 2007 Presidential: date + mint mark, then E PLURIBUS UNUM and IN GOD WE TRUST,
     separated by dots; no dot after the date.
   - 2008 Presidential: a dot was added after the date.
   - 2009+ Presidential and Native American: IN GOD WE TRUST moved to the obverse;
     edge is ten stars, date and mint mark, three stars, E PLURIBUS UNUM.
   - American Innovation (2018+): same thirteen-star arrangement.
   Every mint mark gets its own band. The inscription is rotated to start with the
   date so the three layouts can be compared line by line. */
(() => {
  const text = value => ({ type: 'text', value });
  const dot = () => ({ type: 'dot' });
  const stars = count => ({ type: 'stars', count });
  const date = () => ({ type: 'date' });
  const space = () => ({ type: 'space' });

  const variants = {
    presidential2007: {
      parts: [date(), space(), text('E PLURIBUS UNUM'), dot(), text('IN GOD WE TRUST'), dot()],
      note: {
        zh: '2007 年版：厂标与 E PLURIBUS UNUM 之间没有圆点；IN GOD WE TRUST 仍在边缘。',
        en: '2007: no dot after the mint mark; IN GOD WE TRUST is still on the edge.'
      }
    },
    presidential2008: {
      parts: [date(), dot(), text('E PLURIBUS UNUM'), dot(), text('IN GOD WE TRUST'), dot()],
      note: {
        zh: '2008 年版：厂标与 E PLURIBUS UNUM 之间增加了一个圆点，其余与 2007 相同。',
        en: '2008: a dot was added after the mint mark; otherwise the same as 2007.'
      }
    },
    presidential2009: {
      parts: [date(), stars(3), text('E PLURIBUS UNUM'), stars(10)],
      note: {
        zh: '2009 年起：IN GOD WE TRUST 移至正面；边缘为日期/厂标 + 3 星 + E PLURIBUS UNUM + 10 星。',
        en: '2009 onward: IN GOD WE TRUST moved to the obverse; edge: date and mint mark, 3 stars, E PLURIBUS UNUM, 10 stars.'
      }
    },
    native2009: {
      parts: [date(), stars(3), text('E PLURIBUS UNUM'), stars(10)],
      note: {
        zh: '2009 年起（《2007 年原住民 $1 硬币法案》）：日期、厂标和 E PLURIBUS UNUM 移至边缘，IN GOD WE TRUST 在正面。',
        en: 'From 2009 (Native American $1 Coin Act of 2007): date, mint mark, and E PLURIBUS UNUM moved to the edge; IN GOD WE TRUST is on the obverse.'
      }
    },
    innovation2018: {
      parts: [date(), stars(3), text('E PLURIBUS UNUM'), stars(10)],
      note: {
        zh: '2018 年起：边缘为日期/厂标 + 3 星 + E PLURIBUS UNUM + 10 星，共 13 颗五角星；IN GOD WE TRUST 在正面。',
        en: 'From 2018: edge reads date and mint mark, 3 stars, E PLURIBUS UNUM, 10 stars — 13 five-pointed stars in all; IN GOD WE TRUST is on the obverse.'
      }
    }
  };

  const yearOf = coin => Number((String(coin.year).match(/\d{4}/) || [])[0]);

  function variantFor(coin) {
    if (coin.series === 'Presidential Dollar') {
      const year = yearOf(coin);
      if (year <= 2007) return variants.presidential2007;
      if (year === 2008) return variants.presidential2008;
      return variants.presidential2009;
    }
    if (coin.series === 'Native American Dollar') return variants.native2009;
    if (coin.series === 'American Innovation') return variants.innovation2018;
    return null;
  }

  function partsFor(variant, coin, mint) {
    return variant.parts.map(part => {
      if (part.type === 'date') return { type: 'date', year: coin.year, mint };
      return part;
    });
  }

  function describe(variant, coin, mint, language) {
    const items = [];
    partsFor(variant, coin, mint).forEach(part => {
      if (part.type === 'text') items.push(part.value);
      else if (part.type === 'date') items.push(`${part.year} ${part.mint}`);
      else if (part.type === 'stars') items.push(`${part.count} ${language === 'zh' ? '颗星' : 'stars'}`);
    });
    return items.join(language === 'zh' ? '，' : ', ');
  }

  function mintMarks(coin) {
    const mints = Array.isArray(coin.mints) && coin.mints.length ? coin.mints : ['P'];
    return [...new Set(mints)];
  }

  function buildBand(variant, coin, mint, language) {
    const band = document.createElement('div');
    band.className = 'edge-band';
    band.setAttribute('role', 'img');
    band.setAttribute('aria-label', `${language === 'zh' ? '边缘铭文：' : 'Edge lettering: '}${describe(variant, coin, mint, language)}`);
    band.title = variant.note[language];

    const line = document.createElement('div');
    line.className = 'edge-line';

    partsFor(variant, coin, mint).forEach(part => {
      let node;
      if (part.type === 'stars') {
        node = document.createElement('span');
        node.className = 'edge-stars';
        node.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < part.count; i += 1) node.append(document.createElement('i'));
      } else if (part.type === 'dot') {
        node = document.createElement('span');
        node.className = 'edge-dot';
        node.setAttribute('aria-hidden', 'true');
        node.textContent = '·';
      } else if (part.type === 'space') {
        node = document.createElement('span');
        node.className = 'edge-space';
        node.setAttribute('aria-hidden', 'true');
      } else if (part.type === 'date') {
        node = document.createElement('span');
        node.className = 'edge-date';
        const year = document.createElement('span');
        year.className = 'edge-year';
        year.textContent = part.year;
        const mintNode = document.createElement('span');
        mintNode.className = 'edge-mint';
        mintNode.textContent = part.mint;
        node.append(year, mintNode);
      } else {
        node = document.createElement('span');
        node.className = 'edge-text';
        node.textContent = part.value;
      }
      line.append(node);
    });

    band.append(line);
    return band;
  }

  function render(coin, options = {}) {
    const variant = variantFor(coin);
    if (!variant) return null;

    const language = options.language === 'en' ? 'en' : 'zh';
    const figure = document.createElement('figure');
    figure.className = 'edge';

    const strips = document.createElement('div');
    strips.className = 'edge-strips';
    mintMarks(coin).forEach(mint => strips.append(buildBand(variant, coin, mint, language)));

    const caption = document.createElement('figcaption');
    caption.className = 'edge-caption';
    caption.textContent = options.label || 'EDGE';

    figure.append(strips, caption);
    return figure;
  }

  window.US_EDGE = { variantFor, render, describe };
})();
