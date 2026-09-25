import { APP_NAME } from "@/lib/config";

export function Leaf({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M16 28V17" stroke="#0e6b52" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M16 18C8 18 5 12 5 6c7 0 11 4 11 12Z" fill="#3fae49" />
      <path d="M16 16c0-7 4-11 11-11 0 6-3 11-11 11Z" fill="#0e6b52" />
    </svg>
  );
}

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const text = size === "lg" ? "text-4xl" : "text-2xl";
  return (
    <div className="inline-flex items-end gap-1" aria-label={APP_NAME}>
      <span className={`${text} font-black tracking-tight text-ink`}>{APP_NAME}</span>
      <Leaf className={size === "lg" ? "mb-2 h-8 w-8" : "mb-1 h-6 w-6"} />
    </div>
  );
}
