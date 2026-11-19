import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'MediaVaultBridge',
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
          singleton: true,
        },
      } as Record<string, any>,
      format: 'esm',
    }),
  ],
  build: {
    outDir: '../../plugins.v2/mediavaultbridge/dist',
    emptyOutDir: true,
    target: 'esnext',
    minify: false,
    cssCodeSplit: true,
  },
})
