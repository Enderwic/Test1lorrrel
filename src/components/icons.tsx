interface IconProps {
  size?: number;
  className?: string;
}

const base = (size?: number) => ({
  width: size ?? 18,
  height: size ?? 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function IconPlay({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M7 4.5v15l13-7.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconPause({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconRestart({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M21 12a9 9 0 1 1-2.6-6.4" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

export function IconHome({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1Z" />
    </svg>
  );
}

export function IconSoundOn({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" stroke="none" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 6a9 9 0 0 1 0 12" />
    </svg>
  );
}

export function IconSoundOff({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" stroke="none" />
      <path d="m16 9 5 6" />
      <path d="m21 9-5 6" />
    </svg>
  );
}

export function IconTrophy({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v6a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4a3 3 0 0 0 3 5" />
      <path d="M17 6h3a3 3 0 0 1-3 5" />
    </svg>
  );
}

export function IconApple({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 7c-3.5-2-7 .5-7 4.5S8 21 12 21s7-5.5 7-9.5S15.5 5 12 7Z" />
      <path d="M12 7c0-2 1-3.5 3-4" />
    </svg>
  );
}

export function IconChevronUp({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} strokeWidth={2.6}>
      <path d="m5 15 7-7 7 7" />
    </svg>
  );
}

export function IconGamepad({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 12h4M8 10v4" />
      <path d="M15.5 13.5h.01M18 11h.01" />
      <path d="M17.5 6h-11A4.5 4.5 0 0 0 2 10.5v3A4.5 4.5 0 0 0 6.5 18c1.4 0 2.2-.7 3-1.7l.8-1h3.4l.8 1c.8 1 1.6 1.7 3 1.7a4.5 4.5 0 0 0 4.5-4.5v-3A4.5 4.5 0 0 0 17.5 6Z" />
    </svg>
  );
}

export function LogoSnake({ size = 40, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" className={className}>
      <path
        d="M7 35h16a9 9 0 0 0 0-18H15a5 5 0 0 1 0-10h16"
        stroke="#a8e830"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="33" cy="7" r="5.2" fill="#c6f65c" />
      <circle cx="34.6" cy="5.6" r="1.3" fill="#0d2412" />
      <path
        d="M38.4 7h3.2m0 0 1.8-1.8M41.6 7l1.8 1.8"
        stroke="#ff6a4d"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
