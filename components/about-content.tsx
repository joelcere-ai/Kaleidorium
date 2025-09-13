import React from "react";
import { Separator } from "@/components/ui/separator";

export function AboutContent({ setView }: { setView: (view: "discover" | "collection" | "profile" | "for-artists" | "about") => void }) {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="font-serif text-2xl font-semibold mb-8">Swipe. Discover. Fall in Love (with Art).</h1>

      <p className="mb-4">Finding art you actually like shouldn't feel like browsing a furniture catalog. Kaleidorium is a simple, swipe-based app that gets smarter as you use it.</p>

      <h2 className="font-serif text-xl font-semibold mb-4 mt-8">You swipe, we learn.</h2>
      <p className="mb-4">Our algorithm refines your preferences and shows you art you're more likely to love—across styles, mediums, and geographies.</p>

      <h2 className="font-serif text-xl font-semibold mb-4 mt-8">Save what speaks to you</h2>
      <ul className="list-disc pl-6 mb-4 text-base">
        <li>Build your own visual album</li>
        <li>Click to explore the artist's site (we don't sell or take commissions)</li>
      </ul>

      <p className="mb-4">No spam. No pressure. Just discovery.</p>
      <p className="mb-4">Join free. Your taste is the only invitation you need.</p>
      <p className="mb-8">
        <a
          href="/register"
          className="underline text-blue-700 hover:text-blue-900 cursor-pointer"
          onClick={e => {
            e.preventDefault();
            window.location.href = "/register";
          }}
        >
          Register as Collector
        </a> and start exploring art.
      </p>

      <Separator className="my-12" />

      <div className="space-y-8">
        <h2 className="text-3xl font-serif text-center">Frequently Asked Questions</h2>
        <p className="text-center text-gray-600 mb-8">
          We're building Kaleidorium for people who care about art, not algorithms. Reach out anytime.
        </p>
        
        <div>
          <h3 className="font-semibold text-lg mb-2">Are you a marketplace or a gallery?</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            No. Kaleidorium is not a marketplace nor a gallery. We do not facilitate any transaction. We connect artists and collectors—we're not part of any conversation or transaction that follows.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Is there a fee to join?</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            No. Kaleidorium is currently in beta and completely free for collectors. There are no commissions, no submission fees, and no hidden charges. In 2026, once we've reached a healthy community size, we may introduce a modest subscription and commission model for artists, with plenty of notice and the option for them to opt out. Collectors will always enjoy free access.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">What happens when collectors are interested in an artwork?</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We provide a link to each artwork that directs directly to the artist's website, online store, or gallery page. You can then contact the artist or the gallery if you are interested to purchase, or if you have questions about the artwork. Kaleidorium does not handle transactions.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Why did you create Kaleidorium?</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We've seen too many brilliant artists struggle to get noticed. In a world overflowing with content, being good is no longer enough, you also need to be found. Kaleidorium helps solve this by curating artwork to match each collector's taste, increasing the chance of discovery and appreciation.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Is this just another algorithm that narrows people's view?</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Not at all. While we use AI to recommend art, we deliberately include moments of serendipity and surprise. Think of it like a trusted friend who knows your taste, but also knows how to stretch it thoughtfully.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Who owns the rights to my artwork and data?</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            You do. Always. We make no claim on your images, metadata, or portfolio. You retain full control and copyright.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">How does the recommendation engine work?</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We combine a trained AI assistant with a custom-built taxonomy and feedback loops. The more you interact, the smarter the matching becomes, helping the right collectors find the right artists.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Do you accept all artwork submissions?</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We review each portfolio manually. We're not looking for a specific style. We welcome diversity, from abstract to figurative, classic to digital. But we do assess for originality, craft, and commercial potential (even if niche). Our goal is to maintain a high-quality, artistically-intentional experience.
          </p>
        </div>
      </div>
    </div>
  );
} 