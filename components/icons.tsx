type P = { className?: string };
const base = (className = "h-5 w-5") => ({
  className,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const FlameIcon = ({ className }: P) => (
  <svg {...base(className)} fill="currentColor" stroke="none">
    <path d="M12 2s5 4.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 1-3.5s.5 2 2 2.5C10 8 12 2 12 2Zm0 20a3 3 0 0 0 3-3c0-2-3-4.5-3-4.5S9 17 9 19a3 3 0 0 0 3 3Z" />
  </svg>
);
export const BarsIcon = ({ className }: P) => (
  <svg {...base(className)} fill="currentColor" stroke="none">
    <rect x="4" y="13" width="4" height="7" rx="1" />
    <rect x="10" y="9" width="4" height="11" rx="1" />
    <rect x="16" y="4" width="4" height="16" rx="1" />
  </svg>
);
export const TargetIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <path d="m12 12 7-7m-3 0h3v3" />
  </svg>
);
export const ScaleIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <path d="M9 9a3 3 0 0 1 6 0M12 9l1-1.5" />
  </svg>
);
export const CameraIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4 8h3l1.5-2.5h7L17 8h3v11H4Z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);
export const ImageIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="m4 18 5-5 4 4 3-3 4 4" />
  </svg>
);
export const HomeIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4Z" />
  </svg>
);
export const ChartIcon = BarsIcon;
export const PlusIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const GearIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3" />
  </svg>
);
export const ChevronRight = ({ className }: P) => (
  <svg {...base(className ?? "h-4 w-4")}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
export const ChevronLeft = ({ className }: P) => (
  <svg {...base(className ?? "h-5 w-5")}>
    <path d="m15 6-6 6 6 6" />
  </svg>
);
export const XIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const CheckIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
export const InfoIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.5v.5" />
  </svg>
);
export const AlertIcon = ({ className }: P) => (
  <svg {...base(className)} fill="currentColor" stroke="none">
    <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-1 5v7h2V7h-2Zm0 9v2h2v-2h-2Z" />
  </svg>
);
export const BulbIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
  </svg>
);
export const SparkIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
  </svg>
);
export const LogoutIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10" />
  </svg>
);
