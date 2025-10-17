import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AboutContent({ setView }: { setView: (view: "discover" | "collection" | "profile" | "for-artists" | "about") => void }) {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-6">
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-black leading-tight">
              Swipe. Discover. Fall in Love (with Art).
            </h1>
            
            <p className="text-base font-sans text-black leading-relaxed">
              Finding art you actually like shouldn't feel like browsing a furniture catalog. Kaleidorium is a simple, swipe-based app that gets smarter as you use it.
            </p>

            <div className="space-y-4">
              <h2 className="text-lg font-sans font-bold text-black">You swipe, we learn.</h2>
              <p className="text-sm font-sans text-black leading-relaxed">
                Our AI-powered algorithm refines your preferences and shows you art you're more likely to love across style and mediums.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-sans font-bold text-black">Save what speaks to you</h2>
              <ul className="space-y-2 text-sm font-sans text-black">
                <li>• Build your own visual album to inspire you</li>
                <li>• Click to explore the artist's site</li>
                <li>• Get a personalised artistic profile</li>
                <li>• Artwork recommendations curated for you</li>
                <li>• Support artists you like</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={() => router.push('/register')}
                className="bg-black text-white hover:bg-gray-800 px-6 py-3 font-sans text-sm"
              >
                Register as a Collector
              </Button>
              <Button
                variant="outline"
                onClick={() => setView("discover")}
                className="border-black text-black hover:bg-gray-100 px-6 py-3 font-sans text-sm"
              >
                Start Discovering
              </Button>
            </div>
          </div>

          {/* Right Column - Artwork Grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-serif font-bold text-black text-center">
              Your art finds its perfect audience
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="aspect-square bg-white rounded overflow-hidden shadow-sm">
                <img 
                  src="/Onboarding-images/For Collectors/Hennie_3__The_Visitor___120x100cm__Oil__1754903123908.jpg"
                  alt="Artwork 1"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-square bg-white rounded overflow-hidden shadow-sm">
                <img 
                  src="/Onboarding-images/For Collectors/Josignacio_4_Josignacio_s_Rhapsody_Blue_1754903114939.jpg"
                  alt="Artwork 2"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-square bg-white rounded overflow-hidden shadow-sm">
                <img 
                  src="/Onboarding-images/For Collectors/Peterson_5_Isometric_Pixel_Art_by_Peterso_1754903119020.gif"
                  alt="Artwork 3"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-square bg-white rounded overflow-hidden shadow-sm">
                <img 
                  src="/Onboarding-images/For Collectors/Steampunk3_1755249065054.png"
                  alt="Artwork 4"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-square bg-white rounded overflow-hidden shadow-sm">
                <img 
                  src="/Onboarding-images/For Collectors/Theo_3_677_To_Theo_van_Gogh__Arles__S_1754903144275.jpg"
                  alt="Artwork 5"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-square bg-white rounded overflow-hidden shadow-sm">
                <img 
                  src="/Onboarding-images/For Collectors/xcopy_2_XCOPY_LAST_SELFIE_4K.gif"
                  alt="Artwork 6"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-xl font-serif font-bold text-black mb-3">
              How It Works
            </h2>
            <p className="text-sm font-sans text-gray-600 max-w-2xl mx-auto">
              Three simple steps to discover art that speaks to you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-sans font-bold text-black mb-2">1. Swipe & Discover</h3>
              <p className="text-sm font-sans text-gray-600 leading-relaxed">
                Swipe through curated artwork. Like what you love, skip what doesn't resonate.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-sans font-bold text-black mb-2">2. AI Learns</h3>
              <p className="text-sm font-sans text-gray-600 leading-relaxed">
                Our AI refines your preferences and shows you art you're more likely to love.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-sans font-bold text-black mb-2">3. Save & Connect</h3>
              <p className="text-sm font-sans text-gray-600 leading-relaxed">
                Build your collection and connect directly with artists you love.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-8">
            <h2 className="text-xl font-serif font-bold text-black mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              We're building Kaleidorium for people who care about art, not algorithms. Reach out anytime.
            </p>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-sans font-bold text-black mb-2">Are you a marketplace or a gallery?</h3>
              <p className="text-sm font-sans text-black leading-relaxed">
                No. Kaleidorium is not a marketplace nor a gallery. We do not facilitate any transaction. We connect artists and collectors. We're not part of any conversation or transaction that follows.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-sans font-bold text-black mb-2">Is there a fee to join?</h3>
              <p className="text-sm font-sans text-black leading-relaxed">
                No. Kaleidorium is currently in beta and completely free for collectors. There are no commissions, no submission fees, and no hidden charges. In 2026, once we've reached a healthy community size, we may introduce a modest subscription and commission model for artists, with plenty of notice and the option for them to opt out. Collectors will always enjoy free access.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-sans font-bold text-black mb-2">What happens when collectors are interested in an artwork?</h3>
              <p className="text-sm font-sans text-black leading-relaxed">
                We provide a link to each artwork that directs directly to the artist's website, online store, or gallery page. You can then contact the artist or the gallery if you are interested to purchase, or if you have questions about the artwork. Kaleidorium does not handle transactions.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-sans font-bold text-black mb-2">Why did you create Kaleidorium?</h3>
              <p className="text-sm font-sans text-black leading-relaxed">
                We've seen too many brilliant artists struggle to get noticed. In a world overflowing with content, being good is no longer enough, you also need to be found. Kaleidorium helps solve this by curating artwork to match each collector's taste, increasing the chance of discovery and appreciation.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-sans font-bold text-black mb-2">Is this just another algorithm that narrows people's view?</h3>
              <p className="text-sm font-sans text-black leading-relaxed">
                Not at all. While we use AI to recommend art, we deliberately include moments of serendipity and surprise. Think of it like a trusted friend who knows your taste, but also knows how to stretch it thoughtfully.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 