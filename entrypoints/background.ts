export default defineBackground(() => {
  console.log('Debug Tool background service worker started', {
    id: browser.runtime.id,
  });
});
