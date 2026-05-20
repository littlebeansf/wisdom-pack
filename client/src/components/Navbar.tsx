import { Link, useLocation } from "wouter";
import { useTheme } from "./ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const RARITY_COLORS = {
  Common: "#9ca3af",
  Uncommon: "#4ade80",
  Rare: "#60a5fa",
  Epic: "#a78bfa",
  Legendary: "#fbbf24",
};

export function Navbar() {
  const { theme, toggle } = useTheme();
  const [location] = useLocation();
  const { data: status } = useQuery({
    queryKey: ["/api/daily-status"],
    queryFn: () => apiRequest("GET", "/api/daily-status").then(r => r.json()),
    refetchInterval: 30000,
  });

  const navLinks = [
    { href: "/", label: "Pack Shop" },
    { href: "/collection", label: "My Collection" },
    { href: "/stats", label: "Stats" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer" data-testid="logo">
            <svg viewBox="0 0 40 40" width="32" height="32" aria-label="Wisdom Pack Logo" fill="none">
              <rect x="4" y="4" width="32" height="32" rx="6" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M20 8 L28 14 L28 26 L20 32 L12 26 L12 14 Z" fill="none" stroke={RARITY_COLORS.Legendary} strokeWidth="1.5"/>
              <path d="M20 12 L25 16 L25 24 L20 28 L15 24 L15 16 Z" fill="none" stroke={RARITY_COLORS.Epic} strokeWidth="1" opacity="0.7"/>
              <circle cx="20" cy="20" r="3" fill={RARITY_COLORS.Legendary}/>
              <path d="M20 15 L20 17 M20 23 L20 25 M15 20 L17 20 M23 20 L25 20" stroke={RARITY_COLORS.Legendary} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="font-bold text-lg tracking-tight">Wisdom Pack</span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}>
              <span
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  location === link.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {link.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {status && (
            <div className="hidden sm:flex items-center gap-1.5 text-sm" data-testid="packs-remaining">
              <span className="text-muted-foreground">Packs:</span>
              <span className="font-bold" style={{ color: status.packsRemaining > 0 ? RARITY_COLORS.Legendary : "#ef4444" }}>
                {status.packsRemaining}/{status.maxPacks}
              </span>
            </div>
          )}
          <button
            onClick={toggle}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Toggle theme"
            data-testid="theme-toggle"
          >
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="sm:hidden flex border-t border-border">
        {navLinks.map(link => (
          <Link key={link.href} href={link.href} className="flex-1">
            <span
              className={`block w-full py-2 text-center text-xs font-medium cursor-pointer transition-colors ${
                location === link.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
