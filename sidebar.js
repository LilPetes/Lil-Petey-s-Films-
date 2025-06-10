function initSidebar() {
  if (!window.utils) {
    console.error('utils.js is not loaded properly');
    return;
  }

  const { getElementById: getElement, loadSidebarData, debounce } = window.utils;

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

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("active")) {
      closeSidebar();
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

  if (searchInput && sidebarLinks) {
    const performSearch = debounce(() => {
      const query = searchInput.value.toLowerCase().trim();
      const allLinks = sidebarLinks.querySelectorAll("a");
      let visibleCount = 0;

      allLinks.forEach(link => {
        const title = (link.getAttribute("data-title") || "").toLowerCase();
        const isVisible = title.includes(query);
        link.style.display = isVisible ? "block" : "none";
        if (isVisible) visibleCount++;
      });

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
  }
}