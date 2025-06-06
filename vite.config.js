import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import * as path from 'path';

// https://vite.dev/config/
export default defineConfig({
  base: '/EndUserDash/',
  plugins: [vue()],
  resolve: {
      alias: [
          { find: '@', replacement: path.resolve(__dirname, 'src') },
      ],
  },  
  server: {
    strictPort: true,
    port: 3000,
  },
  preview: {
    port: 3000
  }  
})
