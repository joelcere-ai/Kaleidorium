import React from "react";
import { Separator } from "@/components/ui/separator";

export function AboutContent({ setView }: { setView: (view: "discover" | "collection" | "profile" | "for-artists" | "about") => void }) {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-base font-serif font-bold text-black mb-8" style={{fontSize: '16px', fontFamily: 'Times New Roman, serif'}}>Swipe. Discover. Fall in Love (with Art).</h1>

      <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Finding art you actually like shouldn't feel like browsing a furniture catalog. Kaleidorium is a simple, swipe-based app that gets smarter as you use it.</p>

      <h2 className="text-sm font-sans font-bold text-black mb-4 mt-8" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>You swipe, we learn.</h2>
      <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Our algorithm refines your preferences and shows you art you're more likely to love—across styles, mediums, and geographies.</p>

      <h2 className="text-sm font-sans font-bold text-black mb-4 mt-8" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Save what speaks to you</h2>
      <ul className="list-disc pl-6 mb-4">
        <li className="text-sm font-sans text-black" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Build your own visual album</li>
        <li className="text-sm font-sans text-black" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Click to explore the artist's site (we don't sell or take commissions)</li>
      </ul>

      <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>No spam. No pressure. Just discovery.</p>
      <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Join free. Your taste is the only invitation you need.</p>
      <p className="text-sm font-sans text-black mb-8" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
        <a
          href="/register"
          className="underline text-blue-700 hover:text-blue-900 cursor-pointer font-bold"
          style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}
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
        <h2 className="text-base font-serif font-bold text-black mb-4" style={{fontSize: '16px', fontFamily: 'Times New Roman, serif'}}>Frequently Asked Questions</h2>
        <p className="text-sm font-sans text-gray-600 mb-8" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
          We're building Kaleidorium for people who care about art, not algorithms. Reach out anytime.
        </p>
        
        <div>
          <h3 className="text-sm font-sans font-bold text-black mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Are you a marketplace or a gallery?</h3>
          <p className="text-sm font-sans text-black leading-relaxed" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            No. Kaleidorium is not a marketplace nor a gallery. We do not facilitate any transaction. We connect artists and collectors—we're not part of any conversation or transaction that follows.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-sans font-bold text-black mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Is there a fee to join?</h3>
          <p className="text-sm font-sans text-black leading-relaxed" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            No. Kaleidorium is currently in beta and completely free for collectors. There are no commissions, no submission fees, and no hidden charges. In 2026, once we've reached a healthy community size, we may introduce a modest subscription and commission model for artists, with plenty of notice and the option for them to opt out. Collectors will always enjoy free access.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-sans font-bold text-black mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>What happens when collectors are interested in an artwork?</h3>
          <p className="text-sm font-sans text-black leading-relaxed" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            We provide a link to each artwork that directs directly to the artist's website, online store, or gallery page. You can then contact the artist or the gallery if you are interested to purchase, or if you have questions about the artwork. Kaleidorium does not handle transactions.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-sans font-bold text-black mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Why did you create Kaleidorium?</h3>
          <p className="text-sm font-sans text-black leading-relaxed" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            We've seen too many brilliant artists struggle to get noticed. In a world overflowing with content, being good is no longer enough, you also need to be found. Kaleidorium helps solve this by curating artwork to match each collector's taste, increasing the chance of discovery and appreciation.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-sans font-bold text-black mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Is this just another algorithm that narrows people's view?</h3>
          <p className="text-sm font-sans text-black leading-relaxed" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            Not at all. While we use AI to recommend art, we deliberately include moments of serendipity and surprise. Think of it like a trusted friend who knows your taste, but also knows how to stretch it thoughtfully.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-sans font-bold text-black mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Who owns the rights to my artwork and data?</h3>
          <p className="text-sm font-sans text-black leading-relaxed" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            You do. Always. We make no claim on your images, metadata, or portfolio. You retain full control and copyright.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-sans font-bold text-black mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>How does the recommendation engine work?</h3>
          <p className="text-sm font-sans text-black leading-relaxed" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            We combine a trained AI assistant with a custom-built taxonomy and feedback loops. The more you interact, the smarter the matching becomes, helping the right collectors find the right artists.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-sans font-bold text-black mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Do you accept all artwork submissions?</h3>
          <p className="text-sm font-sans text-black leading-relaxed" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            We review each portfolio manually. We're not looking for a specific style. We welcome diversity, from abstract to figurative, classic to digital. But we do assess for originality, craft, and commercial potential (even if niche). Our goal is to maintain a high-quality, artistically-intentional experience.
          </p>
        </div>
      </div>
    </div>
  );
} 