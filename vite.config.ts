import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MonacoErrorLens',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['monaco-editor'],
      output: {
        banner: '/* monaco-error-lens - MIT License - https://github.com/ym-han/monaco-error-lens */',
        globals: {
          'monaco-editor': 'monaco',
        },
      },
    },
    sourcemap: true,
    target: 'es2020',
    minify: false,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts',
      'src/**/__tests__/**/*.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/__tests__/**',
        'src/**/index.ts',
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
