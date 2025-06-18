import { getElement, updateElement, fetchData, handleError } from './utils.js';

export function renderMediaPage(config) {
  const { mediaType, dataUrl, paramName, containers } = config;
  const params = new URLSearchParams(window.location.search);
  const mediaIndex = parseInt(params.get(paramName));

  if (isNaN(mediaIndex)) {
    const errorContainer = getElement(containers.error);
    if (errorContainer) {
      errorContainer.innerHTML = `
        <div class="error-message">
          <p>Invalid ${mediaType} index. Please select a valid ${mediaType} from the sidebar.</p>
        </div>
      `;
    }
    return;
  }

  fetchData(dataUrl)
    .then(data => {
      if (!Array.isArray(data) || mediaIndex >= data.length) {
        throw new Error(`Invalid ${mediaType} data or index out of range`);
      }

      const mediaItem = data[mediaIndex];
      const titleContainer = getElement(containers.title);
      const contentContainer = getElement(containers.content);
      const descriptionContainer = getElement(containers.description);

      if (titleContainer) {
        titleContainer.textContent = mediaItem.title || `Untitled ${mediaType}`;
      }

      if (contentContainer) {
        if (mediaItem.thumbnail) {
          const img = document.createElement('img');
          img.src = mediaItem.thumbnail;
          img.alt = mediaItem.title || `Thumbnail for ${mediaType}`;
          img.onerror = () => {
            img.src = './assets/placeholder.jpg';
            img.alt = 'Image not available';
          };
          contentContainer.appendChild(img);
        }

        if (mediaItem.video) {
          const video = document.createElement('video');
          video.src = mediaItem.video;
          video.controls = true;
          video.onerror = () => {
            video.parentElement.innerHTML = `
              <div class="video-error">
                <p>Failed to load video. Please try again later.</p>
              </div>
            `;
          };
          contentContainer.appendChild(video);
        }
      }

      if (descriptionContainer) {
        descriptionContainer.textContent = mediaItem.description || `No description available for this ${mediaType}.`;
      }

      document.title = `${mediaItem.title || `Untitled ${mediaType}`} - Films`;
    })
    .catch(error => handleError(error, getElement(containers.error)));
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
      console.error('Error loading sidebar data:', error);
    });
} 