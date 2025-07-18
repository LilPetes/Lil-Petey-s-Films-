const CACHE_EXPIRY = 5 * 60 * 1000;
const WATCHED_MOVIES_KEY = 'watchedMovies';
const WATCHED_EPISODES_KEY = 'watchedEpisodes';

const cache = new Map();
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_EXPIRY) {
      cache.delete(key);
    }
  }
}, CACHE_EXPIRY);

export function getElement(selector) {
  const element = document.querySelector(selector);
  return element;
}

export function getElementById(id) {
  const element = document.getElementById(id);
  return element;
}

export function updateElement(element, content) {
  if (!element) return;
  element.innerHTML = content;
}

export function safeJSONParse(item) {
  if (typeof item !== 'string') {
    return null;
  }
  try {
    return JSON.parse(item);
  } catch (e) {
    console.error('Failed to parse JSON from localStorage', e);
    return null;
  }
}

export function getStorageItem(key, defaultValue = '[]') {
    if (typeof window.localStorage === 'undefined') {
        return safeJSONParse(defaultValue);
    }
    const item = localStorage.getItem(key);
    return safeJSONParse(item) || safeJSONParse(defaultValue);
}

export function setStorageItem(key, value) {
  if (typeof window.localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
}

export function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

export async function fetchData(url, options = {}) {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    return cached.data;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error('Invalid JSON response from server');
    }

    if (!Array.isArray(data) && typeof data !== 'object') {
      throw new Error('Expected array or object data from server');
    }

    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

export function handleError(error, element) {
  if (element) {
    element.innerHTML = `
      <div class="error-message">
        <p>An error occurred: ${error.message}</p>
        <p>Please try again later.</p>
      </div>
    `;
  }
}

export function showError(message, element) {
  if (!element) return;
  element.innerHTML = `
    <div class="error-message">
      <p>${message}</p>
    </div>
  `;
}

export function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

export function createImageElement(src, alt, className = '') {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  if (className) img.className = className;
  img.onerror = () => {
    img.src = './assets/placeholder.jpg';
    img.alt = 'Image not available';
  };
  return img;
}

export function createVideoElement(src, className = '') {
  const video = document.createElement('video');
  video.src = src;
  video.className = className;
  video.controls = true;
  video.onerror = () => {
    video.parentElement.innerHTML = `
      <div class="video-error">
        <p>Failed to load video. Please try again later.</p>
      </div>
    `;
  };
  return video;
}

export function initTheme() {
  const theme = localStorage.getItem('theme') || 'dark';
  document.documentElement.className = theme + '-mode';
  updateThemeButton(theme);
}

export function toggleTheme() {
  const currentTheme = document.documentElement.className.replace('-mode', '');
  let newTheme;
  
  switch (currentTheme) {
    case 'light':
      newTheme = 'dark';
      break;
    case 'dark':
      newTheme = 'oled';
      break;
    case 'oled':
      newTheme = 'light';
      break;
    default:
      newTheme = 'dark';
  }
  
  document.documentElement.className = newTheme + '-mode';
  localStorage.setItem('theme', newTheme);
  updateThemeButton(newTheme);
}

function updateThemeButton(theme) {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;
  
  switch (theme) {
    case 'light':
      themeToggle.textContent = '☀️';
      themeToggle.setAttribute('aria-label', 'Switch to dark mode');
      break;
    case 'dark':
      themeToggle.textContent = '🔅';
      themeToggle.setAttribute('aria-label', 'Switch to OLED mode');
      break;
    case 'oled':
      themeToggle.textContent = '🌙';
      themeToggle.setAttribute('aria-label', 'Switch to light mode');
      break;
  }
}

export function isMovieWatched(index) {
  const watched = getStorageItem(WATCHED_MOVIES_KEY, '[]');
  return watched.includes(index);
}

export function markMovieWatched(index) {
  const watched = getStorageItem(WATCHED_MOVIES_KEY, '[]');
  if (!watched.includes(index)) {
    watched.push(index);
    setStorageItem(WATCHED_MOVIES_KEY, watched);
  }
}

export function unmarkMovieWatched(index) {
  const watched = getStorageItem(WATCHED_MOVIES_KEY, '[]');
  const newWatched = watched.filter(i => i !== index);
  setStorageItem(WATCHED_MOVIES_KEY, newWatched);
}

export function getWatchedEpisodes() {
  return getStorageItem(WATCHED_EPISODES_KEY, '{}');
}

export function setWatchedEpisodes(obj) {
  setStorageItem(WATCHED_EPISODES_KEY, obj);
}

export function isEpisodeWatched(seasonIndex, episodeIndex) {
  const watched = getStorageItem(WATCHED_EPISODES_KEY, '{}');
  return watched[seasonIndex]?.includes(episodeIndex) || false;
  }

export function markEpisodeWatched(seasonIndex, episodeIndex) {
  const watched = getStorageItem(WATCHED_EPISODES_KEY, '{}');
  if (!watched[seasonIndex]) {
    watched[seasonIndex] = [];
  }
  if (!watched[seasonIndex].includes(episodeIndex)) {
    watched[seasonIndex].push(episodeIndex);
    setStorageItem(WATCHED_EPISODES_KEY, watched);
  }
}

export function unmarkEpisodeWatched(seasonIndex, episodeIndex) {
  const watched = getStorageItem(WATCHED_EPISODES_KEY, '{}');
  if (watched[seasonIndex]) {
    watched[seasonIndex] = watched[seasonIndex].filter(i => i !== episodeIndex);
    setStorageItem(WATCHED_EPISODES_KEY, watched);
  }
}

export function createWatchedIndicator(seasonIndex, episodeIndex, titleElement) {
  const watchedDiv = document.createElement('div');
  watchedDiv.className = 'watched-indicator';
  watchedDiv.tabIndex = 0;
  watchedDiv.setAttribute('role', 'button');
  watchedDiv.setAttribute('aria-label', 'Remove watched status');
  watchedDiv.textContent = '✔️ Watched';
  
  watchedDiv.addEventListener('mouseenter', () => {
    watchedDiv.textContent = '❌ Remove Watched Status';
  });
  
  watchedDiv.addEventListener('mouseleave', () => {
    watchedDiv.textContent = '✔️ Watched';
  });
  
  watchedDiv.addEventListener('click', () => {
    unmarkEpisodeWatched(seasonIndex, episodeIndex);
    const markWatchedBtn = createMarkWatchedButton(seasonIndex, episodeIndex, titleElement);
    watchedDiv.replaceWith(markWatchedBtn);
  });
  
  watchedDiv.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      watchedDiv.click();
    }
  });
  
  return watchedDiv;
}

