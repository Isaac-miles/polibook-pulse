import { FormEvent, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { validateSearchQuery } from "@/lib/validators";

interface HeroSectionProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSearch: (e: FormEvent) => void;
  isLoading: boolean;
}

export function HeroSection({ inputValue, onInputChange, onSearch, isLoading }: HeroSectionProps) {
  const [searchError, setSearchError] = useState<string>("");

  // Real-time validation
  useEffect(() => {
    if (!inputValue.trim()) {
      setSearchError("");
      return;
    }

    const validation = validateSearchQuery(inputValue.trim());
    if (!validation.valid) {
      setSearchError(validation.error || "");
    } else {
      setSearchError("");
    }
  }, [inputValue]);

  const isSearchDisabled = !!searchError || isLoading || !inputValue.trim();

  const handleSearchClick = (e: FormEvent) => {
    if (isSearchDisabled) {
      e.preventDefault();
      return;
    }
    onSearch(e);
  };

  return (
    <section className="relative overflow-hidden border-b border-border min-h-[620px]">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/nassembly.png')",
        }}
      ></div>

      {/* Dark green gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#004d26]/95 via-[#006633]/85 to-[#0f9d58]/45" />

      {/* Dot texture */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Soft fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-4 py-12">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.25em] text-white backdrop-blur-md">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" /> Community Archive ·
          Public Record
        </div>

        {/* Main content */}
        <div className="mt-4 max-w-3xl">
          <h1 className="text-4xl font-bold leading-tight text-white md:text-7xl">
            Digital{" "}
            <span className=" bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
              footprint
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-md leading-8 text-white/90 md:text-xl">
            Hold public figures accountable with a permanent record of their public statements.
            Search, verify, and trace the digital footprint of influential voices, archived and
            accessible for the public good.
          </p>
        </div>

        {/* Search bar with validation */}
        <form onSubmit={handleSearchClick} className="mt-10 space-y-2">
          <div className="flex flex-col gap-3 rounded-3xl bg-white/95 p-2 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:rounded-full">
            {/* Input */}
            <div
              className={`flex w-full items-center gap-2 px-2 py-1 sm:flex-1 sm:px-2 sm:py-2 rounded-full transition-all ${
                searchError ? "bg-red-50" : ""
              }`}
            >
              <Search
                className={`h-5 w-5 ${searchError ? "text-red-500" : "text-muted-foreground"}`}
              />

              <Input
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Search by username, party, or keyword..."
                className={`border-0 bg-transparent text-base shadow-none focus-visible:ring-0 placeholder:text-muted-foreground sm:text-lg ${
                  searchError ? "text-red-600" : ""
                }`}
              />
            </div>

            {/* Button */}
            <Button
              type="submit"
              disabled={isSearchDisabled}
              className="w-full rounded-2xl bg-green-700 py-2 px-3 text-base font-semibold hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:rounded-full sm:px-3 sm:py-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search archive"
              )}
            </Button>
          </div>

          {/* Error message */}
          {searchError && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-600">{searchError}</p>
            </div>
          )}
        </form>

        {/* Feature pills */}
        <div className="mt-6 flex flex-wrap gap-3">
          {["Community verified", "Timestamps", "Sources"].map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-white/10 px-2 py-2 text-sm text-white backdrop-blur-md"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
