(() => {
  const shows = window.TM_SHOWS;
  const showSlug = document.body.dataset.show || 'uk';
  const show = shows[showSlug];
  const allSeries = show.seasons;
  const base = document.body.dataset.base;
  const version = document.body.dataset.version;
  const selected = Number(document.body.dataset.season || 0);
  const visibleSeries = selected ? allSeries.filter(item => item.season === selected) : allSeries;
  const seriesName = showSlug === 'uk' ? 'Series' : 'Season';
  const showPath = slug => slug === 'uk' ? base : `${base}${slug}/`;
  const seasonPath = (slug, season) => slug === 'uk' ? `${base}series_${season}/` : `${base}${slug}/season_${season}/`;
  document.querySelectorAll('[data-show-link]').forEach(link => {
    if (link.dataset.showLink === showSlug) link.setAttribute('aria-current', 'page');
  });
  const title = document.getElementById('page-title');
  const backLink = document.getElementById('all-series-link');

  title.textContent = selected ? `${seriesName} ${selected}` : showSlug === 'uk' ? 'Every contestant.' : `Taskmaster ${show.name}.`;
  document.title = selected ? `${seriesName} ${selected} · Taskmaster ${show.name} · Castmaster` : `Taskmaster ${show.name} · Castmaster`;
  document.getElementById('intro-label').textContent = `${show.name.toUpperCase()} · THE CAST, IN ORDER`;
  backLink.href = showPath(showSlug);
  backLink.textContent = `← All ${seriesName.toLowerCase()}s`;
  backLink.hidden = !selected;

  const list = document.getElementById('series-list');
  for (const group of visibleSeries) {
    const section = document.createElement('section');
    section.className = 'series-section';
    section.id = `series_${group.season}`;
    const head = document.createElement('div');
    head.className = 'series-head';
    const heading = document.createElement('a');
    heading.className = 'series-heading';
    heading.href = seasonPath(showSlug, group.season);
    heading.innerHTML = `<span class="series-kicker">${String(group.season).padStart(2, '0')}</span><h2>${seriesName} ${group.season}</h2>`;
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
      card.href = person.wikiTitle ? `https://en.wikipedia.org/wiki/${encodeURIComponent(person.wikiTitle.replaceAll(' ', '_'))}` : person.imageSource;
      card.setAttribute('aria-label', `${person.name}, ${person.wikiTitle ? 'Wikipedia' : 'Taskmaster Wiki'}`);
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
        img.src = person.image.startsWith('https://') ? person.image : `${base}${person.image}?v=${version}`;
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
  const searchDisclosure = document.querySelector('.search-disclosure');
  const searchToggle = searchDisclosure.querySelector('summary');
  const choices = Object.entries(shows).flatMap(([slug, entry]) => [
    { label: `Taskmaster ${entry.name}`, detail: 'Show', slug, season: 0, rank: 0 },
    ...entry.seasons.flatMap(group => [
      { label: `${slug === 'uk' ? 'Series' : 'Season'} ${group.season}`, detail: entry.name, slug, season: group.season, rank: 1 },
      ...group.contestants.map(person => ({ label: person.name, detail: `${entry.name} · ${slug === 'uk' ? 'Series' : 'Season'} ${group.season}`, slug, season: group.season, rank: 2 }))
    ])
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
  function navigate(choice) { window.location.href = choice.season ? seasonPath(choice.slug, choice.season) : showPath(choice.slug); }
  function paintActive() {
    [...results.querySelectorAll('[role="option"]')].forEach((node, index) => node.setAttribute('aria-selected', String(index === activeIndex)));
    if (activeIndex >= 0) {
      input.setAttribute('aria-activedescendant', `search-option-${activeIndex}`);
      results.children[activeIndex].scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  }
  function update() {
    const query = normalize(input.value.trim());
    if (!query) {
      matches = [];
      close();
      return;
    }
    matches = choices.filter(choice => normalize(choice.label).includes(query) || (choice.rank === 1 && String(choice.season).includes(query)));
    matches.sort((a, b) => (a.rank - b.rank) || (a.season - b.season));
    matches = matches.slice(0, 30);
    results.replaceChildren();
    activeIndex = -1;
    if (!matches.length) {
      const empty = document.createElement('div');
      empty.className = 'no-results';
      empty.textContent = 'No matching show, season, or contestant';
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
  searchDisclosure.addEventListener('toggle', () => {
    if (searchDisclosure.open) input.focus();
    else close();
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      searchDisclosure.open = false;
      searchToggle.focus();
      return close();
    }
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
  document.addEventListener('pointerdown', event => {
    if (!searchDisclosure.contains(event.target)) searchDisclosure.open = false;
    else if (!event.target.closest('.combobox')) close();
  });

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
