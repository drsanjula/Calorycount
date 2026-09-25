type P = { className?: string };
const base = (className = "h-6 w-6") => ({
  className,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const CakeIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="4" y="11" width="16" height="9" rx="2" />
    <path d="M4 15c2 1.5 4 1.5 5.3 0s4-1.5 5.4 0 4 1.5 5.3 0M8 11V8M12 11V8M16 11V8M8 5.5v.5M12 5.5v.5M16 5.5v.5" />
  </svg>
);
export const PersonIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c.5-4 3.3-6 7-6s6.5 2 7 6Z" />
  </svg>
);
export const RulerIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="8" y="3" width="8" height="18" rx="1.5" />
    <path d="M8 7h3M8 11h4M8 15h3M8 19h2" />
  </svg>
);
export const ChatIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M5 5h14v10H10l-4 4v-4H5Z" />
    <path d="M9 10h.01M12 10h.01M15 10h.01" strokeWidth={2.4} />
  </svg>
);
