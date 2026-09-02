/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  // Относительные пути в сборке: прототип должен открываться и с file://, и из любой подпапки.
  base: './',
  server: {
    // host: true — Vite слушает все интерфейсы, иначе с телефона по локальной сети не зайти.
    host: true,
    port: 5173,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
