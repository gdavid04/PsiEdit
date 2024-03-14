import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
	base: '/PsiEdit/',
	root: 'src',
	build: {
		outDir: '../dist',
		emptyOutDir: true,
		rollupOptions: {
			input: Object.assign({
				main: resolve(__dirname, 'src/index.html'),
				manifest: resolve(__dirname, 'src/app.webmanifest'),
				icon: resolve(__dirname, 'src/icon.png'),
			}, ['psi', 'phi'].map(name => resolve(__dirname, `src/pieces/${name}.html`)))
		}
	}
});
