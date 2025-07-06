import { initSidebar } from './sidebar.js';
import { fetchData, sanitizeHTML, handleError, isMovieWatched, markMovieWatched, unmarkMovieWatched, isEpisodeWatched, markEpisodeWatched, unmarkEpisodeWatched, createPreviewVideo, togglePreviewMute } from './utils.js';

function main() {
    fetch('./sidebar.html')
      .then(res => res.text())
      .then(html => {
        document.getElementById('sidebar-container').innerHTML = html;
      })
      .then(() => {
        initSidebar();
      });

    window.addEventListener('previewMuteChanged', () => {
      const muted = localStorage.getItem('previewMuted') !== 'false';
      document.querySelectorAll('.preview-video').forEach(v => v.muted = muted);
      document.querySelectorAll('.preview-volume-btn').forEach(btn => {
        btn.innerHTML = muted ? '🔇' : '🔊';
        btn.setAttribute('aria-label', muted ? 'Unmute preview' : 'Mute preview');
      });
    });

    function createWatchedIndicator(type, idx, extra, sidebar) {
      const watched = type === 'movie'
        ? isMovieWatched(idx)
        : isEpisodeWatched(idx, extra);
      if (!watched) return null;
      const span = document.createElement('span');
      span.className = sidebar ? 'watched-indicator-sidebar' : 'watched-indicator';
      span.style.cursor = 'pointer';
      span.tabIndex = 0;
      span.setAttribute('role', 'button');
      span.setAttribute('aria-label', sidebar ? 'Remove' : 'Remove');
      span.textContent = sidebar ? '✔️' : '✔️ Watched';
      span.addEventListener('mouseenter', () => {
        span.textContent = sidebar ? '❌' : '❌ Remove';
      });
      span.addEventListener('mouseleave', () => {
        span.textContent = sidebar ? '✔️' : '✔️ Watched';
      });
      span.addEventListener('click', (e) => {
        e.stopPropagation();
        if (type === 'movie') {
          unmarkMovieWatched(idx);
          renderGallery(sortItems(moviesData, movieSort ? movieSort.value : 'default'), 'movie-gallery', 'movie.html', 'movie');
        } else {
          unmarkEpisodeWatched(idx, extra);
          renderGallery(sortItems(episodesData, episodesSort ? episodesSort.value : 'default'), 'episodes-gallery', 'episodes.html', 'season');
        }
      });
      span.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          span.click();
        }
      });
      return span;
    }

    function setupPreview(card, previewSrc, itemTitle) {
      let previewVideo = null;
      let previewTimer = null;
      let previewLoaded = false;
      let volumeBtn = null;
      card.addEventListener('mouseenter', () => {
        previewTimer = setTimeout(() => {
          if (!previewVideo) {
            previewVideo = createPreviewVideo(previewSrc, itemTitle);
            if (previewVideo) {
              card.appendChild(previewVideo);
              previewVideo.muted = localStorage.getItem('previewMuted') !== 'false';
              const startTime = Math.max(0, (previewVideo.duration / 2) - 10);
              let seekAndPlay = () => {
                previewVideo.currentTime = startTime;
                previewVideo.play().catch(() => {});
                previewVideo.classList.add('active');
              };
              if (previewVideo.readyState >= 3) {
                seekAndPlay();
              } else {
                previewVideo.addEventListener('canplay', seekAndPlay, { once: true });
              }
              volumeBtn = document.createElement('button');
              volumeBtn.className = 'preview-volume-btn';
              const updateVolumeBtn = () => {
                volumeBtn.innerHTML = previewVideo.muted ? '🔇' : '🔊';
                volumeBtn.setAttribute('aria-label', previewVideo.muted ? 'Unmute preview' : 'Mute preview');
              };
              updateVolumeBtn();
              volumeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                togglePreviewMute();
              });
              card.appendChild(volumeBtn);
              previewVideo.addEventListener('timeupdate', () => {
                if (previewVideo.currentTime >= previewVideo.duration - 0.1) {
                  previewVideo.currentTime = startTime;
                  previewVideo.play().catch(() => {});
                }
              });
            }
          } else {
            previewVideo.classList.add('active');
            previewVideo.muted = localStorage.getItem('previewMuted') !== 'false';
            const startTime = Math.max(0, (previewVideo.duration / 2) - 10);
            if (previewVideo.readyState >= 3) {
              previewVideo.currentTime = startTime;
              previewVideo.play().catch(() => {});
            } else {
              previewVideo.addEventListener('canplay', () => {
                previewVideo.currentTime = startTime;
                previewVideo.play().catch(() => {});
              }, { once: true });
            }
            volumeBtn = card.querySelector('.preview-volume-btn');
            if (volumeBtn) volumeBtn.style.display = '';
          }
          previewLoaded = true;
        }, 1000);
      });
      card.addEventListener('mouseleave', () => {
        if (previewTimer) {
          clearTimeout(previewTimer);
          previewTimer = null;
        }
        if (previewVideo && previewLoaded) {
          const startTime = Math.max(0, (previewVideo.duration / 2) - 10);
          previewVideo.classList.remove('active');
          previewVideo.pause();
          previewVideo.currentTime = startTime;
          volumeBtn = card.querySelector('.preview-volume-btn');
          if (volumeBtn) volumeBtn.style.display = 'none';
        }
      });
    }

    function createCard(item, index, page, paramName, containerId) {
      const card = document.createElement('article');
      card.className = 'movie-card';
      const cardId = `card-${paramName || 'item'}-${index}`;
      card.setAttribute('aria-labelledby', cardId);

      const originalIndex = (paramName === 'movie' && moviesData) 
        ? moviesData.findIndex(m => m.title === item.title)
        : (paramName === 'season' && episodesData) 
            ? episodesData.findIndex(s => s.title === item.title)
            : -1;

      if (page) {
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `View ${item.title || 'item'} details`);
        if (originalIndex !== -1) {
            card.onclick = () => {
              if (page === 'movie.html') {
                markMovieWatched(originalIndex);
              }
              window.location.href = `./${page}?${paramName}=${originalIndex}`;
            };
            card.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (page === 'movie.html') {
                  markMovieWatched(originalIndex);
                }
                window.location.href = `./${page}?${paramName}=${originalIndex}`;
              }
            });
        }
      }
      const img = document.createElement('img');
      img.src = item.thumbnail || '';
      img.alt = `${item.title || 'Untitled'} thumbnail`;
      img.loading = 'lazy';
      img.setAttribute('decoding', 'async');
      img.onerror = () => {
        img.src = 'placeholder.jpg';
        img.alt = 'Image could not be loaded';
        img.onerror = null;
      };

      let previewSrc;
      if (containerId === 'coming-soon-gallery' && item.trailer) {
        previewSrc = item.trailer;
      } else if (paramName === 'season' && Array.isArray(item.embed_links) && item.embed_links.length > 0) {
        previewSrc = item.embed_links[0].embed_link;
      } else if (paramName === 'movie' && item.embed_link) {
        previewSrc = item.embed_link;
      } else {
        previewSrc = item.preview || item.embed_link;
      }
      
      if (previewSrc) {
        setupPreview(card, previewSrc, item.title);
      }
      const title = document.createElement('h3');
      title.id = cardId;
      title.className = 'title';
      title.textContent = item.title || 'Untitled';
      const titleContainer = document.createElement('div');
      titleContainer.className = 'title-container';
      titleContainer.appendChild(title);

      if (page === 'movie.html') {
        if (originalIndex !== -1) {
          const watched = createWatchedIndicator('movie', originalIndex, null, false);
          if (watched) {
            titleContainer.appendChild(watched);
          }
        }
      } else if (page === 'episodes.html') {
        if (originalIndex !== -1) {
            const season = episodesData[originalIndex];
            if (season && season.episodes && season.episodes.length > 0) {
                const allEpisodesWatched = season.episodes.every((_, episodeIndex) => isEpisodeWatched(originalIndex, episodeIndex));
                if (allEpisodesWatched) {
                    const watchedIndicator = createWatchedIndicator('episode', originalIndex, null, false);
                    if (watchedIndicator) {
                        titleContainer.appendChild(watchedIndicator);
                    }
                }
            }
        }
      }
      card.appendChild(img);
      card.appendChild(titleContainer);
 
      if (item.description) {
        const description = document.createElement('p');
        description.className = 'description';
        const formattedDescription = item.description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        description.innerHTML = formattedDescription;
        card.appendChild(description);
      }
      
      return card;
    }

    function sortItems(items, sortBy) {
        if (!items) return [];
        const itemsCopy = [...items];
        if (sortBy === 'title') {
            return itemsCopy.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        } else {
            return itemsCopy;
        }
    }

    function renderGallery(items, containerId, page, paramName, noItemsMessage = 'Nothing to show here.') {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = '';
      if (!items || items.length === 0) {
        container.textContent = noItemsMessage;
        return;
      }
      items.forEach((item, index) => {
        const card = createCard(item, index, page, paramName, containerId);
        container.appendChild(card);
      });
    }

    let moviesData = [], episodesData = [], comingSoonData = [];
    const movieSort = document.getElementById('movie-sort');
    const episodesSort = document.getElementById('episodes-sort');

    async function loadDataSections() {
      const movieGallery = document.getElementById('movie-gallery');
      const episodesGallery = document.getElementById('episodes-gallery');
      const comingSoonGallery = document.getElementById('coming-soon-gallery');

      fetchData('./data/movie_data.json')
        .then(movies => {
          moviesData = movies || [];
          renderGallery(sortItems(moviesData, movieSort ? movieSort.value : 'default'), 'movie-gallery', 'movie.html', 'movie');
        })
        .catch(error => {
          console.error('Failed to load movies:', error);
          moviesData = [];
          if (movieGallery) {
            movieGallery.innerHTML = '<div class="error-message"><p>Failed to load movies. Please try again later.</p></div>';
          }
        });

      fetchData('./data/episodes_data.json')
        .then(episodes => {
          episodesData = episodes || [];
          renderGallery(sortItems(episodesData, episodesSort ? episodesSort.value : 'default'), 'episodes-gallery', 'episodes.html', 'season');
        })
        .catch(error => {
          console.error('Failed to load episodes:', error);
          episodesData = [];
          if (episodesGallery) {
            episodesGallery.innerHTML = '<div class="error-message"><p>Failed to load episodes. Please try again later.</p></div>';
          }
        });

      fetchData('./data/comingsoon_data.json')
        .then(comingSoon => {
          comingSoonData = comingSoon || [];
          renderGallery(comingSoonData, 'coming-soon-gallery', null, null, 'No upcoming projects scheduled.');
        })
        .catch(error => {
          console.error('Failed to load coming soon data:', error);
          comingSoonData = [];
          if (comingSoonGallery) {
            comingSoonGallery.innerHTML = '<div class="error-message"><p>Failed to load upcoming releases. Please try again later.</p></div>';
          }
        });
    }

    loadDataSections();

    if (movieSort) {
        movieSort.addEventListener('change', (e) => {
            renderGallery(sortItems(moviesData, e.target.value), 'movie-gallery', 'movie.html', 'movie');
        });
    }

    if (episodesSort) {
        episodesSort.addEventListener('change', (e) => {
            renderGallery(sortItems(episodesData, e.target.value), 'episodes-gallery', 'episodes.html', 'season');
        });
    }
}

main(); 
