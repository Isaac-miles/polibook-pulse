import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-[image:var(--gradient-hero)] shadow-[var(--shadow-elevated)]" />
          <div className="leading-tight">
            <div className="font-display text-lg font-bold tracking-tight">Trail</div>
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
            className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            Search
          </Link>
          <Link
            to="/upload"
            activeProps={{ className: "bg-secondary text-foreground" }}
            className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            Upload
          </Link>
          <Link
            to="/about"
            activeProps={{ className: "bg-secondary text-foreground" }}
            className="rounded-md px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
