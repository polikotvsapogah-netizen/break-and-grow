import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Сборка в один файл: dist/index.html открывается двойным кликом без сервера.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  define: {
    // билд-маркер: страница сама проверяет свою свежесть (обход 10-мин кэша GH Pages)
    __BUILD__: JSON.stringify(`bag-build:${Date.now().toString(36)}`),
  },
})
