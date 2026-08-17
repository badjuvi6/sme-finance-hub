import { Menu } from 'lucide-react';

export default function Navbar({ title, subtitle, onMenuClick, action }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-ink-50 bg-paper/90 px-4 py-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-ink-500 hover:bg-ink-50 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display text-xl font-semibold text-ink-800 sm:text-2xl">{title}</h1>
          {subtitle && <p className="text-sm text-ink-400">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </header>
  );
}
