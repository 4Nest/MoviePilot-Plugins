import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'EmbyUserManager',
      filename: 'remoteEntry.js',
      exposes: {
        './Page': './src/components/Page.vue',
        './Config': './src/components/Config.vue',
        './AppPage': './src/components/AppPage.vue',
      },
      shared: {
        vue: {
          requiredVersion: false,
          generate: false,
        },
      } as Record<string, any>,
      format: 'esm',
    }),
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'esnext',
    minify: false,
    cssCodeSplit: true,
  },
})
