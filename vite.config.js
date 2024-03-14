import { resolve } from 'path';
import { defineConfig } from 'vite';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
	base: '/PsiEdit/',
	root: 'src',
	build: {
		outDir: '../dist',
		emptyOutDir: true,
		rollupOptions: {
			input: Object.assign({
				main: resolve(__dirname, 'src/index.html')
			}, ['psi', 'phi'].map(name => resolve(__dirname, `src/pieces/${name}.html`)))
		}
	},
	plugins: [ topLevelAwait() ]
});
