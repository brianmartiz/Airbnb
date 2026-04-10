(function initHostToolsPage() {
  'use strict';

  const root = document.documentElement;
  const themeBtn = document.getElementById('themeBtn');
  const topBar = document.querySelector('.top');
  const toolbar = document.querySelector('.toolbar');
  const STORAGE_KEY = 'airbnb-host-tools-theme';
  const filterMeta = document.getElementById('filterMeta');

  const getStoredTheme = () => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  };

  const setStoredTheme = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Ignore storage errors (e.g., privacy mode or denied storage access).
    }
  };

  const safeGetTheme = () => {
    const storedTheme = getStoredTheme();
    if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const applyTheme = (nextTheme) => {
    root.setAttribute('data-theme', nextTheme);
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', String(nextTheme === 'dark'));
      themeBtn.textContent = nextTheme === 'dark' ? 'Tema: scuro' : 'Tema: chiaro';
    }
    setStoredTheme(nextTheme);
  };

  let theme = safeGetTheme();
  applyTheme(theme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      applyTheme(theme);
    });
  }

  const chips = [...document.querySelectorAll('.chip')];
  const sections = [...document.querySelectorAll('section[data-group]')];
  const cards = [...document.querySelectorAll('.card')];
  if (!sections.length || !chips.length) return;

  const tokenize = (value = '') => new Set(value.trim().split(/\s+/).filter(Boolean));

  const sectionTags = new WeakMap();
  sections.forEach((section) => {
    sectionTags.set(section, tokenize(section.dataset.group || ''));
  });

  const setActiveChip = (selectedChip) => {
    chips.forEach((chip) => {
      const isActive = chip === selectedChip;
      chip.classList.toggle('active', isActive);
      chip.setAttribute('aria-pressed', String(isActive));
    });
  };

  const scrollToSection = (section) => {
    if (!section) return;
    const toolbarOffset = toolbar ? Math.ceil(toolbar.getBoundingClientRect().height) : 0;
    const topOffset = Math.ceil((topBar?.getBoundingClientRect().height || 0) + toolbarOffset + 8);
    const targetY = window.scrollY + section.getBoundingClientRect().top - topOffset;
    window.scrollTo({ top: Math.max(targetY, 0), behavior: 'smooth' });
  };

  const applyFilter = (filter) => {
    if (filter === 'all') {
      cards.forEach((card) => card.classList.remove('hidden'));
      sections.forEach((section) => section.classList.remove('hidden'));
      if (filterMeta) filterMeta.textContent = `Stai visualizzando tutte le categorie (${sections.length} sezioni).`;
      return;
    }

    let firstVisibleSection = null;
    sections.forEach((section) => {
      const tags = sectionTags.get(section) || new Set();
      const sectionMatches = tags.has(filter);
      section.classList.toggle('hidden', !sectionMatches);
      if (sectionMatches && !firstVisibleSection) firstVisibleSection = section;
    });

    if (filterMeta) {
      const visibleSections = sections.filter((section) => !section.classList.contains('hidden')).length;
      filterMeta.textContent = `Filtro attivo: ${filter}. Sezioni visibili: ${visibleSections}.`;
    }
    scrollToSection(firstVisibleSection);
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      setActiveChip(chip);
      applyFilter(chip.dataset.filter || 'all');
    });
  });

  applyFilter('all');

  const updateToolbarOffset = () => {
    if (!topBar || !toolbar) return;
    const headerHeight = Math.ceil(topBar.getBoundingClientRect().height);
    toolbar.style.setProperty('--toolbar-top', `${headerHeight}px`);
  };

  updateToolbarOffset();
  window.addEventListener('resize', updateToolbarOffset, { passive: true });
})();
