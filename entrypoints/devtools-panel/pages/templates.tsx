import { useState, Suspense } from 'react';
import { cn } from '@/lib/utils';
import { templates } from '@/lib/templates/registry';

function TemplateLoading() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Loading template...
    </div>
  );
}

export default function TemplatesPage() {
  const [activeId, setActiveId] = useState(templates[0]?.id ?? '');

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-1 border-b bg-muted/30 px-2 py-1">
        <div className="flex flex-1 gap-1 overflow-x-auto">
          {templates.map((tmpl) => {
            const Icon = tmpl.icon;
            return (
              <button
                key={tmpl.id}
                onClick={() => setActiveId(tmpl.id)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  activeId === tmpl.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="size-3.5" />
                {tmpl.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {templates.map((tmpl) => (
          <div
            key={tmpl.id}
            className={cn(
              'absolute inset-0',
              activeId === tmpl.id ? 'visible z-10' : 'invisible z-0',
            )}
          >
            <Suspense fallback={<TemplateLoading />}>
              <tmpl.component />
            </Suspense>
          </div>
        ))}
      </div>
    </div>
  );
}
