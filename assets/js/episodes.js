import { initSidebar } from './sidebar.js';
import { fetchData, sanitizeHTML, handleError, markEpisodeWatched, isEpisodeWatched, unmarkEpisodeWatched } from './utils.js';

fetch('./sidebar.html')
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
    description: '.season-description'
  };
  const params = new URLSearchParams(window.location.search);
  const seasonIdx = parseInt(params.get('season'), 10);
  let seasonData = null;
  try {
    const data = await fetchData('./data/episodes_data.json');
    if (!Array.isArray(data) || isNaN(seasonIdx) || seasonIdx < 0 || seasonIdx >= data.length) {
      throw new Error('Invalid season index');
    }
    seasonData = data[seasonIdx];
    const titleEl = document.querySelector(containers.title);
    const imgEl = document.querySelector(containers.content);
    const descEl = document.querySelector(containers.description);
    const errorEl = document.querySelector(containers.error);
    
    if (errorEl) errorEl.style.display = 'none';
    
    if (titleEl) titleEl.textContent = seasonData.title || `Season ${seasonIdx + 1}`;
    if (imgEl) {
      imgEl.src = seasonData.thumbnail || '';
      imgEl.alt = seasonData.title || `Season ${seasonIdx + 1} thumbnail`;
      imgEl.onerror = () => {
        imgEl.src = 'placeholder.jpg';
        imgEl.alt = 'Image could not be loaded';
      };
    }
    const headerBg = document.querySelector('.header-background');
    if (headerBg) {
      headerBg.style.backgroundImage = `url('${seasonData.thumbnail || 'placeholder.jpg'}')`;
    }
    if (descEl) descEl.textContent = seasonData.description || '';
  } catch (error) {
    const errorEl = document.querySelector(containers.error);
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerHTML = `Invalid season ID. Please <a href="./index.html">return to the home page</a>.`;
    }
    return;
  }
  const episodesList = document.getElementById('episodes-list');
  if (!episodesList) return;
  episodesList.innerHTML = '';
  if (!Array.isArray(seasonData.embed_links) || seasonData.embed_links.length === 0) {
    const noEpisodes = document.createElement('p');
    noEpisodes.textContent = 'No episodes available for this season.';
    noEpisodes.className = 'no-episodes';
    noEpisodes.setAttribute('role', 'status');
    episodesList.appendChild(noEpisodes);
    return;
  }
  const fragment = document.createDocumentFragment();
  seasonData.embed_links.forEach((episode, index) => {
    if (!episode) return;
    const episodeElement = document.createElement('article');
    episodeElement.className = 'episode';
    episodeElement.setAttribute('aria-labelledby', `episode-title-${index}`);
    
    const titleElement = document.createElement('h2');
    titleElement.id = `episode-title-${index}`;
    titleElement.textContent = episode.title || `Episode ${index + 1}`;
    episodeElement.appendChild(titleElement);

    if (isEpisodeWatched(seasonIdx, index)) {
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
        unmarkEpisodeWatched(seasonIdx, index);
        watchedDiv.remove();
        const markWatchedBtn = document.createElement('div');
        markWatchedBtn.className = 'mark-watched-btn';
        markWatchedBtn.tabIndex = 0;
        markWatchedBtn.setAttribute('role', 'button');
        markWatchedBtn.setAttribute('aria-label', 'Mark as watched');
        markWatchedBtn.textContent = '👁️ Mark as Watched';
        markWatchedBtn.addEventListener('click', () => {
          markEpisodeWatched(seasonIdx, index);
          markWatchedBtn.remove();
          const watchedIndicator = document.createElement('div');
          watchedIndicator.className = 'watched-indicator';
          watchedIndicator.tabIndex = 0;
          watchedIndicator.setAttribute('role', 'button');
          watchedIndicator.setAttribute('aria-label', 'Remove watched status');
          watchedIndicator.textContent = '✔️ Watched';
          watchedIndicator.addEventListener('mouseenter', () => {
            watchedIndicator.textContent = '❌ Remove Watched Status';
          });
          watchedIndicator.addEventListener('mouseleave', () => {
            watchedIndicator.textContent = '✔️ Watched';
          });
          watchedIndicator.addEventListener('click', () => {
            unmarkEpisodeWatched(seasonIdx, index);
            watchedIndicator.remove();
            episodeElement.appendChild(markWatchedBtn);
          });
          watchedIndicator.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              watchedIndicator.click();
            }
          });
          titleElement.after(watchedIndicator);
        });
        markWatchedBtn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            markWatchedBtn.click();
          }
        });
        titleElement.after(markWatchedBtn);
      });
      watchedDiv.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          watchedDiv.click();
        }
      });
      episodeElement.appendChild(watchedDiv);
    } else {
      const markWatchedBtn = document.createElement('div');
      markWatchedBtn.className = 'mark-watched-btn';
      markWatchedBtn.tabIndex = 0;
      markWatchedBtn.setAttribute('role', 'button');
      markWatchedBtn.setAttribute('aria-label', 'Mark as watched');
      markWatchedBtn.textContent = '👁️ Mark as Watched';
      markWatchedBtn.addEventListener('click', () => {
        markEpisodeWatched(seasonIdx, index);
        markWatchedBtn.remove();
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
          unmarkEpisodeWatched(seasonIdx, index);
          watchedDiv.remove();
          titleElement.after(markWatchedBtn);
        });
        watchedDiv.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            watchedDiv.click();
          }
        });
        titleElement.after(watchedDiv);
      });
      markWatchedBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          markWatchedBtn.click();
        }
      });
      episodeElement.appendChild(markWatchedBtn);
    }

    const descriptionElement = document.createElement('p');
    const safeDescription = sanitizeHTML(episode.description || 'No description available');
    descriptionElement.textContent = safeDescription;
    episodeElement.appendChild(descriptionElement);

    if (episode.embed_link) {
      const video = document.createElement('video');
      video.src = episode.embed_link;
      video.classList.add('content-video');
      video.title = episode.title || `Episode ${index + 1}`;
      video.setAttribute('loading', 'lazy');
      video.setAttribute('controls', '');
      if (episode.thumbnail) {
        video.setAttribute('poster', episode.thumbnail);
      }
      video.onerror = () => {
        const unavailableMsg = document.createElement('p');
        unavailableMsg.textContent = 'Video failed to load';
        unavailableMsg.className = 'unavailable-message';
        unavailableMsg.setAttribute('role', 'status');
        video.parentElement.replaceChild(unavailableMsg, video);
      };
      episodeElement.appendChild(video);
    } else {
      const unavailableMsg = document.createElement('p');
      unavailableMsg.textContent = 'Video unavailable';
      unavailableMsg.className = 'unavailable-message';
      unavailableMsg.setAttribute('role', 'status');
      episodeElement.appendChild(unavailableMsg);
    }
    fragment.appendChild(episodeElement);
  });
  episodesList.appendChild(fragment);
}); 