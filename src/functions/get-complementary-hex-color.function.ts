export const getComplementaryHexColor = (hex: string) => {
  // Remove the leading #
  hex = hex.replace(/^#/, "");

  // Parse the hex color
  let r = parseInt(hex.slice(0, 2), 16);
  let g = parseInt(hex.slice(2, 4), 16);
  let b = parseInt(hex.slice(4, 6), 16);

  // Invert each component
  r = 255 - r;
  g = 255 - g;
  b = 255 - b;

  // Convert each component back to hex
  const invertedColor = `#${((1 << 24) | (r << 16) | (g << 8) | b)
    .toString(16)
    .slice(1)
    .toUpperCase()}`;

  return invertedColor;
};
