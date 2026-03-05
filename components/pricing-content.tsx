"use client";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

export function PricingContent() {
  const router = useRouter();

  const handleContactClick = () => {
    router.push("/?view=contact");
  };

  const handleGetStartedClick = () => {
    router.push("/?view=profile");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-white py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* FREE IN 2026 — Hero Text */}
          <div className="max-w-3xl mx-auto text-center mb-10">
            <p className="text-xs font-sans uppercase tracking-widest text-gray-500 mb-3" style={{fontFamily: 'Arial, sans-serif'}}>Right now, in 2026</p>
            <h1 className="text-4xl md:text-5xl font-sans font-extrabold text-black mb-4" style={{fontFamily: 'Arial, sans-serif'}}>
              Everything is Free
            </h1>
            <p className="text-base font-sans text-gray-700 leading-relaxed mb-4" style={{fontFamily: 'Arial, sans-serif'}}>
              All features — for collectors, artists, and galleries — are completely free throughout 2026.
            </p>
            <p className="text-sm font-sans text-gray-500 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
              Plans below take effect from <strong>Jan 1, 2027</strong>. You will receive ample notice before then, and can cancel or remove your work with one click at any time.
            </p>
          </div>

          <h2 
            className="text-2xl font-serif font-bold text-black text-center mb-8"
            style={{fontFamily: 'Times New Roman, serif'}}
          >
            Plans (Starting 2027)
          </h2>

          {/* Pricing Cards - 3 Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {/* Collectors Plan */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
              {/* Free in 2026 badge */}
              <div className="bg-black text-white text-xs font-sans font-bold text-center py-1.5 px-3 rounded-md mb-5 tracking-wide" style={{fontFamily: 'Arial, sans-serif'}}>
                FREE IN 2026
              </div>
              <div className="text-center mb-6">
                <h2 className="text-xl font-serif font-bold text-black mb-2" style={{fontFamily: 'Times New Roman, serif'}}>
                  Collectors
                </h2>
                <div className="mb-4">
                  <span className="text-4xl font-sans font-bold text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                    Free Forever
                  </span>
                </div>
                <p className="text-sm font-sans text-gray-700 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                  Perfect for art lovers who want to discover new works and explore artists worldwide.
                </p>
              </div>
              
              <div className="mb-6">
                <h3 className="text-sm font-sans font-bold text-black mb-3" style={{fontFamily: 'Arial, sans-serif'}}>
                  Includes:
                </h3>
                <ul className="space-y-2.5">
                  <li className="flex items-start">
                    <span className="text-black mr-2 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      Unlimited art discovery
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      Personalized AI recommendations
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      Save and build your collections
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      Direct links to artists and galleries
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      No ads. No paywalls. No limits.
                    </span>
                  </li>
                </ul>
              </div>

              <p className="text-xs font-sans text-gray-600 mb-6 text-center" style={{fontFamily: 'Arial, sans-serif'}}>
                All artists upload free until 2027.
              </p>

              <Button 
                className="w-full bg-black text-white hover:bg-gray-800 font-sans" 
                style={{fontFamily: 'Arial, sans-serif'}}
                onClick={handleGetStartedClick}
              >
                Get Started
              </Button>
            </div>

            {/* Artists Plan - Featured */}
            <div className="bg-white border-2 border-black rounded-lg p-6 md:p-8 shadow-lg relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-black text-white text-xs font-sans px-3 py-1 rounded-full" style={{fontFamily: 'Arial, sans-serif'}}>
                  Most Popular
                </span>
              </div>
              {/* Free in 2026 badge */}
              <div className="bg-black text-white text-xs font-sans font-bold text-center py-1.5 px-3 rounded-md mb-5 mt-2 tracking-wide" style={{fontFamily: 'Arial, sans-serif'}}>
                FREE IN 2026
              </div>
              <div className="text-center mb-6">
                <h2 className="text-xl font-serif font-bold text-black mb-2" style={{fontFamily: 'Times New Roman, serif'}}>
                  Artists
                </h2>
                <div className="mb-1">
                  <span className="text-2xl font-sans font-bold text-gray-400 line-through" style={{fontFamily: 'Arial, sans-serif'}}>
                    $9/month
                  </span>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-sans font-bold text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                    Free in 2026
                  </span>
                </div>
                <p className="text-sm font-sans text-gray-700 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                  Show your work to collectors who already love your style.
                </p>
              </div>
              
              <div className="mb-6">
                <h3 className="text-sm font-sans font-bold text-black mb-3" style={{fontFamily: 'Arial, sans-serif'}}>
                  Includes:
                </h3>
                <ul className="space-y-2.5">
                  <li className="flex items-start">
                    <span className="text-black mr-2 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      Upload up to 10 artworks per month
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      Curatorial reviews automatically generated for each artwork
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      AI-powered matching to collectors
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      Artwork performance insights: views, likes, redirects
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      One-click link-out to your site, shop, or Instagram
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      Remove works or deactivate your profile easily.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      Priority visibility for long-term artists
                    </span>
                  </li>
                </ul>
              </div>

              <Button 
                className="w-full bg-black text-white hover:bg-gray-800 font-sans" 
                style={{fontFamily: 'Arial, sans-serif'}}
                onClick={handleGetStartedClick}
              >
                Get Started
              </Button>
            </div>

            {/* Galleries Plan */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
              {/* Free in 2026 badge */}
              <div className="bg-black text-white text-xs font-sans font-bold text-center py-1.5 px-3 rounded-md mb-5 tracking-wide" style={{fontFamily: 'Arial, sans-serif'}}>
                FREE IN 2026
              </div>
              <div className="text-center mb-6">
                <h2 className="text-xl font-serif font-bold text-black mb-2" style={{fontFamily: 'Times New Roman, serif'}}>
                  Galleries
                </h2>
                <div className="mb-1">
                  <span className="text-2xl font-sans font-bold text-gray-400 line-through" style={{fontFamily: 'Arial, sans-serif'}}>
                    $49/month
                  </span>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-sans font-bold text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                    Free in 2026
                  </span>
                </div>
                <p className="text-sm font-sans text-gray-700 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                  Grow your collector base without paying hundreds to crowded listing platforms.
                </p>
              </div>
              
              <div className="mb-6">
                <h3 className="text-sm font-sans font-bold text-black mb-3" style={{fontFamily: 'Arial, sans-serif'}}>
                  Includes:
                </h3>
                <ul className="space-y-2.5">
                  <li className="flex items-start">
                    <span className="text-black mr-2 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      Upload up to 50 artworks
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      Create profiles for all your represented artists
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      Direct link-outs to your gallery's site or sales pages
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      AI collector matching for each artist
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      Performance analytics per artwork
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      Bulk onboarding (we can upload your artists for you)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      No commission
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black mr-2 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      No communication handled by Kaleidorium, you stay in control
                    </span>
                  </li>
                </ul>
              </div>

              <Button 
                className="w-full bg-black text-white hover:bg-gray-800 font-sans" 
                style={{fontFamily: 'Arial, sans-serif'}}
                onClick={handleGetStartedClick}
              >
                Get Started
              </Button>
            </div>
          </div>

          {/* Why Free Until 2027 Section */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 
              className="text-2xl font-serif font-bold text-black text-center mb-6"
              style={{fontFamily: 'Times New Roman, serif'}}
            >
              Why Free Until 2027?
            </h2>
            <p className="text-base font-sans text-black text-center mb-6" style={{fontFamily: 'Arial, sans-serif'}}>
              Because we want to:
            </p>
            <ul className="space-y-3 max-w-2xl mx-auto">
              <li className="flex items-start">
                <span className="text-black mr-3 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                  Build the right collector base
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-black mr-3 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                  Grow carefully curated artist portfolios
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-black mr-3 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                  Improve the recommendation engine
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-black mr-3 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>·</span>
                <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                  Avoid introducing payments before the ecosystem is healthy
                </span>
              </li>
            </ul>
          </div>

          {/* Questions Section */}
          <div className="mt-12 max-w-3xl mx-auto text-center">
            <h2 
              className="text-2xl font-serif font-bold text-black mb-4"
              style={{fontFamily: 'Times New Roman, serif'}}
            >
              Questions About Pricing?
            </h2>
            <p className="text-base font-sans text-black mb-6" style={{fontFamily: 'Arial, sans-serif'}}>
              We're fully transparent and happy to help.
            </p>
            <Button
              onClick={handleContactClick}
              className="bg-black text-white hover:bg-gray-800 font-sans"
              style={{fontFamily: 'Arial, sans-serif'}}
            >
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

