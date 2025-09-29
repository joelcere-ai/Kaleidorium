"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { NewMobileHeader } from "@/components/new-mobile-header";
import { DesktopHeader } from "@/components/desktop-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function ForArtistsContent() {
  const router = useRouter();
  const [view, setView] = useState<"discover" | "collection" | "profile" | "for-artists" | "about">("for-artists");
  const [collectionCount, setCollectionCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    portfolioLink: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleReturnToDiscover = () => {
    router.push('/', { scroll: false });
  };

  const handleNavigate = (nextView: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => {
    if (nextView === "for-artists") return;
    if (nextView === "contact") {
      router.push("/contact", { scroll: false });
      return;
    }
    if (nextView === "profile") {
      router.push("/profile", { scroll: false });
      return;
    }
    if (nextView === "collection") {
      router.push("/collection", { scroll: false });
      return;
    }
    if (nextView === "discover") {
      router.replace("/", { scroll: false });
      return;
    }
    router.push(`/${nextView}`, { scroll: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/artist-submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("Thank you! Your portfolio has been submitted for review. We'll be in touch soon.");
        setFormData({ name: "", email: "", portfolioLink: "" });
      } else {
        setSubmitStatus("There was an error submitting your portfolio. Please try again.");
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus("There was an error submitting your portfolio. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen">
      {/* Conditional header rendering */}
      {isMobile ? (
        <NewMobileHeader currentPage="for-artists" collectionCount={collectionCount} />
      ) : (
        <DesktopHeader currentPage="for-artists" collectionCount={collectionCount} />
      )}
      <div className="flex-1 overflow-y-auto pt-20">
        <div className="container mx-auto px-4 py-4 max-w-3xl">
            <div className="mb-8">
              <h1 
                className="text-base font-serif font-bold text-black mb-8"
                style={{fontSize: '16px', fontFamily: 'Times New Roman, serif'}}
              >
                Be Discovered. Not Buried.
              </h1>
              <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                You put time, soul, and skill into your work—only for it to disappear in endless scrolls and overcrowded marketplaces. Kaleidorium changes that.
              </p>
              <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                We're not a gallery, marketplace, or agent.
              </p>
              <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                We're a new kind of discovery platform, powered by AI and built to match your artwork with the right eyes.
              </p>
              
              <p className="text-sm font-sans font-bold text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>How it works:</p>
              <ul className="list-disc pl-6 mb-4">
                <li className="text-sm font-sans text-black mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Upload your artwork and description</li>
                <li className="text-sm font-sans text-black mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Our algorithm shows it to collectors whose tastes match your style</li>
                <li className="text-sm font-sans text-black mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>When they like it, they're redirected to your own site or portfolio to follow up directly</li>
                <li className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>You keep control. No commissions. No middlemen. No gatekeeping.</li>
              </ul>
              
              <p className="text-sm font-sans font-bold text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Early access artists get 12 months of free uploads.</p>
              <p className="text-sm font-sans font-bold text-black mb-8" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Submit your portfolio and join our curated artist community</p>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-base font-serif font-bold text-black" style={{fontSize: '16px', fontFamily: 'Times New Roman, serif'}}>Submit Your Portfolio</CardTitle>
                <CardDescription className="text-sm font-sans text-black" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                  Please fill out the form below to submit your portfolio for review.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-black mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-black mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-black mb-1">Portfolio Link</label>
                    <input
                      type="url"
                      name="portfolioLink"
                      value={formData.portfolioLink}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://yourportfolio.com"
                      required
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-black text-white hover:bg-gray-800"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Portfolio"}
                  </Button>
                </form>

                <div className="mt-6">
                  <p className="mb-2 text-sm font-sans text-gray-600" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                    We will only use the information to review your portfolio and to notify you. If you are not invited, we will delete this information within 1 week.
                  </p>
                  <p className="text-sm font-sans text-gray-600" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                    If you are invited and you decide to accept the invitation, we will ask you for more information and record these. If you do not accept the invitation, all the information we hold about you will be deleted.
                  </p>
                </div>
                
                {submitStatus && (
                  <div className={`mt-4 p-3 rounded-md text-sm ${
                    submitStatus.includes("Thank you") 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {submitStatus}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invitation Section */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-base font-serif font-bold text-black" style={{fontSize: '16px', fontFamily: 'Times New Roman, serif'}}>Have you received your invitation?</CardTitle>
                <CardDescription className="text-sm font-sans text-black" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                  If you've received an invitation email with a token, click below to register.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                    Already have your invitation token? Complete your artist registration now.
                  </p>
                  <Button 
                    onClick={() => router.push('/for-artists/register')}
                    className="w-full bg-black text-white hover:bg-gray-800"
                    style={{
                      color: 'white !important', 
                      backgroundColor: 'black !important',
                      borderColor: 'black !important'
                    }}
                  >
                    <span style={{color: 'white !important', fontWeight: 'normal'}}>Register as an Artist</span>
                  </Button>
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                  <p className="text-blue-700 font-sans" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                    <strong>Note:</strong> You'll need both your email address and the invitation token we sent you to complete registration.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card id="faq-section" className="mb-8">
              <CardHeader>
                <CardTitle 
                  style={{
                    fontSize: '16px',
                    fontFamily: 'Times New Roman, serif',
                    fontWeight: 'bold',
                    color: 'black',
                    lineHeight: '1.2'
                  }}
                >
                  Frequently Asked Questions
                </CardTitle>
                <p className="text-sm font-sans text-gray-600 leading-relaxed mt-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                  We're building Kaleidorium for people who care about art, not algorithms. Reach out anytime.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  
                  <div>
                    <h3
                      className="mb-2 for-artists-faq-question"
                      style={{
                        fontSize: '14px',
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: 'bold',
                        color: 'black',
                        lineHeight: '1.4'
                      }}
                    >
                      Are you a marketplace or a gallery?
                    </h3>
                    <p 
                      className="leading-relaxed for-artists-faq-answer"
                      style={{
                        fontSize: '14px',
                        fontFamily: 'Arial, sans-serif',
                        color: 'black',
                        lineHeight: '1.5'
                      }}
                    >
                      No. Kaleidorium is not a marketplace nor a gallery. We do not facilitate any transaction. We connect artists and collectors—we're not part of any conversation or transaction that follows.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 for-artists-faq-question" style={{fontSize: '16px', fontFamily: '"Times New Roman", serif', fontWeight: 'bold', color: 'black', lineHeight: '1.2'}}>Is there a fee to join or submit my work?</h3>
                    <p className="leading-relaxed for-artists-faq-answer" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif', color: 'black', lineHeight: '1.5'}}>
                      No. Kaleidorium is currently in beta and completely free for artists. There are no commissions, no submission fees, and no hidden charges. In 2026, once we've reached a healthy community size, we may introduce a modest subscription and commission model for artists, with plenty of notice and the option to opt out. Collectors will always enjoy free access. If you ever wish to remove your work, you can do so in one click.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2" style={{fontSize: '16px', fontFamily: '"Times New Roman", serif', fontWeight: 'bold', color: 'black', lineHeight: '1.2'}}>How will my artwork be shown to collectors?</h3>
                    <p className="leading-relaxed for-artists-faq-answer" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif', color: 'black', lineHeight: '1.5'}}>
                      Your work is not displayed side-by-side in a crowded feed. Instead, it's shown individually to collectors whose preferences suggest they'll genuinely appreciate it. We use a personalized matching approach, more like a curator than a catalogue.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2" style={{fontSize: '16px', fontFamily: '"Times New Roman", serif', fontWeight: 'bold', color: 'black', lineHeight: '1.2'}}>What happens when collectors are interested?</h3>
                    <p className="leading-relaxed for-artists-faq-answer" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif', color: 'black', lineHeight: '1.5'}}>
                      Each artwork links directly to your own website, online store, or gallery page. Kaleidorium does not handle transactions. We simply bring qualified, interested collectors to you. If you're represented by a gallery, you can set your redirect link to point there instead.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2" style={{fontSize: '16px', fontFamily: '"Times New Roman", serif', fontWeight: 'bold', color: 'black', lineHeight: '1.2'}}>Why did you create Kaleidorium?</h3>
                    <p className="leading-relaxed for-artists-faq-answer" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif', color: 'black', lineHeight: '1.5'}}>
                      We've seen too many brilliant artists struggle to get noticed. In a world overflowing with content, being good is no longer enough, you also need to be found. Kaleidorium helps solve this by curating artwork to match each collector's taste, increasing the chance of discovery and appreciation.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2" style={{fontSize: '16px', fontFamily: '"Times New Roman", serif', fontWeight: 'bold', color: 'black', lineHeight: '1.2'}}>What if I'm not selected?</h3>
                    <p className="leading-relaxed for-artists-faq-answer" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif', color: 'black', lineHeight: '1.5'}}>
                      We're curating a high-quality experience for both artists and collectors. If you're not selected initially, we'll keep your information on file for future consideration as our community grows. You can always reapply with updated work.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2" style={{fontSize: '16px', fontFamily: '"Times New Roman", serif', fontWeight: 'bold', color: 'black', lineHeight: '1.2'}}>How do I get started?</h3>
                    <p className="leading-relaxed for-artists-faq-answer" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif', color: 'black', lineHeight: '1.5'}}>
                      Submit your portfolio using the form above. Our team will review your work and get back to you within a few days. If selected, you'll receive an invitation email with next steps.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
}

export default function ForArtists() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Kaleidorium</h1>
          <p className="text-lg text-white">Your Personal Art Curator</p>
        </div>
      </div>
    }>
      <ForArtistsContent />
    </Suspense>
  );
}
