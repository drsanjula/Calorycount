"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CameraIcon, ChartIcon, GearIcon, HomeIcon } from "./icons";

const TABS = [
  { href: "/", label: "Today", Icon: HomeIcon },
  { href: "/history", label: "History", Icon: ChartIcon },
  { href: "/log", label: "Log", Icon: CameraIcon, primary: true },
  { href: "/settings", label: "Settings", Icon: GearIcon },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto flex max-w-md items-end justify-around px-2 pt-1.5 pb-1">
        {TABS.map(({ href, label, Icon, primary }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-1 text-xs font-medium ${active ? "text-brand" : "text-muted"}`}
              >
                {primary ? (
                  <span className={`-mt-5 flex h-12 w-12 items-center justify-center rounded-full shadow-lg ${active ? "bg-brand-600" : "bg-brand"} text-white`}>
                    <Icon className="h-6 w-6" />
                  </span>
                ) : (
                  <Icon className="h-6 w-6" />
                )}
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
