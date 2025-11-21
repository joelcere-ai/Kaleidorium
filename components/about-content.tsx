import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AboutContent({ setView }: { setView: (view: "discover" | "collection" | "profile" | "for-artists" | "about") => void }) {
  const router = useRouter();
  
  // Interactive FAQ component matching FOR ARTISTS page
  const InteractiveFAQ = () => {
    const [openFAQ, setOpenFAQ] = useState<string | null>(null);

    const faqs = [
      {
        id: 'marketplace',
        question: 'Are you a marketplace or a gallery?',
        answer: 'No. Kaleidorium is not a marketplace nor a gallery. We do not facilitate any transaction. We connect artists and collectors. We\'re not part of any conversation or transaction that follows.'
      },
      {
        id: 'fee',
        question: 'Is there a fee to join?',
        answer: 'No. Kaleidorium is currently in beta and completely free for collectors. There are no commissions, no submission fees, and no hidden charges. In 2026, once we\'ve reached a healthy community size, we may introduce a modest subscription and commission model for artists, with plenty of notice and the option for them to opt out. Collectors will always enjoy free access.'
      },
      {
        id: 'interested',
        question: 'What happens when collectors are interested in an artwork?',
        answer: 'We provide a link to each artwork that directs directly to the artist\'s website, online store, or gallery page. You can then contact the artist or the gallery if you are interested to purchase, or if you have questions about the artwork. Kaleidorium does not handle transactions.'
      },
      {
        id: 'why-create',
        question: 'Why did you create Kaleidorium?',
        answer: 'We\'ve seen too many brilliant artists struggle to get noticed. In a world overflowing with content, being good is no longer enough, you also need to be found. Kaleidorium helps solve this by curating artwork to match each collector\'s taste, increasing the chance of discovery and appreciation.'
      },
      {
        id: 'algorithm',
        question: 'Is this just another algorithm that narrows people\'s view?',
        answer: 'Not at all. While we use AI to recommend art, we deliberately include moments of serendipity and surprise. Think of it like a trusted friend who knows your taste, but also knows how to stretch it thoughtfully.'
      },
      {
        id: 'how-it-works',
        question: 'How does the recommendation engine work?',
        answer: 'We combine a trained AI assistant with a custom-built taxonomy and feedback loops. The more you interact, the smarter the matching becomes, helping the right collectors find the right artists.'
      }
    ];

    const toggleFAQ = (id: string) => {
      setOpenFAQ(openFAQ === id ? null : id);
    };

    return (
      <div>
        <div className="text-center mb-6">
          <h2 className="text-xl font-serif font-bold text-black mb-3">
            Frequently Asked Questions
          </h2>
          <p className="font-sans text-sm text-gray-600 leading-relaxed">
            We're building Kaleidorium for people who care about art, not algorithms. Reach out anytime.
          </p>
        </div>
        
        <div>
          {faqs.map((faq) => (
            <div key={faq.id} className="mb-2">
              <div 
                className="p-4 cursor-pointer bg-white border border-gray-200 rounded-lg"
                onClick={() => toggleFAQ(faq.id)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-sans font-bold text-black text-sm">
                    {faq.question}
                  </span>
                  <span className="text-gray-500">
                    {openFAQ === faq.id ? '−' : '+'}
                  </span>
                </div>
              </div>
              {openFAQ === faq.id && (
                <div className="p-4 bg-gray-50 border-l-4 border-gray-300 mt-1">
                  <p className="font-sans text-gray-700 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Exact copy from FOR ARTISTS layout */}
      <div className="bg-gradient-to-br from-gray-50 to-white py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Column - Text */}
            <div className="lg:pr-8">
              <h1 
                className="text-2xl lg:text-3xl font-serif font-bold text-black mb-4"
                style={{fontFamily: 'Times New Roman, serif'}}
              >
                Swipe. Discover. Fall in Love (with Art).
              </h1>
              <p className="text-base font-sans text-black mb-4 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                Finding art you actually like shouldn't feel like browsing a furniture catalog. Kaleidorium is a simple, swipe-based app that gets smarter as you use it.
              </p>
              <p className="text-sm font-sans text-black mb-3" style={{fontFamily: 'Arial, sans-serif'}}>
                You swipe, we learn. Our AI-powered algorithm refines your preferences and shows you art you're more likely to love across style and mediums.
              </p>
              <p className="text-sm font-sans text-black mb-6" style={{fontFamily: 'Arial, sans-serif'}}>
                Save what speaks to you. Build your own visual album to inspire you, click to explore the artist's site, get a personalised artistic profile, artwork recommendations curated for you, and support artists you like.
              </p>
              
              {/* CTA Button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => router.push('/register')}
                  className="bg-black text-white hover:bg-gray-800 px-6 py-2 text-sm font-medium"
                  style={{fontFamily: 'Arial, sans-serif'}}
                >
                  Register as a Collector
                </Button>
              </div>
            </div>
            
            {/* Right Column - Compact Artwork Grid with grey background card */}
            <div className="relative">
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-sm font-sans text-gray-600 text-center mb-4" style={{fontFamily: 'Arial, sans-serif'}}>
                  Find your perfect matches
                </p>
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
        </div>
      </div>

      {/* How It Works Section - Matching FOR ARTISTS layout */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-lg font-serif font-bold text-black mb-3">
              How It Works
            </h2>
            <p className="text-sm font-sans text-gray-600">
              Three simple steps to discover art that speaks to you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="font-sans font-bold text-black mb-2 text-sm">Swipe & Discover</h3>
              <p className="text-xs font-sans text-gray-600 leading-relaxed">
                Swipe through curated artwork. Like what you love, skip what doesn't resonate.
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-sans font-bold text-black mb-2 text-sm">AI Learns</h3>
              <p className="text-xs font-sans text-gray-600 leading-relaxed">
                Our AI refines your preferences and shows you art you're more likely to love.
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-sans font-bold text-black mb-2 text-sm">Save & Connect</h3>
              <p className="text-xs font-sans text-gray-600 leading-relaxed">
                Build your collection and connect directly with artists you love.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section - Using exact same format as FOR ARTISTS */}
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <InteractiveFAQ />
        </div>
      </div>
    </div>
  );
} 