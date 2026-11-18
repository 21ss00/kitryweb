import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves a project site from /<repo>/; the deploy workflow sets BASE_PATH to that.
export default defineConfig({ base: process.env.BASE_PATH || '/', plugins: [react()] });
