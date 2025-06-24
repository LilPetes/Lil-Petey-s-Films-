import { initSidebar } from './sidebar.js';
import { fetchData, sanitizeHTML, handleError, isMovieWatched, markMovieWatched, unmarkMovieWatched, isEpisodeWatched, markEpisodeWatched, unmarkEpisodeWatched, createPreviewVideo, togglePreviewMute, initTheme } from './utils.js';

fetch('./sidebar.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('sidebar-container').innerHTML = html;
  })
  .then(() => {
    initSidebar();
    initTestEnvironment();
  })
  .catch(error => {
    console.error('Failed to initialize test environment:', error);
    document.getElementById('sidebar-test-result').innerHTML = `
      <div class="test-error">Failed to load sidebar: ${error.message}</div>
    `;
  });

function logResult(containerId, message, type = 'info') {
  const resultContainer = document.getElementById(containerId);
  if (resultContainer) {
    resultContainer.innerHTML = `<div class="test-result test-${type}">${sanitizeHTML(message)}</div>`;
  }
}

function initTestEnvironment() {
  document.getElementById('current-theme').textContent = localStorage.getItem('theme') || 'default';
  document.getElementById('screen-size').textContent = `${window.innerWidth}x${window.innerHeight}`;
  window.addEventListener('resize', () => {
    document.getElementById('screen-size').textContent = `${window.innerWidth}x${window.innerHeight}`;
  });
  checkSystemStatus();

  document.getElementById('test-sidebar-toggle').addEventListener('click', testSidebar);
  document.getElementById('test-sidebar-search').addEventListener('click', testSidebarSearch);
  document.getElementById('test-sidebar-keyboard').addEventListener('click', testSidebarKeyboard);
  document.getElementById('test-theme-switch').addEventListener('click', testThemeSwitch);
  document.getElementById('test-theme-persistence').addEventListener('click', testThemePersistence);
  document.getElementById('test-data-loading').addEventListener('click', testDataLoading);
  document.getElementById('test-data-cache').addEventListener('click', testDataCache);
  document.getElementById('test-error-handling').addEventListener('click', testErrorHandling);
  document.getElementById('test-watched-movies').addEventListener('click', testWatchedMovies);
  document.getElementById('test-watched-episodes').addEventListener('click', testWatchedEpisodes);
  document.getElementById('clear-watched-data').addEventListener('click', clearWatchedData);
  document.getElementById('test-video-preview-card').addEventListener('mouseenter', (e) => testVideoPreview(e.currentTarget));
  document.getElementById('test-video-preview-card').addEventListener('mouseleave', (e) => stopVideoPreview(e.currentTarget));
  document.getElementById('test-preview-mute').addEventListener('click', testPreviewMute);
  document.getElementById('test-responsive').addEventListener('click', testResponsive);
  document.getElementById('test-touch-support').addEventListener('click', testTouchSupport);
  document.getElementById('test-keyboard-navigation').addEventListener('click', testKeyboardNavigation);
  document.getElementById('test-screen-reader').addEventListener('click', testScreenReader);
  document.getElementById('test-focus-management').addEventListener('click', testFocusManagement);
  document.getElementById('test-load-time').addEventListener('click', testLoadTime);
  document.getElementById('test-memory-usage').addEventListener('click', testMemoryUsage);
  document.getElementById('test-network-requests').addEventListener('click', testNetworkRequests);
}

function testSidebar() {
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menu-toggle');
  if (sidebar && menuToggle) {
    menuToggle.click();
    const isOpen = sidebar.classList.contains('open');
    logResult('sidebar-test-result', `Sidebar toggle test: ${isOpen ? 'Opened' : 'Closed'}`, 'success');
  } else {
    logResult('sidebar-test-result', 'Sidebar or toggle button not found.', 'error');
  }
};

function testSidebarSearch() {
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    searchInput.value = 'test';
    searchInput.dispatchEvent(new Event('input'));
    logResult('sidebar-test-result', 'Search input test initiated.', 'info');
    setTimeout(() => {
      const results = document.querySelectorAll('#sidebar-links a[style*="display: block"]').length;
      logResult('sidebar-test-result', `Search found ${results} results for 'test'`, 'success');
    }, 500);
  } else {
    logResult('sidebar-test-result', 'Search input not found.', 'error');
  }
};

