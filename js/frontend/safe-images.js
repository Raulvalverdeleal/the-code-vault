/**
 * Sets up safe images on the webpage by assigning a fallback image 
 * whenever an error occurs while loading the original image.
 *
 * @param {string} safeImagesClass - CSS class identifying the images to be processed.
 * @param {string} fallbackImagePath - Path to the image used as a fallback in case of an error.
 * @param {string} [altIfNotFound='resource not found'] - Alternative text assigned to the fallback image.
 */
function setupSafeImages(safeImagesClass, fallbackImagePath, altIfNotFound = 'resource not found') {

    const elements = document.getElementsByClassName(safeImagesClass)

    for (const element of elements) {

        if (element.tagName.toLowerCase() !== 'img' || !element.hasAttribute('src')) continue

        const setFallbackImage = () => {
            element.setAttribute('src', fallbackImagePath)
            element.setAttribute('alt', altIfNotFound)
        }

        element.addEventListener('error', setFallbackImage)

        const checkImage = new Image()
        checkImage.src = element.src
        checkImage.onerror = setFallbackImage

        element.setAttribute('draggable', 'false')
    }
}
