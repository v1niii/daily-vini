"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Crosshair, Activity, Map } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { type ComponentType } from "react";

const links: { href: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { href: "/", label: "home", icon: Trophy },
  { href: "/agents", label: "agents", icon: Crosshair },
  { href: "/strats", label: "strats", icon: Map },
  { href: "/status", label: "status", icon: Activity },
];

export default function Navbar() {
  const path = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
        <Link
          href="/"
          className="text-base font-semibold tracking-wide text-foreground no-underline"
        >
          daily<span className="text-accent">vini</span>
        </Link>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {links.map((l) => {
            const isActive = path === l.href;
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm no-underline transition-colors duration-200 sm:px-3 ${
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5 sm:hidden" />
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            );
          })}
          <div className="ml-1 sm:ml-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
