import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: "import { h, Fragment } from 'vue'",
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    emptyOutDir: false,
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'ElementCrud',
      fileName: (format) => `element-crud.${format}.js`,
    },
    rollupOptions: {
      external: ['vue', 'element-plus', '@element-plus/icons-vue'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus',
          '@element-plus/icons-vue': 'ElementPlusIconsVue',
        },
      },
    },
  },
});
