interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function Tabs({ tabs, activeId, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-line">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={[
            'py-3 px-4 text-base font-semibold transition-colors no-underline',
            tab.id === activeId
              ? 'border-b-4 border-brand text-brand -mb-px'
              : 'text-ink-muted hover:text-ink',
          ].join(' ')}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
