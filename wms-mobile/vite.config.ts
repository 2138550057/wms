import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 8081,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'https://wmsapi.fexxo.cn',
        changeOrigin: true
      }
    }
  }
})
