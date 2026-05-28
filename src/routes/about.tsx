import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Wepository" },
      {
        name: "description",
        content:
          "Wepository is a community-built archive that holds public figures accountable for what they post.",
      },
      { property: "og:title", content: "About — Wepository" },
      {
        property: "og:description",
        content: "How the Wepository accountability archive works and how to contribute.",
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
        <h1 className="font-display text-4xl font-bold">About Wepository</h1>
        <div className="prose mt-8 space-y-5 text-foreground/90">
          <p className="text-lg leading-relaxed">
            Wepository is a community-built public archive that holds public figures accountable for
            what they post online — politicians, activists, journalists, executives, and anyone else
            with a public platform, anywhere in the world.
          </p>
          <h2 className="font-display text-2xl font-semibold pt-4">How it works</h2>
          <ol className="list-decimal space-y-2 pl-5 text-base leading-relaxed">
            <li>
              Visit the{" "}
              <Link to="/" className="text-primary underline">
                home page
              </Link>{" "}
              and search by username, name, or keyword to find archived statements.
            </li>
            <li>
              If a public figure isn't in the archive yet, head to{" "}
              <Link to="/upload" className="text-primary underline">
                Upload
              </Link>{" "}
              or use the <strong>+ Add archive</strong> button.
            </li>
            <li>
              Paste the link to their post. Wepository automatically fetches the statement text,
              author details, post date, and a screenshot — no manual entry needed.
            </li>
            <li>
              Once saved, the archive is immediately visible on the community timeline and
              searchable by anyone.
            </li>
          </ol>
          <h2 className="font-display text-2xl font-semibold pt-4">What gets archived</h2>
          <p className="text-base leading-relaxed">
            Any public post from X/Twitter by a public figure. The archive stores the statement
            text, source URL, post date, author details, and an automatic screenshot — creating a
            permanent, verifiable record even if the original post is later deleted or edited.
          </p>
          <h2 className="font-display text-2xl font-semibold pt-4">Who can contribute</h2>
          <p className="text-base leading-relaxed">
            Anyone. Wepository is a community project. If you see a statement worth preserving,
            submit it. The more people contribute, the more complete the public record becomes.
          </p>
        </div>
      </main>
    </div>
  );
}
