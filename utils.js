const getElement = (selector) => {
  const element = typeof selector === 'string' ? 
    document.querySelector(selector) : 
    selector;

  if (!element) console.warn(`Element with selector '${selector}' not found`);
  return element;
};

const getElementById = (id) => {
  const element = document.getElementById(id);
  if (!element) console.warn(`Element with id '${id}' not found`);
  return element;
};

const updateElement = (selector, updateFn) => {
  const element = getElement(selector);
  if (element) updateFn(element);
};

const debounce = (func, delay) => {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

const dataCache = {};

const CACHE_EXPIRY = 5 * 60 * 1000;

const fetchData = async (url, options = {}) => {
  const { useCache = true, cacheTime = CACHE_EXPIRY } = options;

  try {
    if (useCache && dataCache[url] && Date.now() - dataCache[url].timestamp < cacheTime) {
      return dataCache[url].data;
    }

    const response = await fetch(url, options.fetchOptions || {});
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);

    const data = await response.json();

    if (useCache) {
      dataCache[url] = {
        data,
        timestamp: Date.now()
      };
    }

    return data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
};

const showError = (selector, message) => {
  const element = getElement(selector);
  if (element) {
    element.textContent = message || 'An error occurred. Please try again.';
    element.style.color = 'red';
    element.setAttribute('role', 'alert');
    element.setAttribute('aria-live', 'assertive');
  }
};

const handleError = (error, errorContainer, fallbackContent = null) => {
  console.error(error);

  if (typeof errorContainer === 'string') {
    errorContainer = getElement(errorContainer);
  }

  if (errorContainer) {
    errorContainer.innerHTML = '';

    const errorMessage = document.createElement('div');
    errorMessage.textContent = typeof error === 'string' ? error : error.message || 'An unexpected error occurred';
    errorMessage.className = 'error-message';
    errorMessage.setAttribute('role', 'alert');
    errorMessage.setAttribute('aria-live', 'assertive');

    if (fallbackContent) {
      const fallbackElement = document.createElement('div');
      fallbackElement.className = 'fallback-content';
      fallbackElement.innerHTML = fallbackContent;
      errorContainer.appendChild(fallbackElement);
    }

    errorContainer.appendChild(errorMessage);
  }
};

const sanitizeHTML = (html) => {
  return html.replace(/[<>&"']/g, (match) => {
    return {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#39;'
    }[match];
  });
};

const createImage = (src, alt, className) => {
  const img = document.createElement('img');
  img.src = src || '';
  img.alt = alt || 'Image';
  if (className) img.className = className;
  img.loading = 'lazy';

  img.setAttribute('decoding', 'async');
  if (!alt || alt === 'Image') {
    img.setAttribute('role', 'presentation');
  }

  img.onerror = () => {
    img.src = 'placeholder.jpg';
    img.alt = 'Image could not be loaded';
    img.onerror = null;
  };

  return img;
};

const createIframe = (src, title, aspectRatio = '56.25%') => {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.paddingBottom = aspectRatio;
  wrapper.style.height = '0';
  wrapper.style.overflow = 'hidden';
  wrapper.className = 'iframe-wrapper';

  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.title = title || 'Embedded content';
  iframe.style.position = 'absolute';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.loading = 'lazy';
  iframe.allowFullscreen = true;

  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
  iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
  iframe.setAttribute('aria-labelledby', `iframe-title-${Math.random().toString(36).substring(2, 9)}`);

  const titleElement = document.createElement('p');
  titleElement.id = iframe.getAttribute('aria-labelledby');
  titleElement.className = 'sr-only';
  titleElement.textContent = iframe.title;

  wrapper.appendChild(titleElement);
  wrapper.appendChild(iframe);
  return wrapper;
};

const createVideo = (src, title, poster, aspectRatio = '56.25%') => {
  const wrapper = document.createElement('div');
  wrapper.className = 'video-wrapper';
  wrapper.style.position = 'relative';
  wrapper.style.paddingBottom = aspectRatio;
  wrapper.style.height = '0';
  wrapper.style.overflow = 'hidden';

  const video = document.createElement('video');
  video.controls = true;
  video.style.position = 'absolute';
  video.style.top = '0';
  video.style.left = '0';
  video.style.width = '100%';
  video.style.height = '100%';
  video.style.objectFit = 'cover';
  video.title = title || 'Video content';
  video.loading = 'lazy';
  video.poster = poster || 'placeholder.jpg';

  video.setAttribute('preload', 'metadata');
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-label', title || 'Video content');

  video.setAttribute('controlsList', 'nodownload');

  video.addEventListener('error', () => {
    const errorMessage = document.createElement('div');
    errorMessage.className = 'video-error';
    errorMessage.textContent = 'Video could not be loaded';
    errorMessage.setAttribute('role', 'alert');
    wrapper.appendChild(errorMessage);
  });

  if (src) {
    const source = document.createElement('source');
    source.src = src;
    source.type = 'video/mp4';
    video.appendChild(source);
  }

  wrapper.appendChild(video);
  return wrapper;
};

const renderMediaPage = async (config) => {
  const {
    mediaType,
    dataUrl,
    paramName,
    containers = {}
  } = config;

  try {
    const params = new URLSearchParams(window.location.search);
    const mediaIndex = parseInt(params.get(paramName), 10);

    if (isNaN(mediaIndex)) {
      const errorMessage = `Invalid ${mediaType} ID. Please <a href="./index.html">return to the home page</a>.`;
      if (containers.errorContainer) {
        const errorElement = getElement(containers.errorContainer);
        if (errorElement) {
          errorElement.innerHTML = errorMessage;
          errorElement.classList.add('error-message');
          errorElement.setAttribute('role', 'alert');
          errorElement.style.whiteSpace = 'pre-wrap';
          errorElement.style.textAlign = 'center';
        }
      }
      return null;
    }

    const data = await fetchData(dataUrl);
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format');
    }

    const mediaItem = data[mediaIndex];
    if (!mediaItem) {
      throw new Error(`${mediaType} with ID ${mediaIndex} not found`);
    }

    document.title = mediaItem.title || mediaType;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', `Watch ${mediaItem.title} - ${mediaItem.description?.substring(0, 100) || ''}...`);
    }

    if (containers.headerBg) {
      updateElement(containers.headerBg, el => {
        el.style.backgroundImage = `url('${mediaItem.thumbnail || ''}')`;        
      });
    }

    if (containers.headerText) {
      updateElement(containers.headerText, el => {
        el.textContent = mediaItem.title || `Untitled ${mediaType}`;
      });
    }

    if (containers.thumbnail) {
      updateElement(containers.thumbnail, el => {
        el.src = mediaItem.thumbnail || '';
        el.alt = `${mediaItem.title || mediaType} thumbnail`;
        el.loading = 'lazy';
        el.setAttribute('aria-hidden', 'false');
        el.onerror = () => {
          el.src = 'placeholder.jpg';
          el.onerror = null;
        };
      });
    }

    if (containers.description) {
      updateElement(containers.description, el => {
        el.textContent = mediaItem.description || 'No description available';
      });
    }

    return mediaItem;
  } catch (error) {
    handleError(error, containers.errorContainer);
    return null;
  }
};

