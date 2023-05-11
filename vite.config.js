import { defineConfig } from 'vite';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
	base: '/PsiEdit/',
	root: 'src',
	build: {
		outDir: '..',
		emptyOutDir: false
	},
	plugins: [ topLevelAwait() ]
});
