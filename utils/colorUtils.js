// Utility functions for color manipulation and contrast detection

/**
 * Convert hex color to RGB values
 * @param {string} hex - Hex color string (e.g., "#FF0000" or "FF0000")
 * @returns {object} RGB object with r, g, b properties
 */
export function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace('#', '');

  // Handle 3-digit hex codes
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return { r, g, b };
}

/**
 * Calculate the luminance of a color
 * @param {object} rgb - RGB object with r, g, b properties
 * @returns {number} Luminance value between 0 and 1
 */
export function getLuminance(rgb) {
  const { r, g, b } = rgb;

  // Convert RGB to linear values
  const toLinear = (channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };

  const rLinear = toLinear(r);
  const gLinear = toLinear(g);
  const bLinear = toLinear(b);

  // Calculate luminance using the formula
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 * @param {number} luminance1 - Luminance of first color
 * @param {number} luminance2 - Luminance of second color
 * @returns {number} Contrast ratio
 */
export function getContrastRatio(luminance1, luminance2) {
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Determine if white or black text should be used on a given background color
 * @param {string} backgroundColor - Hex color string
 * @returns {string} Either '#FFFFFF' for white text or '#000000' for black text
 */
export function getOptimalTextColor(backgroundColor) {
  if (!backgroundColor) {
    return '#000000'; // Default to black if no background color
  }

  try {
    const rgb = hexToRgb(backgroundColor);
    const backgroundLuminance = getLuminance(rgb);

    // White and black luminance values
    const whiteLuminance = 1;
    const blackLuminance = 0;

    // Calculate contrast ratios
    const whiteContrast = getContrastRatio(backgroundLuminance, whiteLuminance);
    const blackContrast = getContrastRatio(backgroundLuminance, blackLuminance);

    // Return the color with better contrast
    return whiteContrast > blackContrast ? '#FFFFFF' : '#000000';
  } catch (error) {
    console.warn('Error calculating optimal text color:', error);
    return '#000000'; // Default to black on error
  }
}

/**
 * Get a slightly transparent version of the optimal text color for secondary text
 * @param {string} backgroundColor - Hex color string
 * @param {number} opacity - Opacity value between 0 and 1 (default: 0.7)
 * @returns {string} RGBA color string
 */
export function getOptimalSecondaryTextColor(backgroundColor, opacity = 0.7) {
  const optimalColor = getOptimalTextColor(backgroundColor);

  if (optimalColor === '#FFFFFF') {
    return `rgba(255, 255, 255, ${opacity})`;
  } else {
    return `rgba(0, 0, 0, ${opacity})`;
  }
}