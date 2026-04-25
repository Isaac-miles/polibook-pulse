import { useState } from "react";
import { X } from "lucide-react";

interface ScreenshotGridProps {
  images: string[];
  onImageClick?: (index: number) => void;
}

export function ScreenshotGrid({ images, onImageClick }: ScreenshotGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const count = images.length;

  // Determine grid layout based on number of images
  const getGridClass = () => {
    switch (count) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-2";
      case 4:
        return "grid-cols-2";
      default: // 5+
        return "grid-cols-3";
    }
  };

  const getItemClass = (index: number) => {
    // First item takes full width if there's only 1
    if (count === 1) return "col-span-1";

    // For 3 items, make the first one span 2 rows
    if (count === 3 && index === 0) return "col-span-2 row-span-2";

    // For 5-6 items, make the first span 2x2
    if ((count === 5 || count === 6) && index === 0) return "col-span-2 row-span-2";

    return "col-span-1";
  };

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    onImageClick?.(index);
  };

  return (
    <>
      <div
        className={`grid gap-1 overflow-hidden rounded-lg border border-border bg-muted`}
        style={{
          gridTemplateColumns:
            count === 1
              ? "1fr"
              : count === 2
                ? "1fr 1fr"
                : count === 3
                  ? "2fr 1fr"
                  : count === 4
                    ? "1fr 1fr"
                    : "1fr 1fr 1fr",
        }}
      >
        {images.map((image, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleImageClick(index)}
            className={`relative aspect-square overflow-hidden bg-muted transition-transform hover:bg-muted/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
              count === 1 ? "aspect-auto max-h-96" : ""
            }`}
            style={
              count === 3 && index === 0
                ? { gridColumn: "span 1", gridRow: "span 2" }
                : count >= 5 && index === 0
                  ? { gridColumn: "span 2", gridRow: "span 2" }
                  : {}
            }
          >
            <img
              src={image}
              alt={`Screenshot ${index + 1}`}
              className="h-full w-full object-cover"
              loading="lazy"
              style={{ backfaceVisibility: "hidden", transform: "translateZ(0)" }}
            />
          </button>
        ))}
      </div>

      {/* Lightbox modal */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-background/90 p-2 text-foreground shadow-lg hover:bg-background"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Navigation for multiple images */}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-2 text-foreground shadow-lg hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev === 0 ? images.length - 1 : (prev ?? 0) - 1));
                }}
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                className="absolute right-4 bottom-4 flex items-center gap-2 rounded-full bg-background/90 px-3 py-2 text-sm text-foreground shadow-lg hover:bg-background"
                onClick={(e) => e.stopPropagation()}
              >
                {(lightboxIndex ?? 0) + 1} / {images.length}
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-2 text-foreground shadow-lg hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev === images.length - 1 ? 0 : (prev ?? 0) + 1));
                }}
                aria-label="Next"
              >
                ›
              </button>
            </>
          )}

          <img
            src={images[lightboxIndex]}
            alt={`Screenshot ${lightboxIndex + 1}`}
            className="max-h-[90vh] max-w-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
