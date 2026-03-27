"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function PricingContent() {
  const router = useRouter();

  const handleContactClick    = () => router.push("/?view=contact");
  const handleGetStartedClick = () => router.push("/?view=profile");

  const featureItem = (text: string) => (
    <li className="flex items-start gap-2">
      <span style={{ color: '#8A8A84', flexShrink: 0, marginTop: '3px', fontSize: '14px' }}>·</span>
      <span style={{ fontSize: '14px', color: '#5F5F5A', lineHeight: '1.55' }}>{text}</span>
    </li>
  );

  return (
    <div className="min-h-screen bg-[#FAFAF8]">

      {/* ── Hero ── */}
      {/* top: 48px desktop / 32px mobile — per spec */}
      <div style={{ paddingTop: 'clamp(32px, 5vw, 48px)', paddingBottom: '48px' }}>
        <div className="container mx-auto px-4 max-w-2xl text-center">

          {/* Eyebrow — 13px, uppercase, muted */}
          <p className="eyebrow-label" style={{ marginBottom: '12px' }}>Right now, in 2026</p>

          {/* Hero title — 36px / 28px */}
          <h1 className="hero-page-title" style={{ marginBottom: '16px' }}>Everything is Free</h1>

          {/* Hero intro — 17px / 15px */}
          <p className="hero-page-intro" style={{ marginBottom: '12px' }}>
            All features — for collectors, artists, and galleries — are completely free throughout 2026.
          </p>

          {/* Support line — 15px, #8A8A84 */}
          <p className="hero-support-line">
            Plans below take effect from{' '}
            <strong style={{ color: '#5F5F5A', fontWeight: 600 }}>Jan 1, 2027</strong>.
            {' '}You will receive ample notice before then, and can cancel or remove your work with one click at any time.
          </p>
        </div>
      </div>

      {/* ── Plans heading ── */}
      <div className="container mx-auto px-4 max-w-5xl" style={{ marginBottom: '24px' }}>
        <h2 className="role-section-title">Plans (Starting 2027)</h2>
      </div>

      {/* ── Pricing Cards ── */}
      <div className="container mx-auto px-4 max-w-5xl" style={{ paddingBottom: '64px' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* ── Collectors ── */}
          <div className="pricing-card flex flex-col">
            <div className="flex justify-center" style={{ marginBottom: '20px' }}>
              <span className="pricing-badge-free">FREE IN 2026</span>
            </div>
            <div className="text-center" style={{ marginBottom: '20px' }}>
              <p className="pricing-plan-name" style={{ marginBottom: '8px' }}>Collectors</p>
              <p className="pricing-value" style={{ marginBottom: '8px' }}>Free Forever</p>
              <p className="pricing-body">
                Perfect for art lovers who want to discover new works and explore artists worldwide.
              </p>
            </div>

            <div className="flex-1" style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#8A8A84', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Includes</p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {featureItem("Unlimited art discovery")}
                {featureItem("Personalized AI recommendations")}
                {featureItem("Save and build your collections")}
                {featureItem("Direct links to artists and galleries")}
                {featureItem("No ads. No paywalls. No limits.")}
              </ul>
            </div>

            <Button variant="outline" size="sm" className="w-full" onClick={handleGetStartedClick}>
              Get Started
            </Button>
          </div>

          {/* ── Artists (featured) ── */}
          <div className="pricing-card-featured flex flex-col">
            <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
              <span className="pricing-badge-free">FREE IN 2026</span>
              <span className="pricing-badge-popular">Most Popular</span>
            </div>
            <div className="text-center" style={{ marginBottom: '20px' }}>
              <p className="pricing-plan-name" style={{ marginBottom: '8px' }}>Artists</p>
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#8A8A84', textDecoration: 'line-through', marginBottom: '4px' }}>$9/month</p>
              <p className="pricing-value" style={{ marginBottom: '8px' }}>Free in 2026</p>
              <p className="pricing-body">
                Show your work to collectors who already love your style.
              </p>
            </div>

            <div className="flex-1" style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#8A8A84', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Includes</p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {featureItem("Upload up to 10 artworks per month")}
                {featureItem("Curatorial reviews automatically generated for each artwork")}
                {featureItem("AI-powered matching to collectors")}
                {featureItem("Artwork performance insights: views, likes, redirects")}
                {featureItem("One-click link-out to your site, shop, or Instagram")}
                {featureItem("Remove works or deactivate your profile easily")}
                {featureItem("Priority visibility for long-term artists")}
              </ul>
            </div>

            <Button variant="outline" size="sm" className="w-full" onClick={handleGetStartedClick}>
              Get Started
            </Button>
          </div>

          {/* ── Galleries ── */}
          <div className="pricing-card flex flex-col">
            <div className="flex justify-center" style={{ marginBottom: '20px' }}>
              <span className="pricing-badge-free">FREE IN 2026</span>
            </div>
            <div className="text-center" style={{ marginBottom: '20px' }}>
              <p className="pricing-plan-name" style={{ marginBottom: '8px' }}>Galleries</p>
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#8A8A84', textDecoration: 'line-through', marginBottom: '4px' }}>$49/month</p>
              <p className="pricing-value" style={{ marginBottom: '8px' }}>Free in 2026</p>
              <p className="pricing-body">
                Grow your collector base without paying hundreds to crowded listing platforms.
              </p>
            </div>

            <div className="flex-1" style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#8A8A84', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Includes</p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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

            <Button variant="outline" size="sm" className="w-full" onClick={handleGetStartedClick}>
              Get Started
            </Button>
          </div>
        </div>

        {/* ── Why Free Until 2027 ── */}
        <div style={{ marginTop: '64px' }}>
          <div className="max-w-xl mx-auto text-center">
            <h2 className="role-section-title" style={{ marginBottom: '16px' }}>Why Free Until 2027?</h2>
            <p className="hero-page-intro" style={{ marginBottom: '16px', fontSize: '15px' }}>
              Because we want to:
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '480px', margin: '0 auto' }}>
              {[
                "Build the right collector base",
                "Grow carefully curated artist portfolios",
                "Improve the recommendation engine",
                "Avoid introducing payments before the ecosystem is healthy",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span style={{ color: '#8A8A84', flexShrink: 0, marginTop: '3px' }}>·</span>
                  <span style={{ fontSize: '14px', color: '#5F5F5A', lineHeight: '1.55' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Questions ── */}
        <div style={{ marginTop: '48px' }}>
          <div className="max-w-md mx-auto text-center">
            <h2 className="role-section-title" style={{ marginBottom: '12px' }}>Questions About Pricing?</h2>
            <p className="hero-support-line" style={{ marginBottom: '24px' }}>
              We're fully transparent and happy to help.
            </p>
            <Button variant="outline" size="sm" onClick={handleContactClick}>
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
