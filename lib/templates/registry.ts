import { lazy } from 'react';
import { Globe, Database, Terminal, Search } from 'lucide-react';
import type { TemplateDefinition } from './types';

export const templates: TemplateDefinition[] = [
  {
    id: 'network-panel',
    name: 'Network',
    description: 'Capture and inspect network requests with filtering',
    icon: Globe,
    component: lazy(() => import('@/templates/network-panel')),
  },
  {
    id: 'data-viewer',
    name: 'Data Viewer',
    description: 'Inspect global variables and evaluate expressions',
    icon: Database,
    component: lazy(() => import('@/templates/data-viewer')),
  },
  {
    id: 'command-palette',
    name: 'Commands',
    description: 'Execute predefined commands and view results',
    icon: Terminal,
    component: lazy(() => import('@/templates/command-palette')),
  },
  {
    id: 'dom-inspector',
    name: 'DOM Inspector',
    description: 'Query elements by CSS selector and inspect properties',
    icon: Search,
    component: lazy(() => import('@/templates/dom-inspector')),
  },
];

export function getTemplate(id: string): TemplateDefinition | undefined {
  return templates.find((t) => t.id === id);
}
