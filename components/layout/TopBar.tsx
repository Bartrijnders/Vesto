interface TopBarProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export default function TopBar({ title, subtitle, right }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-white/20">
      <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between gap-3">
        <div>
          <h1
            className="text-xl font-extrabold leading-none tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: '#191c1e' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-[10px] font-extrabold uppercase tracking-[0.2em] mt-0.5"
              style={{ color: '#006E2F' }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {right && <div className="flex-shrink-0">{right}</div>}
      </div>
    </header>
  );
}
