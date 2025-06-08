function initSidebar() {
  const toggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  const closeBtn = document.getElementById("close-btn");
  const overlay = document.getElementById("overlay");
  
  const movieToggle = document.getElementById("movie-toggle");
  const movieArrow = document.getElementById("movie-arrow");
  const movieLinks = document.getElementById("movie-links");

  const seasonToggle = document.getElementById("season-toggle");
  const seasonArrow = document.getElementById("season-arrow");
  const seasonLinks = document.getElementById("season-links");

  const searchInput = document.getElementById("global-search");
  const sidebarLinks = document.getElementById("sidebar-links");

  toggle.addEventListener("click", () => {
    sidebar.classList.add("active");
    overlay.classList.add("active");
  });

  closeBtn.addEventListener("click", closeSidebar);
  overlay.addEventListener("click", closeSidebar);

  function closeSidebar() {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
  }

  // Collapse logic for Movies
  movieToggle.addEventListener("click", () => {
    const isVisible = !movieLinks.classList.contains("hidden");
    movieLinks.classList.toggle("hidden");
    movieArrow.textContent = isVisible ? "⌄" : "˄";
  });

  // Collapse logic for Seasons
  seasonToggle.addEventListener("click", () => {
    const isVisible = !seasonLinks.classList.contains("hidden");
    seasonLinks.classList.toggle("hidden");
    seasonArrow.textContent = isVisible ? "⌄" : "˄";
  });

  // Load movies from JSON
  fetch('./data/movie_data.json')
    .then(res => res.json())
    .then(data => {
      movieLinks.innerHTML = '';
      data.forEach((movie, i) => {
        const link = document.createElement('a');
        link.href = `./movie.html?movie=${i}`;
        link.textContent = movie.title;
        link.setAttribute("data-title", movie.title);
        movieLinks.appendChild(link);
      });
    })
    .catch(err => {
      movieLinks.innerHTML = `<p style="color: red;">Failed to load movies.</p>`;
      console.error(err);
    });

  // Load seasons from JSON
  fetch('./data/episodes_data.json')
    .then(res => res.json())
    .then(data => {
      seasonLinks.innerHTML = '';
      data.forEach((season, i) => {
        const link = document.createElement('a');
        link.href = `./episodes.html?season=${i}`;
        link.textContent = season.title;
        link.setAttribute("data-title", season.title);
        seasonLinks.appendChild(link);
      });
    })
    .catch(err => {
      seasonLinks.innerHTML = `<p style="color: red;">Failed to load seasons.</p>`;
      console.error(err);
    });

  // Global Search
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const allLinks = sidebarLinks.querySelectorAll("a");

    allLinks.forEach(link => {
      const title = link.getAttribute("data-title") || "";
      link.style.display = title.toLowerCase().includes(query) ? "block" : "none";
    });
  });
}