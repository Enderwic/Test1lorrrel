interface IconProps {
  size?: number;
  className?: string;
}

const base = (size = 18) => ({
  width: size,
  height: size,
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
      <path d="M7 4.5v15l12-7.5-12-7.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconPause({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="6" y="4" width="4" height="16" rx="1.4" fill="currentColor" stroke="none" />
      <rect x="14" y="4" width="4" height="16" rx="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconRestart({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

export function IconHome({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h5v-6h4v6h5V10" />
    </svg>
  );
}

export function IconSoundOn({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12" />
    </svg>
  );
}

export function IconSoundOff({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m16 9 5 5M21 9l-5 5" />
    </svg>
  );
}

export function IconTrophy({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4a1 1 0 0 0-1 1c0 2.5 1.8 4 4 4M17 6h3a1 1 0 0 1 1 1c0 2.5-1.8 4-4 4" />
    </svg>
  );
}

export function IconApple({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 7c-3 0-6 2-6 6 0 4 2.5 8 6 8s6-4 6-8c0-4-3-6-6-6Z" />
      <path d="M12 7c0-2 1-3.5 3-4" />
    </svg>
  );
}

export function IconChevronUp({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m6 14 6-6 6 6" />
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

export function IconShare({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="17.5" cy="5.5" r="2.6" />
      <circle cx="17.5" cy="18.5" r="2.6" />
      <path d="m8.4 10.8 6.8-4M8.4 13.2l6.8 4" />
    </svg>
  );
}

export function IconUsers({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.8 20c.6-3.4 3-5.4 6.2-5.4s5.6 2 6.2 5.4" />
      <path d="M15.5 5.1a3.4 3.4 0 0 1 0 5.8M18 14.9c1.8.8 3 2.4 3.4 4.6" />
    </svg>
  );
}

export function IconHeart({ size, className, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(size)} className={className} fill={filled ? "currentColor" : "none"}>
      <path d="M12 20.3 4.7 13a4.9 4.9 0 0 1 0-7 4.9 4.9 0 0 1 7 0l.3.4.3-.4a4.9 4.9 0 0 1 7 0 4.9 4.9 0 0 1 0 7L12 20.3Z" />
    </svg>
  );
}

export function IconClock({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function IconSliders({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
      <path d="M1.5 14h5M9.5 8h5M17.5 16h5" />
    </svg>
  );
}

export function IconZap({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}

export function IconFlag({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5 21V4" />
      <path d="M5 4c4-2.5 8 2.5 14 0v9c-6 2.5-10-2.5-14 0" />
    </svg>
  );
}

export function IconTelegram({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m21.5 4.5-3.2 15.2c-.2 1-.8 1.2-1.6.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-.9.5l.3-4.6L17.8 7c.4-.3-.1-.5-.6-.2L6.7 13.6l-4.5-1.4c-1-.3-1-1 .2-1.4l17.6-6.8c.8-.3 1.5.2 1.5 1.5Z" />
    </svg>
  );
}

export function IconCloud({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M17.5 19a4.5 4.5 0 0 0 .4-9A6 6 0 0 0 6.2 8.6 4.8 4.8 0 0 0 7 18.9h10.5Z" />
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
