import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative asset URLs keep the static build deployable at a GitHub Pages subpath.
export default defineConfig({ plugins: [react()], base: './' });
