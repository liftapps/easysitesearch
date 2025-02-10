import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/lib.tsx'), // Path to your library's entry point
      name: 'EasySiteSearch', // The name your library will be exposed as globally
      formats: ['umd'], // Specify the output format as UMD
      fileName: (format) => `easy-site-search.${format}.js`, // Customize the output file name
    },
  },
});
