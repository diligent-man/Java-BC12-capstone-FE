import {defineConfig} from 'vite';
import {resolve} from 'path';
import {readdirSync} from 'fs';

const root = resolve(__dirname);

// Auto-detect every .html file in the project root as a Rollup entry point
const htmlFiles = readdirSync(root).filter((f) => f.endsWith('.html'));
const input = Object.fromEntries(
    htmlFiles.map((f) => [f.replace(/\.html$/, ''), resolve(root, f)])
);

export default defineConfig({
    root: '.',
    build: {
        outDir: 'dist',
        rollupOptions: {input}
    },
    server: {
        open: false,
        host: '0.0.0.0',
        port: 3979
    }
});
