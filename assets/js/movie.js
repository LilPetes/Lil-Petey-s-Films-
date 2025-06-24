import { initSidebar } from './sidebar.js';
import { fetchData, handleError, markMovieWatched, isMovieWatched, unmarkMovieWatched } from './utils.js';

fetch('/sidebar.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('sidebar-container').innerHTML = html;
  })
  .then(() => {
    initSidebar();
  });

document.addEventListener('DOMContentLoaded', async () => {
  const containers = {
    error: '.error-message',
    title: '.header-text',
    content: '.content-section img',
    description: '.movie-description'
  };
  const params = new URLSearchParams(window.location.search);
  const movieIdx = parseInt(params.get('movie'), 10);
  let movieData = null;
  try {
    const data = await fetchData('/data/movie_data.json');
    if (!Array.isArray(data) || isNaN(movieIdx) || movieIdx < 0 || movieIdx >= data.length) {
      throw new Error('Invalid movie index');
    }
    movieData = data[movieIdx];
    const titleEl = document.querySelector(containers.title);
    const imgEl = document.querySelector(containers.content);
    const descEl = document.querySelector(containers.description);
    const errorEl = document.querySelector(containers.error);
    
    if (errorEl) errorEl.style.display = 'none';
    
    if (titleEl) titleEl.textContent = movieData.title || `Movie ${movieIdx + 1}`;
    if (imgEl) {
      imgEl.src = movieData.thumbnail || '';
      imgEl.alt = movieData.title || `Movie ${movieIdx + 1} thumbnail`;
      imgEl.onerror = () => {
        imgEl.src = 'placeholder.jpg';
        imgEl.alt = 'Image could not be loaded';
      };
    }
    const headerBg = document.querySelector('.header-background');
    if (headerBg) {
      headerBg.style.backgroundImage = `url('${movieData.thumbnail || 'placeholder.jpg'}')`;
    }
    if (descEl) descEl.textContent = movieData.description || '';
  } catch (error) {
    const errorEl = document.querySelector(containers.error);
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerHTML = `Invalid movie ID. Please <a href="./index.html">return to the home page</a>.`;
    }
    return;
  }
  markMovieWatched(movieIdx);
  const headerText = document.querySelector('.header-text');
  if (headerText) {
    let indicator = headerText.parentNode.querySelector('.watched-indicator');
    if (indicator) indicator.remove();
    if (isMovieWatched(movieIdx)) {
      indicator = document.createElement('div');
      indicator.className = 'watched-indicator';
      indicator.style.marginTop = '8px';
      indicator.style.fontSize = '1.2rem';
      indicator.style.cursor = 'pointer';
      indicator.tabIndex = 0;
      indicator.setAttribute('role', 'button');
      indicator.setAttribute('aria-label', 'Remove watched status');
      indicator.textContent = '✔️ Watched';
      indicator.addEventListener('mouseenter', () => {
        indicator.textContent = '❌ Remove Watched Status';
      });
      indicator.addEventListener('mouseleave', () => {
        indicator.textContent = '✔️ Watched';
      });
      indicator.addEventListener('click', () => {
        unmarkMovieWatched(movieIdx);
        indicator.remove();
      });
      indicator.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          indicator.click();
        }
      });
      headerText.parentNode.insertBefore(indicator, headerText.nextSibling);
    }
  }
  const embedVideo = document.querySelector('.embed-section video');
  if (embedVideo) {
    if (movieData.embed_link) {
      embedVideo.src = movieData.embed_link;
      embedVideo.title = `${movieData.title || 'Movie'} content`;
      embedVideo.setAttribute('aria-label', `${movieData.title || 'Movie'} player`);
      embedVideo.setAttribute('poster', movieData.thumbnail || 'placeholder.jpg');
      embedVideo.setAttribute('controls', '');
      embedVideo.setAttribute('loading', 'lazy');
      embedVideo.onerror = () => {
        const parent = embedVideo.parentElement;
        if (parent) {
          parent.innerHTML = `
                <div class="error-message" role="alert">
                  <p>Failed to load video. Please try again later.</p>
                </div>
              `;
        }
      };
    } else {
      const parent = embedVideo.parentElement;
      if (parent) {
        parent.innerHTML = `
              <div class="error-message" role="alert">
                <p>Video content is not available for this movie.</p>
              </div>
            `;
      }
    }
  }
}); 