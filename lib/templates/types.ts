import type { ComponentType, LazyExoticComponent } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
}

export interface TemplateDefinition extends TemplateMetadata {
  component: LazyExoticComponent<ComponentType>;
}
