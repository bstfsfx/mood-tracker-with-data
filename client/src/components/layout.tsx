import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  HeartPulse,
  CheckCircle2,
  Bot,
  Settings,
  Moon,
  Sun,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/mood", label: "Mood Log", icon: HeartPulse },
  { path: "/habits", label: "Habits", icon: CheckCircle2 },
  { path: "/ai-support", label: "AI Support", icon: Bot },
  { path: "/settings", label: "Settings", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <ShieldCheck className="h-5 w-5 text-primary-foreground" strokeWidth={2.2} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-foreground">MindTrack</span>
          <span className="text-[11px] text-muted-foreground">Wellness Dashboard</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <button
                onClick={onNavigate}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                {item.label}
              </button>
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? (
            <Sun className="h-[18px] w-[18px]" strokeWidth={1.8} />
          ) : (
            <Moon className="h-[18px] w-[18px]" strokeWidth={1.8} />
          )}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </Button>
      </div>
    </>
  );
}

function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-sidebar md:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <ShieldCheck className="h-4 w-4 text-primary-foreground" strokeWidth={2.2} />
        </div>
        <span className="text-sm font-bold tracking-tight text-foreground">MindTrack</span>
      </div>
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="h-8 w-8" data-testid="button-mobile-menu">
        <Menu className="h-5 w-5" />
      </Button>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex h-full w-[220px] flex-col border-r border-sidebar-border bg-sidebar">
      <SidebarContent />
    </aside>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Desktop layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto overscroll-contain scroll-area">
          {children}
        </main>
      </div>

      {/* Mobile layout */}
      <div className="flex flex-col flex-1 overflow-hidden md:hidden">
        <MobileHeader onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto overscroll-contain scroll-area">
          {children}
        </main>
      </div>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden" data-testid="mobile-nav-overlay">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[220px] bg-sidebar flex flex-col">
            <button
              onClick={() => setMobileNavOpen(false)}
              className="absolute right-2 top-3 z-10 p-1 text-muted-foreground hover:text-foreground"
              data-testid="button-close-mobile-nav"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
