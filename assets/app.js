(function initHostToolsPage() {
  'use strict';

  const root = document.documentElement;
  const themeBtn = document.getElementById('themeBtn');
  const topBar = document.querySelector('.top');
  const toolbar = document.querySelector('.toolbar');
  const STORAGE_KEY = 'airbnb-host-tools-theme';
  const filterMeta = document.getElementById('filterMeta');
  const systemThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');

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
    return systemThemeMedia.matches ? 'dark' : 'light';
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

  const handleSystemThemeChange = (event) => {
    const storedTheme = getStoredTheme();
    if (storedTheme === 'light' || storedTheme === 'dark') return;
    theme = event.matches ? 'dark' : 'light';
    applyTheme(theme);
  };
  if (typeof systemThemeMedia.addEventListener === 'function') {
    systemThemeMedia.addEventListener('change', handleSystemThemeChange);
  } else if (typeof systemThemeMedia.addListener === 'function') {
    systemThemeMedia.addListener(handleSystemThemeChange);
  }

  const chips = [...document.querySelectorAll('.chip')];
  const sections = [...document.querySelectorAll('section[data-group]')];
  const cards = [...document.querySelectorAll('.card')];
  if (!sections.length || !chips.length) return;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const tokenize = (value = '') => new Set(value.trim().split(/\s+/).filter(Boolean));
  const filterLabels = {
    all: 'Tutti',
    messaging: 'Messaggistica',
    checkin: 'Check-in',
    pms: 'PMS',
    pricing: 'Prezzi dinamici',
    ops: 'Pulizie',
    locks: 'Smart lock',
  };

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
    window.scrollTo({ top: Math.max(targetY, 0), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  };

  const setQueryFilter = (filter) => {
    const url = new URL(window.location.href);
    if (filter === 'all') url.searchParams.delete('categoria');
    else url.searchParams.set('categoria', filter);
    window.history.replaceState({}, '', url);
  };

  const applyFilter = (filter) => {
    if (!filterLabels[filter]) {
      filter = 'all';
    }

    if (filter === 'all') {
      cards.forEach((card) => card.classList.remove('hidden'));
      sections.forEach((section) => section.classList.remove('hidden'));
      if (filterMeta) filterMeta.textContent = `Stai visualizzando tutte le categorie (${sections.length} sezioni).`;
      setQueryFilter(filter);
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
      filterMeta.textContent = visibleSections
        ? `Filtro attivo: ${filterLabels[filter]}. Sezioni visibili: ${visibleSections}.`
        : `Nessuna sezione trovata per il filtro ${filterLabels[filter]}.`;
    }
    setQueryFilter(filter);
    scrollToSection(firstVisibleSection);
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      setActiveChip(chip);
      applyFilter(chip.dataset.filter || 'all');
    });
  });

  const filterFromURL = new URL(window.location.href).searchParams.get('categoria');
  const initialActiveChip = chips.find((chip) => chip.dataset.filter === filterFromURL)
    || chips.find((chip) => chip.classList.contains('active'))
    || chips[0];
  setActiveChip(initialActiveChip);
  applyFilter(initialActiveChip?.dataset.filter || 'all');

  const updateToolbarOffset = () => {
    if (!topBar || !toolbar) return;
    const headerHeight = Math.ceil(topBar.getBoundingClientRect().height);
    toolbar.style.setProperty('--toolbar-top', `${headerHeight}px`);
  };

  updateToolbarOffset();
  window.addEventListener('resize', updateToolbarOffset, { passive: true });
  if ('ResizeObserver' in window && topBar) {
    const resizeObserver = new ResizeObserver(updateToolbarOffset);
    resizeObserver.observe(topBar);
  }
})();