export function createMarkWatchedButton(seasonIndex, episodeIndex, titleElement) {
  const markWatchedBtn = document.createElement('div');
  markWatchedBtn.className = 'mark-watched-btn';
  markWatchedBtn.tabIndex = 0;
  markWatchedBtn.setAttribute('role', 'button');
  markWatchedBtn.setAttribute('aria-label', 'Mark as watched');
  markWatchedBtn.textContent = '👁️ Mark as Watched';
  
  markWatchedBtn.addEventListener('click', () => {
    markEpisodeWatched(seasonIndex, episodeIndex);
    const watchedDiv = createWatchedIndicator(seasonIndex, episodeIndex, titleElement);
    markWatchedBtn.replaceWith(watchedDiv);
  });
  
  markWatchedBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      markWatchedBtn.click();
    }
  });
  
  return markWatchedBtn;
}

let previewMuted = true;
try {
  previewMuted = getStorageItem('previewMuted', 'true') !== false;
} catch (e) {}

export function togglePreviewMute() {
  previewMuted = !previewMuted;
  try {
    setStorageItem('previewMuted', previewMuted);
  } catch (e) {}
  
  document.querySelectorAll('.preview-video').forEach(v => v.muted = previewMuted);
  document.querySelectorAll('.preview-volume-btn').forEach(btn => {
    btn.innerHTML = previewMuted ? '🔇' : '🔊';
    btn.setAttribute('aria-label', previewMuted ? 'Unmute preview' : 'Mute preview');
  });
  
  window.dispatchEvent(new Event('previewMuteChanged'));
}

export function createPreviewVideo(src, title, muted = true) {
  if (!src) return null;

  const video = document.createElement('video');
  video.muted = typeof previewMuted !== 'undefined' ? previewMuted : muted;
  video.loop = true;
  video.playsInline = true;
  video.disablePictureInPicture = true;
  video.className = 'preview-video';
  video.setAttribute('aria-hidden', 'true');

  const source = document.createElement('source');
  source.src = src;
  source.type = 'video/mp4';
  video.appendChild(source);

  return video;
}

export function loadSidebarData(url, container, linkTemplate) {
  if (!container) return;

  container.innerHTML = '<p>Loading...</p>';

  fetchData(url)
    .then(data => {
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format');
      }

      const links = data.map((item, index) => {
        const link = document.createElement('a');
        link.href = linkTemplate(index);
        link.textContent = item.title || `Item ${index + 1}`;
        link.setAttribute('role', 'menuitem');
        link.setAttribute('data-title', item.title || `Item ${index + 1}`);
        return link;
      });

      container.innerHTML = '';
      links.forEach(link => container.appendChild(link));
    })
    .catch(error => {
      container.innerHTML = `
        <div class="error-message">
          <p>Failed to load data. Please try again later.</p>
        </div>
      `;
    });
}