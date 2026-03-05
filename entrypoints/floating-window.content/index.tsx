import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  runAt: 'document_idle',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'debug-floating-window',
      position: 'overlay',
      zIndex: 2147483647,
      isolateEvents: ['keydown', 'keyup', 'keypress'],
      onMount(container) {
        const wrapper = document.createElement('div');
        wrapper.className = 'dark text-foreground';
        container.append(wrapper);
        const root = createRoot(wrapper);
        root.render(<App />);
        return { root, wrapper };
      },
      onRemove({ root }) {
        root.unmount();
      },
    });

    ui.mount();

    // Listen for toggle message from background (via action click or keyboard shortcut)
    browser.runtime.onMessage.addListener((message: unknown) => {
      if ((message as { type?: string })?.type === 'TOGGLE_FLOATING_WINDOW') {
        document.dispatchEvent(new CustomEvent('debug-tool:toggle'));
      }
    });
  },
});
