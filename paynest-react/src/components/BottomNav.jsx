const ITEMS = [
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'send', icon: '💸', label: 'Send' },
  { id: 'hist', icon: '📊', label: 'Activity' },
];

export default function BottomNav({ view, onChange }) {
  return (
    <nav>
      <div>
        {ITEMS.map((i) => (
          <button key={i.id} className={view === i.id ? 'on' : ''} onClick={() => onChange(i.id)}>
            <span>{i.icon}</span>
            {i.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
