(() => {
  const allSeries = window.TM_SERIES;
  const lastSeries = allSeries.at(-1).series;
  const base = document.body.dataset.base;
  const selected = Number(document.body.dataset.series || 0);
  const visibleSeries = selected ? allSeries.filter(item => item.series === selected) : allSeries;
  const title = document.getElementById('page-title');
  const backLink = document.getElementById('all-series-link');

  title.textContent = selected ? `Series ${selected}` : 'Every contestant.';
  document.title = selected ? `Series ${selected} · Castmaster` : `Castmaster · Series 1–${lastSeries}`;
  backLink.hidden = !selected;

  const list = document.getElementById('series-list');
  for (const group of visibleSeries) {
    const section = document.createElement('section');
    section.className = 'series-section';
    section.id = `series_${group.series}`;
    const head = document.createElement('div');
    head.className = 'series-head';
    const heading = document.createElement('a');
    heading.className = 'series-heading';
    heading.href = `${base}series_${group.series}/`;
    heading.innerHTML = `<span class="series-kicker">${String(group.series).padStart(2, '0')}</span><h2>Series ${group.series}</h2>`;
    const count = document.createElement('span');
    count.className = 'series-count';
    count.textContent = 'FIVE CONTESTANTS';
    head.append(heading, count);
    head.hidden = !!selected;
    const grid = document.createElement('div');
    grid.className = 'cast-grid';
    for (const person of group.contestants) {
      const card = document.createElement('a');
      card.className = 'person-card';
      card.href = `https://en.wikipedia.org/wiki/${encodeURIComponent(person.wikiTitle.replaceAll(' ', '_'))}`;
      card.setAttribute('aria-label', `${person.name}, Wikipedia`);
      const portrait = document.createElement('div');
      portrait.className = 'portrait';
      portrait.dataset.title = person.wikiTitle;
      const initials = document.createElement('span');
      initials.className = 'initials';
      initials.setAttribute('aria-hidden', 'true');
      initials.textContent = person.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('');
      portrait.append(initials);
      if (person.image) {
        const img = document.createElement('img');
        img.src = person.image.startsWith('https://') ? person.image : `${base}${person.image}`;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.addEventListener('load', () => initials.remove(), { once: true });
        img.addEventListener('error', () => img.remove(), { once: true });
        portrait.append(img);
        portrait.dataset.fixedImage = 'true';
      }
      const name = document.createElement('span');
      name.className = 'person-name';
      name.textContent = person.name;
      card.append(portrait, name);
      grid.append(card);
    }
    section.append(head, grid);
    list.append(section);
  }

  const input = document.getElementById('series-search');
  const results = document.getElementById('search-results');
  const choices = allSeries.flatMap(group => [
    { label: `Series ${group.series}`, detail: 'Series', series: group.series, rank: 0 },
    ...group.contestants.map(person => ({ label: person.name, detail: `Series ${group.series}`, series: group.series, rank: 1 }))
  ]);
  let activeIndex = -1;
  let matches = [];
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  function close() {
    results.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    activeIndex = -1;
  }
  function navigate(choice) { window.location.href = `${base}series_${choice.series}/`; }
  function paintActive() {
    [...results.querySelectorAll('[role="option"]')].forEach((node, index) => node.setAttribute('aria-selected', String(index === activeIndex)));
    if (activeIndex >= 0) {
      input.setAttribute('aria-activedescendant', `search-option-${activeIndex}`);
      results.children[activeIndex].scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  }
  function update() {
    const query = normalize(input.value.trim());
    matches = choices.filter(choice => !query || normalize(choice.label).includes(query) || (choice.rank === 0 && String(choice.series).includes(query)));
    matches.sort((a, b) => (a.rank - b.rank) || (a.series - b.series));
    if (!query) matches = matches.filter(choice => choice.rank === 0);
    matches = matches.slice(0, 30);
    results.replaceChildren();
    activeIndex = -1;
    if (!matches.length) {
      const empty = document.createElement('div');
      empty.className = 'no-results';
      empty.textContent = 'No matching series or contestant';
      results.append(empty);
    } else matches.forEach((choice, index) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'search-option';
      option.id = `search-option-${index}`;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      const label = document.createElement('span');
      label.textContent = choice.label;
      const detail = document.createElement('small');
      detail.textContent = choice.detail;
      option.append(label, detail);
      option.addEventListener('click', () => navigate(choice));
      results.append(option);
    });
    results.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }
  input.addEventListener('focus', update);
  input.addEventListener('input', update);
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') return close();
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.hidden) update();
      if (matches.length) activeIndex = (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
      paintActive();
    }
    if (event.key === 'Enter' && !results.hidden && matches.length) {
      event.preventDefault();
      navigate(matches[activeIndex < 0 ? 0 : activeIndex]);
    }
  });
  document.addEventListener('pointerdown', event => { if (!event.target.closest('.combobox')) close(); });

  // Load only cards approaching the viewport. Names and links remain usable if Wikimedia is unavailable.
  const portraits = [...document.querySelectorAll('.portrait:not([data-fixed-image])')];
  const pending = new Set();
  let timer;
  async function flush() {
    const batch = [...pending].slice(0, 40);
    batch.forEach(node => pending.delete(node));
    if (!batch.length) return;
    const titles = [...new Set(batch.map(node => node.dataset.title))];
    const params = new URLSearchParams({ action: 'query', prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '520', pilicense: 'free', redirects: '1', format: 'json', formatversion: '2', origin: '*', titles: titles.join('|') });
    try {
      const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, { signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error('Portrait request failed');
      const payload = await response.json();
      const pages = new Map((payload.query?.pages || []).map(page => [page.title.replaceAll('_', ' '), page.thumbnail?.source]));
      for (const node of batch) {
        const url = pages.get(node.dataset.title.replaceAll('_', ' '));
        if (!url) continue;
        const img = document.createElement('img');
        img.src = url;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.addEventListener('load', () => node.querySelector('.initials')?.remove(), { once: true });
        img.addEventListener('error', () => img.remove(), { once: true });
        node.append(img);
      }
    } catch { /* Initials remain visible when the image service is unavailable. */ }
    if (pending.size) timer = setTimeout(flush, 150);
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      observer.unobserve(entry.target);
      pending.add(entry.target);
    }
    clearTimeout(timer);
    timer = setTimeout(flush, 100);
  }, { rootMargin: '700px' });
  portraits.forEach(node => observer.observe(node));
})();
