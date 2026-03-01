export interface TimelineEvent {
  timestamp: number;
  type: 'attribute' | 'style' | 'resize' | 'position' | 'removed';
  selector: string;
  elementDesc: string;
  detail: {
    property: string;
    before: string;
    after: string;
  };
}

export function injectMonitor(selector: string, elementIndex: number): Promise<string> {
  const script = `(function() {
  // Clean up existing observers
  if (window.__debugCleanup) window.__debugCleanup();
  window.__debugTimeline = [];
  window.__debugRemoved = false;

  const els = document.querySelectorAll(${JSON.stringify(selector)});
  const el = els[${elementIndex}];
  if (!el) return JSON.stringify({ ok: false, desc: '' });
  const sel = ${JSON.stringify(selector)};

  // Build element descriptor
  var desc = el.tagName.toLowerCase();
  if (el.id) desc += '#' + el.id;
  Array.from(el.classList).slice(0, 3).forEach(function(c) { desc += '.' + c; });
  const elDesc = desc;

  // Snapshot current state
  let prevRect = JSON.stringify(el.getBoundingClientRect());
  const cs = getComputedStyle(el);
  let prevStyles = {};
  ['display','position','width','height','margin','padding','color','background-color','font-size','opacity','transform','z-index','border'].forEach(p => {
    prevStyles[p] = cs.getPropertyValue(p);
  });

  function push(type, prop, before, after) {
    window.__debugTimeline.push({ timestamp: Date.now(), type, selector: sel, elementDesc: elDesc, detail: { property: prop, before: String(before), after: String(after) } });
  }

  // MutationObserver for attributes on the target element
  const mo = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type === 'attributes') {
        push('attribute', m.attributeName, m.oldValue || '', el.getAttribute(m.attributeName) || '');
      }
    }
  });
  mo.observe(el, { attributes: true, attributeOldValue: true });

  // MutationObserver on parent to detect removal
  const parentMo = new MutationObserver(muts => {
    if (!document.contains(el) && !window.__debugRemoved) {
      window.__debugRemoved = true;
      push('removed', 'element', elDesc, '(removed from DOM)');
    }
  });
  if (el.parentNode) {
    parentMo.observe(el.parentNode, { childList: true });
  }

  // ResizeObserver
  const ro = new ResizeObserver(() => {
    const r = JSON.stringify(el.getBoundingClientRect());
    if (r !== prevRect) {
      push('resize', 'boundingRect', prevRect, r);
      prevRect = r;
    }
  });
  ro.observe(el);

  // Polling for style / position changes + removal check
  const interval = setInterval(() => {
    if (!document.contains(el)) {
      if (!window.__debugRemoved) {
        window.__debugRemoved = true;
        push('removed', 'element', elDesc, '(removed from DOM)');
      }
      return;
    }
    const cs2 = getComputedStyle(el);
    for (const p of Object.keys(prevStyles)) {
      const cur = cs2.getPropertyValue(p);
      if (cur !== prevStyles[p]) {
        push('style', p, prevStyles[p], cur);
        prevStyles[p] = cur;
      }
    }
    const r = JSON.stringify(el.getBoundingClientRect());
    if (r !== prevRect) {
      push('position', 'boundingRect', prevRect, r);
      prevRect = r;
    }
  }, 300);

  window.__debugCleanup = () => {
    mo.disconnect();
    parentMo.disconnect();
    ro.disconnect();
    clearInterval(interval);
    delete window.__debugTimeline;
    delete window.__debugCleanup;
    delete window.__debugRemoved;
  };
  return JSON.stringify({ ok: true, desc: elDesc });
})()`;

  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(script, (result) => {
      try {
        const data = JSON.parse(result as unknown as string) as { ok: boolean; desc: string };
        resolve(data.desc);
      } catch {
        resolve('');
      }
    });
  });
}

export function readTimeline(): Promise<TimelineEvent[]> {
  const script = `(function() {
  const events = window.__debugTimeline || [];
  window.__debugTimeline = [];
  return JSON.stringify(events);
})()`;

  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(script, (result) => {
      try {
        resolve(JSON.parse(result as unknown as string) as TimelineEvent[]);
      } catch {
        resolve([]);
      }
    });
  });
}

export function cleanupMonitor(): Promise<void> {
  const script = `(function() { if (window.__debugCleanup) window.__debugCleanup(); })()`;
  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(script, () => resolve());
  });
}

export interface ElementInfo {
  tagName: string;
  id: string;
  classNames: string[];
  attributes: Record<string, string>;
  computedStyles: Record<string, string>;
  rect: { top: number; left: number; width: number; height: number };
  childCount: number;
  textContent: string;
}

export interface QueryResult {
  selector: string;
  count: number;
  elements: ElementInfo[];
  error?: string;
}

const STYLE_PROPS = [
  'display', 'position', 'width', 'height', 'margin', 'padding',
  'color', 'background-color', 'font-size', 'font-family', 'font-weight',
  'border', 'box-sizing', 'overflow', 'z-index', 'opacity',
];

export function queryElements(selector: string): Promise<QueryResult> {
  const script = `(function() {
  try {
    const els = document.querySelectorAll(${JSON.stringify(selector)});
    const styleProps = ${JSON.stringify(STYLE_PROPS)};
    const results = Array.from(els).slice(0, 50).map(el => {
      const rect = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const styles = {};
      styleProps.forEach(p => { styles[p] = cs.getPropertyValue(p); });
      const attrs = {};
      for (const attr of el.attributes) { attrs[attr.name] = attr.value; }
      return {
        tagName: el.tagName.toLowerCase(),
        id: el.id,
        classNames: Array.from(el.classList),
        attributes: attrs,
        computedStyles: styles,
        rect: { top: Math.round(rect.top), left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height) },
        childCount: el.children.length,
        textContent: el.textContent.slice(0, 200).trim(),
      };
    });
    return JSON.stringify({ count: els.length, elements: results });
  } catch(e) {
    return JSON.stringify({ error: e.message, count: 0, elements: [] });
  }
})()`;

  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(script, (result, exceptionInfo) => {
      if (exceptionInfo) {
        resolve({
          selector,
          count: 0,
          elements: [],
          error: exceptionInfo.description || String(exceptionInfo.value) || 'Query error',
        });
      } else {
        try {
          const data = JSON.parse(result as unknown as string) as { count: number; elements: ElementInfo[]; error?: string };
          resolve({ selector, ...data });
        } catch {
          resolve({ selector, count: 0, elements: [], error: 'Failed to parse results' });
        }
      }
    });
  });
}

export function highlightElements(selector: string): Promise<void> {
  const script = `(function() {
  document.querySelectorAll('[data-debug-highlight]').forEach(el => {
    el.style.outline = el.dataset.debugHighlightOriginal || '';
    el.removeAttribute('data-debug-highlight');
    delete el.dataset.debugHighlightOriginal;
  });
  if (!${JSON.stringify(selector)}) return;
  document.querySelectorAll(${JSON.stringify(selector)}).forEach(el => {
    el.dataset.debugHighlightOriginal = el.style.outline;
    el.style.outline = '2px solid #3b82f6';
    el.setAttribute('data-debug-highlight', 'true');
  });
})()`;

  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(script, () => resolve());
  });
}

export function clearHighlight(): Promise<void> {
  return highlightElements('');
}
