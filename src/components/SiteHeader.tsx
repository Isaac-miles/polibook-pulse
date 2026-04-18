import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="h-1 bg-[image:var(--gradient-flag)]" />
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 overflow-hidden rounded-lg shadow-[var(--shadow-elevated)]">
            <div className="absolute inset-0 bg-[image:var(--gradient-flag)]" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-bold tracking-tight">Trail 🇳🇬</div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Accountability archive
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-secondary text-foreground" }}
            className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Search
          </Link>
          <Link
            to="/upload"
            activeProps={{ className: "bg-secondary text-foreground" }}
            className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Upload
          </Link>
          <Link
            to="/about"
            activeProps={{ className: "bg-secondary text-foreground" }}
            className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
