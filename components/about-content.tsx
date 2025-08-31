import React from "react";
import { Separator } from "@/components/ui/separator";

export function AboutContent({ setView }: { setView: (view: "discover" | "collection" | "profile" | "for-artists" | "about") => void }) {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="font-serif text-2xl font-semibold mb-8">Where art finds its people.</h1>

      <h2 className="font-serif text-xl font-semibold mb-4 mt-8">For Artists</h2>
      <p className="mb-2 font-semibold">Be Discovered. Not Buried.</p>
      <p className="mb-4">You put time, soul, and skill into your work—only for it to disappear in endless scrolls and overcrowded marketplaces. Kaleidorium changes that.</p>
      <p className="mb-4">We're not a gallery, marketplace, or agent.</p>
      <p className="mb-4">We're a new kind of discovery platform, powered by AI and built to match your artwork with the right eyes.</p>
      <p className="mb-2 font-semibold">Here's how it works:</p>
      <ul className="list-disc pl-6 mb-4 text-base">
        <li>Upload your artwork and description</li>
        <li>Our algorithm shows it to collectors whose tastes match your style</li>
        <li>When they like it, they're redirected to your own site or portfolio to follow up directly</li>
      </ul>
      <p className="mb-4">You keep control. No commissions. No middlemen. No gatekeeping.</p>
      <p className="mb-4">Early access artists get 12 months of free uploads.<br />
        <a
          href="#"
          className="underline text-blue-700 hover:text-blue-900 cursor-pointer"
          onClick={e => {
            e.preventDefault();
            setView("for-artists");
          }}
        >
          Submit your portfolio
        </a> and join our curated artist community
      </p>

      <h2 className="font-serif text-xl font-semibold mb-4 mt-10">For Collectors</h2>
      <p className="mb-2 font-semibold">Swipe. Discover. Fall in Love (with Art).</p>
      <p className="mb-4">Finding art you actually like shouldn't feel like browsing a furniture catalog. Kaleidorium is a simple, swipe-based app that gets smarter as you use it.</p>
      <ul className="list-disc pl-6 mb-4 text-base">
        <li>You swipe, we learn.</li>
        <li>Our algorithm refines your preferences and shows you art you're more likely to love—across styles, mediums, and geographies.</li>
      </ul>
      <ul className="list-disc pl-6 mb-4 text-base">
        <li>Save what speaks to you</li>
        <li>Build your own visual album</li>
        <li>Click to explore the artist's site (we don't sell or take commissions)</li>
      </ul>
      <p className="mb-4">No spam. No pressure. Just discovery.</p>
      <p className="mb-4">Join free. Your taste is the only invitation you need.</p>
      <p>
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

      <h2 className="font-serif text-xl font-semibold mb-4 mt-10">Questions?</h2>
      <p className="mb-2">We're building Kaleidorium for people who care about art, not algorithms. Reach out anytime. Do note that:</p>
      <ul className="list-disc list-inside text-sm space-y-1">
        <li>We connect artists and collectors—we're not part of any conversation or transaction that follows.</li>
        <li>Kaleidorium is currently in Beta and free to use throughout 2025.</li>
        <li>In 2026, we'll introduce a modest subscription and commission model for artists, with plenty of notice and the option to opt out. Collectors will always enjoy free access.</li>
      </ul>

      <Separator className="my-12" />

      <div className="space-y-8">
        <h2 className="text-3xl font-serif text-center">Frequently Asked Questions</h2>
        
        <div>
          <h3 className="font-semibold text-lg mb-2">Is there a fee to join or submit my work as an artist?</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            No. Kaleidorium is currently in alpha mode and completely free for artists and collectors. There are no commissions, no submission fees, and no hidden charges. Once we’ve reached a healthy community size, we may introduce a subscription model, but you’ll get plenty of advance notice. If you ever wish to remove your work, you can do so in one click.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">How will my artwork be shown to collectors?</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your work is not displayed side-by-side in a crowded feed. Instead, it’s shown individually to collectors whose preferences suggest they’ll genuinely appreciate it. We use a personalized matching approach, more like a curator than a catalogue.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">What happens when collectors are interested?</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Each artwork links directly to the website, online store, or gallery page you specify when registering it. Kaleidorium does not handle transactions. We simply bring qualified, interested collectors to you. If you’re represented by a gallery, you can set your redirect link to point there instead.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Why did you create Kaleidorium?</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We’ve seen too many brilliant artists struggle to get noticed. In a world overflowing with content, being good is no longer enough, you also need to be found. Kaleidorium helps solve this by curating artwork to match each collector’s taste, increasing the chance of discovery and appreciation.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Is this just another algorithm that narrows people’s view?</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Not at all. While we use AI to recommend art, we deliberately include moments of serendipity and surprise. Think of it like a trusted friend who knows your taste, but also knows how to stretch it thoughtfully.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Who owns the rights to my artwork and data when on Kaleidorium?</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            You do. Always. We make no claim whatsoever today or tomorrow on your images, metadata, or portfolio. You retain full control and copyright.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Is the service also free for collectors?</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Yes. Kaleidorium is free for collectors to browse, swipe, and discover work they love. This encourages more engagement and visibility for your art.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">How does the recommendation engine work?</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We combine a trained AI assistant with a custom-built taxonomy and feedback loops. The more users interact, the smarter the matching becomes, helping the right collectors find the right artists.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Do you accept all submissions?</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We review each portfolio manually. We’re not looking for a specific style. We welcome diversity, from abstract to figurative, classic to digital. But we do assess for originality, craft, and commercial potential (even if niche). Our goal is to maintain a high-quality, artistically-intentional experience.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Who reviews the portfolio?</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            All submissions are reviewed by a small collective of people involved in the arts - including curators, artists, and collectors - who help us maintain artistic integrity and variety.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">What happens after I submit my portfolio?</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            If your portfolio isn't selected right away, don't worry, you can always refine and resubmit at a later stage.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed mt-2">
            If your work is selected, you'll receive an official invitation with a unique token to create your account. This is a unique code to make sure you are who you say you are. Registration is fast, intuitive, and once complete, you can start uploading your artwork immediately.
          </p>
        </div>
      </div>
    </div>
  );
} 