function testSidebarKeyboard() {
  logResult('sidebar-test-result', 'Keyboard nav test: Manual check required. Use Tab, Shift+Tab, and Enter.', 'info');
};

function testThemeSwitch() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'default';
  const themes = ['light', 'dark', 'midnight', 'ocean', 'forest'];
  const nextThemeIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
  const nextTheme = themes[nextThemeIndex];
  document.documentElement.setAttribute('data-theme', nextTheme);
  localStorage.setItem('theme', nextTheme);
  document.getElementById('current-theme').textContent = nextTheme;
  logResult('theme-test-result', `Theme switched to: ${nextTheme}`, 'success');
};

function testThemePersistence() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    logResult('theme-test-result', `Theme is persistent. Saved theme: ${savedTheme}`, 'success');
  } else {
    logResult('theme-test-result', 'Theme is not persistent.', 'error');
  }
};

async function testDataLoading() {
  try {
    const movies = await fetchData('./data/movie_data.json');
    const episodes = await fetchData('./data/episodes_data.json');
    if (movies && episodes) {
      logResult('data-test-result', `Successfully loaded ${movies.length} movies and ${episodes.length} episode seasons.`, 'success');
    } else {
      throw new Error('Data is null or undefined');
    }
  } catch (error) {
    handleError(error);
    logResult('data-test-result', `Error loading data: ${error.message}`, 'error');
  }
};

async function testDataCache() {
  const url = './data/movie_data.json';
  const startTime = performance.now();
  await fetchData(url);
  const endTime = performance.now();
  const firstLoadTime = endTime - startTime;

  const startTimeCached = performance.now();
  await fetchData(url);
  const endTimeCached = performance.now();
  const secondLoadTime = endTimeCached - startTimeCached;

  if (secondLoadTime < firstLoadTime) {
    logResult('data-test-result', `Cache test success. First load: ${firstLoadTime.toFixed(2)}ms, Second load: ${secondLoadTime.toFixed(2)}ms`, 'success');
  } else {
    logResult('data-test-result', `Cache test inconclusive. First load: ${firstLoadTime.toFixed(2)}ms, Second load: ${secondLoadTime.toFixed(2)}ms`, 'info');
  }
};

async function testErrorHandling() {
  const invalidUrl = './data/non_existent_file.json';
  try {
    await fetchData(invalidUrl);
    logResult('data-test-result', 'Error handling test failed: Did not throw error for invalid URL.', 'error');
  } catch (error) {
    logResult('data-test-result', `Error handling test passed. Correctly caught error: ${error.message}`, 'success');
  }
};

function testWatchedMovies() {
  const movieIndex = 0;
  markMovieWatched(movieIndex);
  if (isMovieWatched(movieIndex)) {
    logResult('watched-test-result', 'Movie marked as watched.', 'success');
    unmarkMovieWatched(movieIndex);
    if (!isMovieWatched(movieIndex)) {
      logResult('watched-test-result', 'Movie marked as watched and then unwatched successfully.', 'success');
    } else {
      logResult('watched-test-result', 'Failed to unmark movie.', 'error');
    }
  } else {
    logResult('watched-test-result', 'Failed to mark movie as watched.', 'error');
  }
};

function testWatchedEpisodes() {
  const seasonIndex = 0;
  const episodeIndex = 1;
  markEpisodeWatched(seasonIndex, episodeIndex);
  if (isEpisodeWatched(seasonIndex, episodeIndex)) {
    logResult('watched-test-result', 'Episode marked as watched.', 'success');
    unmarkEpisodeWatched(seasonIndex, episodeIndex);
    if (!isEpisodeWatched(seasonIndex, episodeIndex)) {
      logResult('watched-test-result', 'Episode marked as watched and then unwatched successfully.', 'success');
    } else {
      logResult('watched-test-result', 'Failed to unmark episode.', 'error');
    }
  } else {
    logResult('watched-test-result', 'Failed to mark episode as watched.', 'error');
  }
};

function clearWatchedData() {
  localStorage.removeItem('watchedMovies');
  localStorage.removeItem('watchedEpisodes');
  logResult('watched-test-result', 'All watched data cleared.', 'success');
};

function testVideoPreview(card) {
  const src = card.querySelector('img').src;
  const previewVideo = createPreviewVideo(src);
  card.appendChild(previewVideo);
  logResult('preview-test-result', 'Video preview started.', 'info');
};

