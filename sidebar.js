function initSidebar() {
  const getElement = (id) => {
    const element = document.getElementById(id);
    if (!element) console.warn(`Element with id '${id}' not found`);
    return element;
  };

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

  if (!sidebar || !overlay) return;

  const openSidebar = () => {
    sidebar.classList.add("active");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  };

  const closeSidebar = () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  };

  if (toggle) toggle.addEventListener("click", openSidebar);
  if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
  if (overlay) overlay.addEventListener("click", closeSidebar);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("active")) {
      closeSidebar();
    }
  });

  const toggleSection = (contentElement, arrowElement) => {
    if (!contentElement || !arrowElement) return;

    const isVisible = !contentElement.classList.contains("hidden");
    contentElement.classList.toggle("hidden");
    arrowElement.textContent = isVisible ? "⌄" : "˄";
  };

  if (movieToggle && movieLinks && movieArrow) {
    movieToggle.addEventListener("click", () => {
      toggleSection(movieLinks, movieArrow);
    });
  }

  if (seasonToggle && seasonLinks && seasonArrow) {
    seasonToggle.addEventListener("click", () => {
      toggleSection(seasonLinks, seasonArrow);
    });
  }

  const loadData = (url, container, linkTemplate) => {
    if (!container) return Promise.reject(new Error(`Container not found`));

    container.innerHTML = '<p style="opacity: 0.6;">Loading...</p>';

    return fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
          container.innerHTML = '<p style="opacity: 0.6;">No items available</p>';
          return;
        }

        container.innerHTML = '';
        const fragment = document.createDocumentFragment();

        data.forEach((item, i) => {
          const link = document.createElement('a');
          link.href = linkTemplate(i);
          link.textContent = item.title || `Item ${i+1}`;
          link.setAttribute("data-title", item.title || '');
          fragment.appendChild(link);
        });

        container.appendChild(fragment);
      })
      .catch(err => {
        console.error(`Failed to load data from ${url}:`, err);
        container.innerHTML = `<p style="color: red;">Failed to load data.</p>`;
      });
  };

  if (movieLinks) {
    loadData(
      './data/movie_data.json', 
      movieLinks, 
      (i) => `./movie.html?movie=${i}`
    );
  }

  if (seasonLinks) {
    loadData(
      './data/episodes_data.json', 
      seasonLinks, 
      (i) => `./episodes.html?season=${i}`
    );
  }

  if (searchInput && sidebarLinks) {
    let debounceTimer;

    searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);

      debounceTimer = setTimeout(() => {
        const query = searchInput.value.toLowerCase().trim();
        const allLinks = sidebarLinks.querySelectorAll("a");

        allLinks.forEach(link => {
          const title = (link.getAttribute("data-title") || "").toLowerCase();
          link.style.display = title.includes(query) ? "block" : "none";
        });
      }, 200);
    });
  }
}