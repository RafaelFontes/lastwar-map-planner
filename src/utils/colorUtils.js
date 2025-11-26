/**
 * Calculate relative luminance of a hex color and return contrasting text color
 * @param {string} hexColor - Hex color string (e.g., '#f8f9fa')
 * @returns {string} Contrasting color for text
 */
export function getContrastingTextColor(hexColor) {
  // Default to dark text for light backgrounds
  if (!hexColor || hexColor === '#f8f9fa') {
    return '#1e40af';
  }

  // Parse hex color
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  // Convert to linear RGB
  const toLinear = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const rLin = toLinear(r);
  const gLin = toLinear(g);
  const bLin = toLinear(b);

  // Calculate relative luminance (WCAG formula)
  const luminance = 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;

  // Return white for dark backgrounds, dark blue for light backgrounds
  return luminance > 0.4 ? '#1e3a5f' : '#ffffff';
}
