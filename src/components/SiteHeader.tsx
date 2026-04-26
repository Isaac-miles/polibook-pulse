import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { ChevronLeft } from "lucide-react";

export function SiteHeader({ backBtn }: { backBtn?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {!backBtn && (
          <Link to="/" className="flex items-center gap-2.5">
            <div className="leading-tight">
              {/* <div className="font-display text-lg font-bold tracking-tight">TRAIL NG</div> */}
              <img src="/trailng.png" alt="Trail tagline" className="-mt-1 h-10" />
            </div>
          </Link>
        )}

        {backBtn && (
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
        )}

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
