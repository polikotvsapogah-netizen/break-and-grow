import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Сборка в один файл: dist/index.html открывается двойным кликом без сервера.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
})
