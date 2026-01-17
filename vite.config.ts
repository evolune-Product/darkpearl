import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 5173,
		strictPort: false,
		warmup: {
			// Pre-transform these on server start
			clientFiles: [
				'./src/routes/darkpearl/studio/+page.svelte',
				'./src/lib/components/**/*.svelte'
			]
		}
	},
	optimizeDeps: {
		exclude: ['@rollup/browser'],
		// Pre-bundle heavy deps upfront instead of on-demand
		include: [
			'pocketbase',
			'lucide-svelte',
			'bits-ui',
			'clsx',
			'tailwind-merge',
			'tailwind-variants',
			'marked',
			'lodash-es',
			'codemirror',
			'@codemirror/view',
			'@codemirror/state',
			'@codemirror/commands',
			'@codemirror/autocomplete',
			'@codemirror/lang-javascript',
			'@codemirror/lang-css',
			'@codemirror/lang-json',
			'@codemirror/language',
			'runed',
			'paneforge',
			'culori'
		],
		esbuildOptions: {
			target: 'esnext'
		}
	},
	worker: {
		format: 'es'
	},
	assetsInclude: ['**/*.wasm']
});
