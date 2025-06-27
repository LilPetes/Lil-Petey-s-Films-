import { getElement, updateElement, fetchData, handleError, createImageElement, createVideoElement } from './utils.js';

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
          const img = createImageElement(mediaItem.thumbnail, mediaItem.title || `Thumbnail for ${mediaType}`);
          contentContainer.appendChild(img);
        }

        if (mediaItem.video) {
          const video = createVideoElement(mediaItem.video);
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