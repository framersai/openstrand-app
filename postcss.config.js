/**
 * PostCSS configuration enabling Tailwind CSS processing.
 * Without this file, Tailwind directives in globals.css won't be transformed.
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
