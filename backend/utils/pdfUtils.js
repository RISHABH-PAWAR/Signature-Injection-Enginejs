/**
 * Convert percentage coordinates (frontend) to PDF points (backend)
 * 
 * CRITICAL COORDINATE CONVERSION:
 * - Frontend uses top-left origin with percentages (0-100)
 * - PDF uses bottom-left origin with points (72 DPI)
 * - Must flip Y-axis and scale appropriately
 * 
 * @param {Object} field - Field object from frontend
 * @param {number} pdfWidth - PDF page width in points
 * @param {number} pdfHeight - PDF page height in points
 * @returns {Object} - Converted coordinates in PDF points
 */
export function convertCoordinates(field, pdfWidth, pdfHeight) {
  // Convert percentage to PDF points
  const xInPoints = (field.x / 100) * pdfWidth;
  const widthInPoints = (field.width / 100) * pdfWidth;
  const heightInPoints = (field.height / 100) * pdfHeight;
  
  // FLIP Y-AXIS: PDF origin is bottom-left, not top-left
  // Formula: pdfY = pdfHeight - (percentageY * pdfHeight) - heightInPoints
  const yInPoints = pdfHeight - ((field.y / 100) * pdfHeight) - heightInPoints;
  
  return {
    x: xInPoints,
    y: yInPoints,
    width: widthInPoints,
    height: heightInPoints
  };
}

/**
 * Calculate dimensions to maintain aspect ratio within a box
 * 
 * ASPECT RATIO PRESERVATION:
 * - If image is wider than box: fit to width
 * - If image is taller than box: fit to height
 * - Center the image within the box
 * 
 * @param {number} imageWidth - Original image width
 * @param {number} imageHeight - Original image height
 * @param {number} boxWidth - Target box width
 * @param {number} boxHeight - Target box height
 * @returns {Object} - Final dimensions and offsets
 */
export function calculateAspectRatioDimensions(imageWidth, imageHeight, boxWidth, boxHeight) {
  const imageAspect = imageWidth / imageHeight;
  const boxAspect = boxWidth / boxHeight;
  
  let finalWidth, finalHeight;
  
  if (imageAspect > boxAspect) {
    // Image is wider relative to box - fit to width
    finalWidth = boxWidth;
    finalHeight = boxWidth / imageAspect;
  } else {
    // Image is taller relative to box - fit to height
    finalHeight = boxHeight;
    finalWidth = boxHeight * imageAspect;
  }
  
  // Calculate centering offsets
  const offsetX = (boxWidth - finalWidth) / 2;
  const offsetY = (boxHeight - finalHeight) / 2;
  
  return {
    width: finalWidth,
    height: finalHeight,
    offsetX,
    offsetY
  };
}

/**
 * Extract base64 data from data URL
 * 
 * @param {string} dataURL - Data URL (e.g., "data:image/png;base64,...")
 * @returns {string} - Pure base64 string
 */
export function base64FromDataURL(dataURL) {
  if (!dataURL || typeof dataURL !== 'string') {
    throw new Error('Invalid data URL');
  }
  
  const parts = dataURL.split(',');
  if (parts.length !== 2) {
    throw new Error('Invalid data URL format');
  }
  
  return parts[1];
}

/**
 * Validate field coordinates
 * 
 * @param {Object} field - Field object to validate
 * @returns {boolean} - True if valid
 */
export function validateFieldCoordinates(field) {
  return (
    field.x >= 0 && field.x <= 100 &&
    field.y >= 0 && field.y <= 100 &&
    field.width > 0 && field.width <= 100 &&
    field.height > 0 && field.height <= 100
  );
}