function stopVideoPreview(card) {
  const video = card.querySelector('video');
  if (video) {
    video.remove();
    logResult('preview-test-result', 'Video preview stopped.', 'info');
  }
};

function testPreviewMute() {
  togglePreviewMute();
  const isMuted = JSON.parse(localStorage.getItem('previewMuted')) ?? true;
  logResult('preview-test-result', `Preview mute toggled. Muted: ${isMuted}`, 'success');
};

function testResponsive() {
  const width = window.innerWidth;
  logResult('responsive-test-result', `Current viewport width is ${width}px. Manual check required for layout changes.`, 'info');
};

function testTouchSupport() {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  logResult('responsive-test-result', `Touch support: ${hasTouch ? 'Detected' : 'Not detected'}.`, 'success');
};

function testKeyboardNavigation() {
  logResult('accessibility-test-result', 'Keyboard navigation test: Manual check required. Use Tab to navigate through interactive elements.', 'info');
};

function testScreenReader() {
  logResult('accessibility-test-result', 'Screen reader test: Manual check required. Use a screen reader to verify aria-labels and roles.', 'info');
};

function testFocusManagement() {
  const menuToggle = document.getElementById('menu-toggle');
  const closeBtn = document.getElementById('close-btn');
  const sidebar = document.getElementById('sidebar');

  menuToggle.click();
  setTimeout(() => {
    if (document.activeElement === closeBtn) {
      logResult('accessibility-test-result', 'Focus correctly moved to close button on sidebar open.', 'success');
      closeBtn.click(); 
      setTimeout(() => {
        if (document.activeElement === menuToggle) {
          logResult('accessibility-test-result', 'Focus correctly returned to menu toggle on sidebar close.', 'success');
        } else {
          logResult('accessibility-test-result', 'Focus not returned to menu toggle on sidebar close.', 'error');
        }
      }, 200);
    } else {
      logResult('accessibility-test-result', 'Focus not moved to close button on sidebar open.', 'error');
    }
  }, 200);
};

function testLoadTime() {
  const timing = performance.getEntriesByType('navigation')[0];
  logResult('performance-test-result', `Page load time: ${timing.duration.toFixed(2)}ms.`, 'info');
};

function testMemoryUsage() {
  if (performance.memory) {
    const used = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
    const total = (performance.memory.totalJSHeapSize / 1048576).toFixed(2);
    logResult('performance-test-result', `Memory usage: ${used}MB / ${total}MB.`, 'info');
  } else {
    logResult('performance-test-result', 'Memory API not supported in this browser.', 'error');
  }
};

function testNetworkRequests() {
  const requests = performance.getEntriesByType('resource');
  logResult('performance-test-result', `Total network requests: ${requests.length}.`, 'info');
};

async function checkSystemStatus() {
  const statusContainer = document.getElementById('system-status');
  statusContainer.innerHTML = '';

  const services = [
    { name: 'JSON Data Files', url: './data/movie_data.json' },
    { name: 'Catbox Video Host', url: 'https://files.catbox.moe/my2nqu', isCors: true },
    { name: 'AnonDrop Image Host', url: 'https://granny.anondrop.net/uploads/a91ea5edd4aad897/youtube_lBvZjp80R_M_1920x1080_h264.mp4', isCors: true }
  ];

  for (const service of services) {
    const statusDiv = document.createElement('div');
    const indicator = document.createElement('span');
    indicator.className = 'status-indicator status-loading';
    statusDiv.appendChild(indicator);
    statusDiv.append(`${service.name}: Checking...`);
    statusContainer.appendChild(statusDiv);

    try {
      const options = service.isCors ? { mode: 'no-cors' } : {};
      const response = await fetch(service.url, options);

      if (service.isCors || (response.ok && response.status >= 200 && response.status < 300)) {
        indicator.className = 'status-indicator status-online';
        statusDiv.textContent = '';
        statusDiv.appendChild(indicator);
        statusDiv.append(`${service.name}: Online`);
      } else {
        throw new Error(`Status ${response.status}`);
      }
    } catch (error) {
      indicator.className = 'status-indicator status-offline';
      statusDiv.textContent = '';
      statusDiv.appendChild(indicator);
      statusDiv.append(`${service.name}: Offline (${error.message})`);
    }
  }
} 