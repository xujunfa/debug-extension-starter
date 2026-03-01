import * as React from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TabItem {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
}

interface TabLayoutProps {
  tabs: TabItem[];
  defaultTab?: string;
  className?: string;
  onTabChange?: (tabId: string) => void;
}

function TabLayout({ tabs, defaultTab, className, onTabChange }: TabLayoutProps) {
  const defaultValue = defaultTab ?? tabs[0]?.id ?? '';

  return (
    <Tabs
      defaultValue={defaultValue}
      onValueChange={onTabChange}
      className={cn('flex h-full flex-col', className)}
    >
      <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-2">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="rounded-none border-b-2 border-transparent px-3 py-1.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.id}
          value={tab.id}
          className="mt-0 flex-1 overflow-hidden"
        >
          <ScrollArea className="h-full">
            <div className="p-4">{tab.content}</div>
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  );
}

export { TabLayout, type TabLayoutProps, type TabItem };
