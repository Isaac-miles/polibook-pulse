import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Trail" },
      {
        name: "description",
        content:
          "Trail is a community-built archive that holds public figures accountable for what they post.",
      },
      { property: "og:title", content: "About — Trail" },
      {
        property: "og:description",
        content: "How the Trail accountability archive works and how to contribute.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold">About Trail</h1>
        <div className="prose mt-8 space-y-5 text-foreground/90">
          <p className="text-lg leading-relaxed">
            Trail is a public archive that lets anyone look up a politician's username on X/Twitter
            and see what they've said about elections, parties, and policy — with timestamps and
            sources.
          </p>
          <h2 className="font-display text-2xl font-semibold pt-4">How it works</h2>
          <ol className="list-decimal space-y-2 pl-5 text-base leading-relaxed">
            <li>
              Visit the{" "}
              <Link to="/" className="text-primary underline">
                Search
              </Link>{" "}
              page and enter a username.
            </li>
            <li>
              If they exist in the archive, you'll see their info and every archived statement that's been
              logged.
            </li>
            <li>
              If they don't exist, head to{" "}
              <Link to="/upload" className="text-primary underline">
                Upload
              </Link>{" "}
              to add them.
            </li>
            <li>
              Contributors paste the statement text and a link to the original — the timestamp gets
              saved automatically.
            </li>
          </ol>
          <h2 className="font-display text-2xl font-semibold pt-4">Storage note</h2>
          <p className="text-base leading-relaxed">
            For now, Trail runs without a database. Public records ship as a static JSON file in the
            app. Contributions made via the Upload page save locally and can be exported as JSON to
            be added to the public file.
          </p>
        </div>
      </main>
    </div>
  );
}
