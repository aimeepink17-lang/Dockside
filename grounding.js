(() => {
  'use strict';

  const number = value => {
    if (value === undefined || value === null || String(value).trim() === '' || /^(auto|unknown)$/i.test(String(value).trim())) return null;
    const parsed = Number(String(value).replace(',', '.').replace(/[^\d.+-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  };
  const euro = value => {
    const amount = number(value);
    return amount === null ? null : new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(amount);
  };

  function sanitiseCsv(csv) {
    const rows = [];
    let row = [], field = '', quoted = false;
    for (let i = 0; i < csv.length; i += 1) {
      const ch = csv[i];
      if (quoted) {
        if (ch === '"' && csv[i + 1] === '"') { field += '"'; i += 1; }
        else if (ch === '"') quoted = false;
        else field += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
      else field += ch;
    }
    if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
    if (!rows.length) return csv;
    const notesIndex = rows[0].findIndex(value => value.trim().toLowerCase() === 'notes');
    if (notesIndex < 0) return csv;
    for (const cells of rows.slice(1)) {
      if (cells[notesIndex]) cells[notesIndex] = cells[notesIndex].replace(/\bnote\s+to\s+(ai|assistant):[\s\S]*$/i, '[instruction-like text removed]');
    }
    return rows.map(cells => cells.map(value => /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value).join(',')).join('\n');
  }

  function findSession(question, rows, selected) {
    const query = String(question || '').toLowerCase();
    if (!query || !rows) return selected || null;
    const matches = rows.map(row => ({
      row,
      score: Math.max(0, ...[row.session, row.activity, row.id]
        .filter(value => value && String(value).length > 2 && query.includes(String(value).toLowerCase()))
        .map(value => String(value).length))
    })).filter(match => match.score > 0).sort((a, b) => b.score - a.score);
    if (matches.length && (matches.length === 1 || matches[0].score > matches[1].score)) return matches[0].row;
    return selected || null;
  }

  function answer(question, rows, weather, selected) {
    const q = String(question || '').toLowerCase();
    const row = findSession(q, rows, selected);

    if (/\b(bikes?|bicycles?|cycling)\b/.test(q) && !row) {
      return 'Bike rentals are not listed in the live sessions sheet, so I can’t confirm whether Dockside offers them.';
    }
    if (!row) return null;

    const title = row.session || row.activity || 'This session';
    const price = euro(row.price_eur);
    const asksPlaces = /\b(places?|spaces?|spots?|availability|available|book|booking|reserve|remaining|left|sold out)\b/.test(q);
    const asksPrice = /\b(price|cost|how much|free)\b/.test(q);
    const priceAnswer = () => {
      if (price === null) return `I can’t find a price for ${title} in the live sessions sheet.`;
      return Number(row.price_eur) === 0
        ? `${title} is listed as free in the live sessions sheet.`
        : `${title} costs ${price} according to the live sessions sheet.`;
    };
    const placesAnswer = () => {
      const raw = String(row.slots_left || '').trim().toLowerCase();
      const places = number(raw);
      const capacity = number(row.capacity);
      const suffix = capacity === null ? '' : ` The sheet lists a total capacity of ${capacity}; that is not the number of places left.`;
      if (raw === 'auto' || raw === 'unknown' || raw === '' || places === null) {
        return `I can’t confirm remaining places for ${title}: the live sheet marks places as unknown.${suffix}`;
      }
      if (places <= 0) return `The live sheet shows ${title} is sold out, with 0 places remaining.`;
      return `The live sheet shows ${places} ${places === 1 ? 'place' : 'places'} remaining for ${title}.`;
    };
    if (asksPrice && asksPlaces) return `${priceAnswer()} ${placesAnswer()}`;
    if (asksPrice) return priceAnswer();
    if (asksPlaces) return placesAnswer();

    if (/\b(wind|gust|suitable|safe|conditions)\b/.test(q) && weather) {
      const speed = number(weather.wind_speed_10m);
      const limit = number(row.max_wind_kmh);
      if (speed === null || limit === null) return `I can’t compare current wind with ${title} because the sheet or weather feed is missing a value.`;
      const comparison = speed > limit ? 'above' : 'within';
      return `Current wind is ${speed} km/h, ${comparison} the ${title} limit of ${limit} km/h listed in the sheet. Conditions can change; follow your instructor’s decision on the water.`;
    }

    return null;
  }

  window.DocksideGrounding = { answer, findSession, sanitiseCsv };
})();
