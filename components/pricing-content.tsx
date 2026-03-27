"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function PricingContent() {
  const router = useRouter();

  const handleContactClick = () => {
    router.push("/?view=contact");
  };

  const handleGetStartedClick = () => {
    router.push("/?view=profile");
  };

  const featureItem = (text: string) => (
    <li className="flex items-start gap-2">
      <span className="mt-[3px] flex-shrink-0 text-[#8A8A84]">·</span>
      <span style={{ fontSize: '15px', color: '#5F5F5A', lineHeight: '1.55' }}>{text}</span>
    </li>
  );

  return (
    <div className="min-h-screen bg-[#FAFAF8]">

      {/* ── Hero ── */}
      <div className="bg-[#FAFAF8] pt-12 pb-10 md:pt-16 md:pb-12">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <p className="eyebrow-label mb-4">Right now, in 2026</p>
          <h1 className="hero-page-title mb-4">Everything is Free</h1>
          <p className="hero-page-intro mb-3">
            All features — for collectors, artists, and galleries — are completely free throughout 2026.
          </p>
          <p style={{ fontSize: '14px', color: '#8A8A84', lineHeight: '1.6', maxWidth: '560px', margin: '0 auto' }}>
            Plans below take effect from <strong style={{ color: '#5F5F5A', fontWeight: 600 }}>Jan 1, 2027</strong>. You will receive ample notice before then, and can cancel or remove your work with one click at any time.
          </p>
        </div>
      </div>

      {/* ── Plans heading ── */}
      <div className="container mx-auto px-4 max-w-5xl">
        <h2 className="role-section-title mb-8">Plans (Starting 2027)</h2>
      </div>

      {/* ── Pricing Cards ── */}
      <div className="container mx-auto px-4 max-w-5xl pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">

          {/* ── Collectors ── */}
          <div className="pricing-card flex flex-col">
            <div className="flex justify-center mb-5">
              <span className="pricing-badge-free">FREE IN 2026</span>
            </div>
            <div className="text-center mb-6">
              <p className="pricing-plan-name mb-3">Collectors</p>
              <p className="pricing-value mb-3">Free Forever</p>
              <p className="pricing-body">
                Perfect for art lovers who want to discover new works and explore artists worldwide.
              </p>
            </div>

            <div className="mb-6 flex-1">
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#1E1E1C', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Includes</p>
              <ul className="space-y-2">
                {featureItem("Unlimited art discovery")}
                {featureItem("Personalized AI recommendations")}
                {featureItem("Save and build your collections")}
                {featureItem("Direct links to artists and galleries")}
                {featureItem("No ads. No paywalls. No limits.")}
              </ul>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGetStartedClick}>
              Get Started
            </Button>
          </div>

          {/* ── Artists (featured) ── */}
          <div className="pricing-card-featured flex flex-col relative">
            <div className="flex justify-between items-center mb-5">
              <span className="pricing-badge-free">FREE IN 2026</span>
              <span className="pricing-badge-popular">Most Popular</span>
            </div>
            <div className="text-center mb-6">
              <p className="pricing-plan-name mb-3">Artists</p>
              <p style={{ fontSize: '16px', color: '#B8B8B4', textDecoration: 'line-through', marginBottom: '4px' }}>$9/month</p>
              <p className="pricing-value mb-3">Free in 2026</p>
              <p className="pricing-body">
                Show your work to collectors who already love your style.
              </p>
            </div>

            <div className="mb-6 flex-1">
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#1E1E1C', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Includes</p>
              <ul className="space-y-2">
                {featureItem("Upload up to 10 artworks per month")}
                {featureItem("Curatorial reviews automatically generated for each artwork")}
                {featureItem("AI-powered matching to collectors")}
                {featureItem("Artwork performance insights: views, likes, redirects")}
                {featureItem("One-click link-out to your site, shop, or Instagram")}
                {featureItem("Remove works or deactivate your profile easily")}
                {featureItem("Priority visibility for long-term artists")}
              </ul>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGetStartedClick}>
              Get Started
            </Button>
          </div>

          {/* ── Galleries ── */}
          <div className="pricing-card flex flex-col">
            <div className="flex justify-center mb-5">
              <span className="pricing-badge-free">FREE IN 2026</span>
            </div>
            <div className="text-center mb-6">
              <p className="pricing-plan-name mb-3">Galleries</p>
              <p style={{ fontSize: '16px', color: '#B8B8B4', textDecoration: 'line-through', marginBottom: '4px' }}>$49/month</p>
              <p className="pricing-value mb-3">Free in 2026</p>
              <p className="pricing-body">
                Grow your collector base without paying hundreds to crowded listing platforms.
              </p>
            </div>

            <div className="mb-6 flex-1">
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#1E1E1C', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Includes</p>
              <ul className="space-y-2">
                {featureItem("Upload up to 50 artworks")}
                {featureItem("Create profiles for all your represented artists")}
                {featureItem("Direct link-outs to your gallery's site or sales pages")}
                {featureItem("AI collector matching for each artist")}
                {featureItem("Performance analytics per artwork")}
                {featureItem("Bulk onboarding (we can upload your artists for you)")}
                {featureItem("No commission")}
                {featureItem("No communication handled by Kaleidorium, you stay in control")}
              </ul>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGetStartedClick}>
              Get Started
            </Button>
          </div>
        </div>

        {/* ── Why Free Until 2027 ── */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="role-section-title mb-6">Why Free Until 2027?</h2>
          <p className="hero-page-intro mb-6" style={{ fontSize: '16px' }}>
            Because we want to:
          </p>
          <ul className="space-y-3 max-w-xl mx-auto">
            {[
              "Build the right collector base",
              "Grow carefully curated artist portfolios",
              "Improve the recommendation engine",
              "Avoid introducing payments before the ecosystem is healthy",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span style={{ color: '#8A8A84', flexShrink: 0, marginTop: '2px' }}>·</span>
                <span style={{ fontSize: '15px', color: '#5F5F5A', lineHeight: '1.6' }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Questions ── */}
        <div className="mt-12 max-w-xl mx-auto text-center">
          <h2 className="role-section-title mb-4">Questions About Pricing?</h2>
          <p className="hero-page-intro mb-6" style={{ fontSize: '16px' }}>
            We're fully transparent and happy to help.
          </p>
          <Button variant="outline" onClick={handleContactClick}>
            Contact Us
          </Button>
        </div>
      </div>
    </div>
  );
}
