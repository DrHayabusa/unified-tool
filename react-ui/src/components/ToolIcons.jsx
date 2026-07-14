const accentMap = {
  emerald: "text-emerald-400",
  sky: "text-sky-400",
  violet: "text-violet-400",
  red: "text-red-500",
  slate: "text-slate-300",
};

export function SourceToolIcon({ id, accent = "emerald" }) {
  const color = accentMap[accent] ?? accentMap.emerald;
  const common = `h-16 w-16 ${color} drop-shadow-[0_0_18px_currentColor]`;

  if (id === "tenable-sc") {
    return (
      <svg className={common} viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 7 53 19v26L32 57 11 45V19L32 7Z" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M32 17 44 24v15l-12 8-12-8V24l12-7Z" fill="currentColor" opacity="0.12" />
        <path d="M22 32h20M32 20v24M24 25l16 14M40 25 24 39" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === "tenable-io") {
    return (
      <svg className={common} viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 6 55 19v26L32 58 9 45V19L32 6Z" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M21 26 32 20l11 6-11 7-11-7Z" fill="currentColor" opacity="0.22" />
        <path d="M21 26v13l11 7 11-7V26M32 33v13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      </svg>
    );
  }

  if (id === "mdvm") {
    return (
      <svg className={common} viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 7 53 17v16c0 13-8 21-21 27C19 54 11 46 11 33V17L32 7Z" fill="currentColor" opacity="0.12" />
        <path d="M32 7 53 17v16c0 13-8 21-21 27C19 54 11 46 11 33V17L32 7Z" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M20 43V23l12 14 12-14v20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (id === "crowdstrike") {
    return (
      <svg className={common} viewBox="0 0 64 64" aria-hidden="true">
        <path d="M6 18c16 7 30 8 52 3-11 5-20 8-30 8 8 3 17 4 28 2-12 7-26 8-41 2 8 8 20 14 34 18C27 50 13 39 6 18Z" fill="currentColor" />
        <path d="M15 16c9 7 20 10 34 11" fill="none" stroke="#020617" strokeWidth="2" opacity="0.35" />
      </svg>
    );
  }

  if (id === "qualys") {
    return (
      <svg className={common} viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 5C20 9 12 19 12 32c0 14 8 24 20 29 12-5 20-15 20-29C52 19 44 9 32 5Z" fill="currentColor" />
        <circle cx="32" cy="32" r="13" fill="#ffffff" opacity="0.95" />
        <path d="M36 36 45 45" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className={common} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M18 6h22l10 10v42H18V6Z" fill="currentColor" opacity="0.15" />
      <path d="M18 6h22l10 10v42H18V6Z" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M40 6v12h10M25 30h18M25 39h18M25 48h11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function MvaLogo({ className = "h-20 w-20" }) {
  return (
    <svg viewBox="0 0 88 88" className={className} role="img" aria-label="MVA shield">
      <path d="M44 5 76 17v25c0 20-12.8 33.4-32 41C24.8 75.4 12 62 12 42V17L44 5Z" fill="#0b0b0d" stroke="#ef4444" strokeWidth="2.5" />
      <path d="M44 12 69 21v20c0 15.4-9.4 26.3-25 33-15.6-6.7-25-17.6-25-33V21l25-9Z" fill="#181113" stroke="#7f1d1d" strokeWidth="1" />
      <path d="M19 21 44 12 69 21" fill="none" stroke="#fb7185" strokeWidth="2" />
      <path d="M25 29h6M57 29h6M25 59h6M57 59h6" stroke="#7f1d1d" strokeWidth="2" />
      <text x="44" y="51" textAnchor="middle" fill="#fff1f2" fontFamily="IBM Plex Mono, monospace" fontSize="17" fontWeight="700" letterSpacing="1">MVA</text>
      <path d="M30 57h28" stroke="#ef4444" strokeWidth="2.5" />
      <path d="m56 25 7-7" stroke="#ef4444" strokeWidth="3" />
    </svg>
  );
}
