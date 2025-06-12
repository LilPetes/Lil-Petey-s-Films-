function initSidebar() {
  if (!window.utils) {
    console.error('utils.js is not loaded properly');
    return;
  }

  const { getElementById: getElement, loadSidebarData: originalLoadSidebarData, debounce, initTheme, toggleTheme } = window.utils;

  const loadSidebarData = (url, container, linkGenerator) => {
    return originalLoadSidebarData(url, container, (index, item) => {
      const linkPath = linkGenerator(index, item);
      return {
        href: linkPath,
        attributes: {
          'role': 'menuitem',
          'data-title': item.title || `Item ${index + 1}`
        }
      };
    });
  };

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const createSearchTooltip = () => {
    if (isMobile) return null;

    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'search-tooltip';
    tooltipEl.innerHTML = `Search with <span class="key">${isMac ? '⌘' : 'Ctrl'}</span>+<span class="key">F</span> | Navigate with <span class="key">↑</span><span class="key">↓</span>`;
    document.body.appendChild(tooltipEl);

    setTimeout(() => {
      tooltipEl.classList.add('visible');

      setTimeout(() => {
        tooltipEl.classList.remove('visible');
      }, 3000);
    }, 1000);

    return tooltipEl;
  };

  const searchTooltip = createSearchTooltip();

  initTheme();

  const toggle = getElement("menu-toggle");
  const sidebar = getElement("sidebar");
  const closeBtn = getElement("close-btn");
  const overlay = getElement("overlay");
  const movieToggle = getElement("movie-toggle");
  const movieArrow = getElement("movie-arrow");
  const movieLinks = getElement("movie-links");
  const seasonToggle = getElement("season-toggle");
  const seasonArrow = getElement("season-arrow");
  const seasonLinks = getElement("season-links");
  const searchInput = getElement("global-search");
  const sidebarLinks = getElement("sidebar-links");
  const searchResultsStatus = getElement("search-results-status");

  if (!sidebar || !overlay) return;

  let lastFocusedElement = null;

  const openSidebar = () => {
    lastFocusedElement = document.activeElement;
    sidebar.classList.add("active");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";

    toggle.setAttribute("aria-expanded", "true");
    sidebar.setAttribute("aria-hidden", "false");

    setTimeout(() => {
      const closeButton = getElement("close-btn");
      if (closeButton) closeButton.focus();
    }, 100);
  };

  const closeSidebar = () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
    document.body.style.overflow = "";

    toggle.setAttribute("aria-expanded", "false");
    sidebar.setAttribute("aria-hidden", "true");

    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  };

  if (toggle) toggle.addEventListener("click", openSidebar);
  if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
  if (overlay) overlay.addEventListener("click", closeSidebar);

  const focusSidebarSearch = () => {
    if (!sidebar.classList.contains("active")) {
      openSidebar();
    }

    setTimeout(() => {
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }, 150);
  };

  window.focusSidebarSearch = focusSidebarSearch;

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("active")) {
      closeSidebar();
    }

    if ((e.key === 'f' || e.key === 'F') && (e.ctrlKey || e.metaKey)) {
      e.stopPropagation();
      focusSidebarSearch();
      return false;
    }

    if (!sidebar.classList.contains("active")) return;

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const handledInMovies = handleSectionNavigation(e, movieLinks);
      const handledInSeasons = handleSectionNavigation(e, seasonLinks);

      if (handledInMovies || handledInSeasons) {
        return;
      }

      e.preventDefault();

      const allNavigableElements = sidebar.querySelectorAll(
        'a[role="menuitem"], button.collapsible-header'
      );

      const navigableElements = Array.from(allNavigableElements).filter(el => {
        if (el.style.display === 'none') return false;

        if (el.tagName.toLowerCase() === 'a') {
          const parent = el.closest('.collapsible-content');
          if (parent && parent.classList.contains('hidden')) {
            return false;
          }
        }

        return true;
      });

      if (navigableElements.length === 0) return;

      let currentIndex = -1;
      for (let i = 0; i < navigableElements.length; i++) {
        if (navigableElements[i] === document.activeElement) {
          currentIndex = i;
          break;
        }
      }

      let newIndex;
      if (e.key === "ArrowUp") {
        newIndex = currentIndex <= 0 ? navigableElements.length - 1 : currentIndex - 1;
      } else {
        newIndex = currentIndex >= navigableElements.length - 1 ? 0 : currentIndex + 1;
      }

      navigableElements[newIndex].focus();
    }

    if (e.key === "Tab" && sidebar.classList.contains("active")) {
      const focusableElements = sidebar.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  });

  const toggleSection = (toggleButton, contentElement, arrowElement) => {
    if (!contentElement || !arrowElement || !toggleButton) return;

    const isVisible = !contentElement.classList.contains("hidden");
    contentElement.classList.toggle("hidden");

    arrowElement.textContent = isVisible ? "⌄" : "˄";
    toggleButton.setAttribute("aria-expanded", isVisible ? "false" : "true");
  };

  if (movieToggle && movieLinks && movieArrow) {
    movieToggle.addEventListener("click", () => {
      toggleSection(movieToggle, movieLinks, movieArrow);
    });

    movieToggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleSection(movieToggle, movieLinks, movieArrow);
      }
    });
  }

  if (seasonToggle && seasonLinks && seasonArrow) {
    seasonToggle.addEventListener("click", () => {
      toggleSection(seasonToggle, seasonLinks, seasonArrow);
    });

    seasonToggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleSection(seasonToggle, seasonLinks, seasonArrow);
      }
    });
  }

  if (movieLinks) {
    loadSidebarData(
      './data/movie_data.json', 
      movieLinks, 
      (i) => `./movie.html?movie=${i}`
    );
  }

  if (seasonLinks) {
    loadSidebarData(
      './data/episodes_data.json', 
      seasonLinks, 
      (i) => `./episodes.html?season=${i}`
    );
  }

  const handleSectionNavigation = (e, sectionLinks) => {
    if (!sectionLinks || sectionLinks.classList.contains('hidden')) return false;

    const allLinks = Array.from(sectionLinks.querySelectorAll('a[role="menuitem"]'));
    const links = allLinks.filter(link => link.style.display !== 'none');

    if (links.length === 0) return false;

    const isFocusInSection = links.some(link => link === document.activeElement);

    if (isFocusInSection) {
      let currentIndex = links.findIndex(link => link === document.activeElement);
      let newIndex;

      if (e.key === "ArrowUp") {
        if (currentIndex <= 0) {
          return false;
        } else {
          newIndex = currentIndex - 1;
        }
      } else if (e.key === "ArrowDown") {
        if (currentIndex >= links.length - 1) {
          return false;
        } else {
          newIndex = currentIndex + 1;
        }
      } else {
        return false;
      }

      e.preventDefault();
      links[newIndex].focus();
      return true;
    }

    return false;
  };


      const themeToggle = getElement('theme-toggle');
      if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
      }

  if (searchInput && sidebarLinks) {
    searchInput.placeholder = isMobile ? "Search..." : `Search... (${isMac ? '⌘' : 'Ctrl'}+F)`;

    const performSearch = debounce(() => {
      const query = searchInput.value.toLowerCase().trim();
      const allLinks = sidebarLinks.querySelectorAll("a");
      let visibleCount = 0;

      const activeElement = document.activeElement;
      let needRefocus = false;

      allLinks.forEach(link => {
        const title = (link.getAttribute("data-title") || "").toLowerCase();
        const isVisible = title.includes(query);
        link.style.display = isVisible ? "block" : "none";

        if (link === activeElement && !isVisible) {
          needRefocus = true;
        }

        if (isVisible) visibleCount++;
      });

      if (needRefocus) {
        const firstVisible = Array.from(allLinks).find(link => link.style.display !== 'none');
        if (firstVisible) {
          setTimeout(() => firstVisible.focus(), 0);
        } else {
          setTimeout(() => searchInput.focus(), 0);
        }
      }

      if (searchResultsStatus) {
        searchResultsStatus.textContent = visibleCount === 0 
          ? "No results found" 
          : `Found ${visibleCount} result${visibleCount !== 1 ? 's' : ''}`;
      }

      const sections = [movieLinks, seasonLinks];
      sections.forEach(section => {
        if (!section) return;

        const existingMsg = section.querySelector('.no-results');
        if (existingMsg) section.removeChild(existingMsg);

        const sectionLinks = section.querySelectorAll('a');
        const hasVisibleLinks = Array.from(sectionLinks).some(link => 
          link.style.display !== 'none'
        );

        if (!hasVisibleLinks && query && sectionLinks.length > 0) {
          const noResults = document.createElement('p');
          noResults.textContent = 'No matching results';
          noResults.className = 'no-results';
          noResults.setAttribute('role', 'status');
          section.appendChild(noResults);
        }
      });
    }, 200);

    searchInput.addEventListener("input", performSearch);

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchInput.value = '';
        performSearch();
      }
    });

    searchInput.addEventListener("mouseenter", () => {
      if (searchTooltip) searchTooltip.classList.add('visible');
    });

    searchInput.addEventListener("mouseleave", () => {
      if (searchTooltip) searchTooltip.classList.remove('visible');
    });
  }
}