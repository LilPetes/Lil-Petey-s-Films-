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

const fetchData = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
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
  }
};

const createImage = (src, alt, className) => {
  const img = document.createElement('img');
  img.src = src || '';
  img.alt = alt || '';
  if (className) img.className = className;
  img.loading = 'lazy';

  img.onerror = () => {
    img.src = 'placeholder.jpg';
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

  wrapper.appendChild(iframe);
  return wrapper;
};

window.utils = {
  getElement,
  getElementById,
  updateElement,
  debounce,
  fetchData,
  showError,
  createImage,
  createIframe
};