const loadSidebarData = (url, container, linkTemplate) => {
  if (!container) return Promise.reject(new Error(`Container not found`));

  container.innerHTML = '<p style="opacity: 0.6;" aria-live="polite">Loading...</p>';

  return fetchData(url)
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = '<p style="opacity: 0.6;" role="status">No items available</p>';
        return;
      }

      container.innerHTML = '';
      const fragment = document.createDocumentFragment();

      data.forEach((item, i) => {
        const link = document.createElement('a');
        link.href = linkTemplate(i);
        link.textContent = item.title || `Item ${i+1}`;
        link.setAttribute("data-title", item.title || '');

        link.setAttribute('role', 'menuitem');

        fragment.appendChild(link);
      });

      container.appendChild(fragment);

      if (container.querySelectorAll('a[style="display: none;"]').length === container.querySelectorAll('a').length) {
        const noResults = document.createElement('p');
        noResults.textContent = 'No matching results';
        noResults.className = 'no-results';
        noResults.setAttribute('role', 'status');
        container.appendChild(noResults);
      }
    })
    .catch(err => {
      console.error(`Failed to load data from ${url}:`, err);
      container.innerHTML = `<p style="color: red;" role="alert">Failed to load data.</p>`;
    });
};

window.utils = {
  getElement,
  getElementById,
  updateElement,
  debounce,
  fetchData,
  showError,
  handleError,
  createImage,
  createIframe,
  createVideo,
  sanitizeHTML,
  renderMediaPage,
  loadSidebarData
};
