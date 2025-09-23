import { defineConfig, Plugin, ViteDevServer } from 'vite';
import vue from '@vitejs/plugin-vue';
import checker from 'vite-plugin-checker';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import * as path from 'path';
import fs from 'fs';

export const disasmVite = (): Plugin => {
  return {
    name: 'disasm-wasm-vite',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        if (req?.url?.endsWith('tycho_disasm_bg.wasm')) {
          const wasmPath = path.resolve(
            import.meta.dirname,
            './node_modules/@tychosdk/disasm/dist/wasm/tycho_disasm_bg.wasm'
          );

          const wasmFile = fs.readFileSync(wasmPath);
          res.setHeader('Content-Type', 'application/wasm');
          res.end(wasmFile);
          return;
        }

        next();
      });
    }
  };
};

export default defineConfig({
  plugins: [
    vue(),
    checker({
      typescript: true
    }),
    nodePolyfills(),
    disasmVite()
  ],
  publicDir: path.resolve(import.meta.dirname, 'public'),
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true
      }
    }
  },
  resolve: {
    alias: {
      '@core': path.resolve(import.meta.dirname, 'core/pkg'),
      '@debugger': path.resolve(import.meta.dirname, 'debugger/pkg')
    }
  },
  envPrefix: 'BYTIE_',
  build: {
    target: 'es2020'
  },
  optimizeDeps: {
    rolldownOptions: {
      transform: {
        target: 'es2020'
      }
    }
  }
});
