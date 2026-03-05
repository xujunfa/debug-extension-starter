import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Debug Tool Scaffold',
    description: 'Chrome Extension scaffold for building debug tools',
    devtools_page: 'devtools/index.html',
    permissions: ['storage', 'declarativeNetRequest'],
    host_permissions: ['<all_urls>'],
    action: {},
    commands: {
      'toggle-floating-window': {
        suggested_key: { default: 'Ctrl+Shift+D', mac: 'Command+Shift+D' },
        description: 'Toggle floating debug window',
      },
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  }),
});
