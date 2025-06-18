import { getElementById, loadSidebarData, initTheme, toggleTheme } from './utils.js';

export function initSidebar() {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const createSearchTooltip = () => {
    if (isMobile || localStorage.getItem('searchTooltipShown')) return null;

    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'search-tooltip';
    tooltipEl.innerHTML = `Search with <span class="key">${isMac ? '⌘' : 'Ctrl'}</span>+<span class="key">F</span> | Navigate with <span class="key">↑</span><span class="key">↓</span>`;
    document.body.appendChild(tooltipEl);

    requestAnimationFrame(() => {
      tooltipEl.classList.add('visible');
      localStorage.setItem('searchTooltipShown', '1');
      setTimeout(() => {
        tooltipEl.classList.remove('visible');
        setTimeout(() => tooltipEl.remove(), 500);
      }, 3000);
    });

    return tooltipEl;
  };

  const searchTooltip = createSearchTooltip();

  initTheme();

  const elements = {
    toggle: getElementById("menu-toggle"),
    sidebar: getElementById("sidebar"),
    closeBtn: getElementById("close-btn"),
    overlay: getElementById("overlay"),
    movieToggle: getElementById("movie-toggle"),
    movieArrow: getElementById("movie-arrow"),
    movieLinks: getElementById("movie-links"),
    seasonToggle: getElementById("season-toggle"),
    seasonArrow: getElementById("season-arrow"),
    seasonLinks: getElementById("season-links"),
    searchInput: getElementById("global-search"),
    sidebarLinks: getElementById("sidebar-links"),
    searchResultsStatus: getElementById("search-results-status"),
    themeToggle: getElementById("theme-toggle")
  };

  if (!elements.sidebar || !elements.overlay) return;

  const openSidebar = () => {
    elements.sidebar.classList.add('active');
    elements.overlay.classList.add('active');
    elements.toggle.setAttribute('aria-expanded', 'true');
    elements.searchInput.focus();
    document.body.style.overflow = 'hidden';
  };

  const closeSidebar = () => {
    elements.sidebar.classList.remove('active');
    elements.overlay.classList.remove('active');
    elements.toggle.setAttribute('aria-expanded', 'false');
    elements.toggle.focus();
    document.body.style.overflow = '';
  };

  const focusSidebarSearch = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
      e.preventDefault();
      if (!elements.sidebar.classList.contains('active')) {
        openSidebar();
      } else {
        elements.searchInput.focus();
      }
    }
  };

  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const links = elements.sidebarLinks.querySelectorAll('a[role="menuitem"]');
    let visibleCount = 0;

    links.forEach(link => {
      const title = link.getAttribute('data-title') || link.textContent;
      const isVisible = title.toLowerCase().includes(searchTerm);
      link.style.display = isVisible ? '' : 'none';
      if (isVisible) visibleCount++;
    });

    if (elements.searchResultsStatus) {
      elements.searchResultsStatus.textContent = visibleCount === 0 ? 'No results found' : `${visibleCount} results found`;
    }
  };

  const toggleSection = (toggleButton, contentElement, arrowElement) => {
    const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
    toggleButton.setAttribute('aria-expanded', !isExpanded);
    contentElement.classList.toggle('hidden');
    arrowElement.textContent = isExpanded ? '⌄' : '⌃';
  };

  const handleSectionNavigation = (e, sectionLinks) => {
    const links = Array.from(sectionLinks.querySelectorAll('a[role="menuitem"]'));
    const currentIndex = links.indexOf(document.activeElement);
    let nextIndex;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = currentIndex < links.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : links.length - 1;
        break;
      default:
        return;
    }

    links[nextIndex].focus();
  };

  elements.toggle.addEventListener('click', openSidebar);
  elements.closeBtn.addEventListener('click', closeSidebar);
  elements.overlay.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', focusSidebarSearch);
  elements.searchInput.addEventListener('input', handleSearch);

  elements.movieToggle.addEventListener('click', () => {
    toggleSection(elements.movieToggle, elements.movieLinks, elements.movieArrow);
  });

  elements.seasonToggle.addEventListener('click', () => {
    toggleSection(elements.seasonToggle, elements.seasonLinks, elements.seasonArrow);
  });

  elements.movieLinks.addEventListener('keydown', (e) => handleSectionNavigation(e, elements.movieLinks));
  elements.seasonLinks.addEventListener('keydown', (e) => handleSectionNavigation(e, elements.seasonLinks));

  if (elements.themeToggle) {
    elements.themeToggle.addEventListener('click', () => {
      toggleTheme();
    });
  }

  const loadData = async () => {
    try {
      await Promise.all([
        loadSidebarData('./data/movie_data.json', elements.movieLinks, (i) => `./movie.html?movie=${i}`),
        loadSidebarData('./data/episodes_data.json', elements.seasonLinks, (i) => `./episodes.html?season=${i}`)
      ]);
    } catch (error) {
      console.error('Failed to load sidebar data:', error);
    }
  };

  loadData();
}