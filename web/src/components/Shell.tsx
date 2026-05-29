import type { ReactNode } from "react";

interface NavItem {
  label: string;
  icon: string;
  onClick: () => void;
  active?: boolean;
}

interface ShellProps {
  children: ReactNode;
  navItems?: NavItem[];
}

export function Shell({ children, navItems = [] }: ShellProps) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex h-screen overflow-hidden">
        <aside
          className="flex flex-col border-r h-full shrink-0"
          style={{ width: "17rem", borderColor: "var(--line)", background: "var(--panel)" }}
        >
          <div className="p-6 font-bold text-xl" style={{ fontFamily: "Fraunces, serif" }}>
            ⚽ Soccer Live
          </div>
          <nav className="flex-1 px-3 flex flex-col gap-1 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all w-full"
                style={{
                  background: item.active ? "var(--accent)" : "transparent",
                  color: item.active ? "#fff" : "var(--ink)",
                }}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 text-xs" style={{ color: "var(--muted)" }}>
            <a
              href="https://freeappstore.online"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: "var(--muted)" }}
            >
              Part of FreeAppStore — free forever
            </a>
          </div>
        </aside>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Mobile */}
      <div className="flex flex-col h-screen overflow-hidden md:hidden">
        <header
          className="flex items-center px-4 h-14 border-b shrink-0"
          style={{ borderColor: "var(--line)", background: "var(--panel)" }}
        >
          <span className="font-bold text-lg" style={{ fontFamily: "Fraunces, serif" }}>
            ⚽ Soccer Live
          </span>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
        {navItems.length > 0 && (
          <nav
            className="flex items-center justify-around h-16 border-t shrink-0"
            style={{ borderColor: "var(--line)", background: "var(--dock)" }}
          >
            {navItems.slice(0, 5).map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="flex flex-col items-center gap-0.5 px-2 py-1"
                style={{ color: item.active ? "var(--accent)" : "var(--muted)" }}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-medium leading-tight">{item.label.split(" ").slice(1).join(" ")}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}
