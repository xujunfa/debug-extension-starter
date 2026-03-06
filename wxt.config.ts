import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Debug Extension Starter',
    description:
      'Browser extension starter for building debugging tools with WXT, React, and TypeScript.',
    devtools_page: 'devtools/index.html',
    permissions: ['storage', 'declarativeNetRequest', 'scripting'],
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
