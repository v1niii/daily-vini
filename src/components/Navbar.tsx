"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const path = usePathname();

  const links = [
    { href: "/", label: "Home" },
    { href: "/agents", label: "Agent Picks" },
    { href: "/status", label: "Server Status" },
  ];

  return (
    <nav className="navbar">
      <Link href="/" className="nav-logo">
        <span className="logo-icon">&#9670;</span> Daily Vini
      </Link>
      <div className="nav-links">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`nav-link ${path === l.href ? "active" : ""}`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
