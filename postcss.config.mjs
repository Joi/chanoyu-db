// Use legacy PostCSS config when Oxide is disabled
const config = process.env.TAILWIND_DISABLE_OXIDE === '1' 
  ? {
      plugins: {
        'tailwindcss': { config: './tailwind.config.ts' },
        'autoprefixer': {},
      },
    }
  : {
      plugins: {
        '@tailwindcss/postcss': {},
      },
    };

export default config;
