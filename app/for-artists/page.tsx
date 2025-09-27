"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { MobileHeader } from "@/components/mobile-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    router.push('/');
  };

  const handleNavigate = (nextView: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => {
    if (nextView === "for-artists") return;
    if (nextView === "contact") {
      router.push("/contact");
      return;
    }
    if (nextView === "profile") {
      router.push("/profile");
      return;
    }
    if (nextView === "collection") {
      router.push("/collection");
      return;
    }
    router.push(`/?view=${nextView}`);
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

  // Render mobile version with MobileHeader
  if (isMobile) {
    return (
      <div className="min-h-screen">
        <MobileHeader currentPage="for-artists" />
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8 max-w-3xl">
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

            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-black mb-4">Submit Your Portfolio</h2>
                <p className="text-sm text-gray-600 mb-6">Please fill out the form below to submit your portfolio for review.</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
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
                  
                  <div>
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
                  
                  <div>
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
          </div>
        </div>
      </div>
    );
  }

  // Desktop version
  return (
    <div className="min-h-screen">
      <AppHeader view={view} setView={handleNavigate} collectionCount={collectionCount} />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleReturnToDiscover}>
            ← Back to Discovery
          </Button>
        </div>

        <div className="mb-8">
          <h1 
            className="text-3xl font-serif font-bold text-black mb-8"
            style={{fontFamily: 'Times New Roman, serif'}}
          >
            Be Discovered. Not Buried.
          </h1>
          <p className="text-lg font-sans text-black mb-4" style={{fontFamily: 'Arial, sans-serif'}}>
            You put time, soul, and skill into your work—only for it to disappear in endless scrolls and overcrowded marketplaces. Kaleidorium changes that.
          </p>
          <p className="text-lg font-sans text-black mb-4" style={{fontFamily: 'Arial, sans-serif'}}>
            We're not a gallery, marketplace, or agent.
          </p>
          <p className="text-lg font-sans text-black mb-4" style={{fontFamily: 'Arial, sans-serif'}}>
            We're a new kind of discovery platform, powered by AI and built to match your artwork with the right eyes.
          </p>
          
          <p className="text-lg font-sans font-bold text-black mb-4" style={{fontFamily: 'Arial, sans-serif'}}>How it works:</p>
          <ul className="list-disc pl-6 mb-4">
            <li className="text-lg font-sans text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>Upload your artwork and description</li>
            <li className="text-lg font-sans text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>Our algorithm shows it to collectors whose tastes match your style</li>
            <li className="text-lg font-sans text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>When they like it, they're redirected to your own site or portfolio to follow up directly</li>
            <li className="text-lg font-sans text-black mb-4" style={{fontFamily: 'Arial, sans-serif'}}>You keep control. No commissions. No middlemen. No gatekeeping.</li>
          </ul>
          
          <p className="text-lg font-sans font-bold text-black mb-4" style={{fontFamily: 'Arial, sans-serif'}}>Early access artists get 12 months of free uploads.</p>
          <p className="text-lg font-sans font-bold text-black mb-8" style={{fontFamily: 'Arial, sans-serif'}}>Submit your portfolio and join our curated artist community</p>
        </div>

        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-black mb-4">Submit Your Portfolio</h2>
            <p className="text-gray-600 mb-6">Please fill out the form below to submit your portfolio for review.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  placeholder="Your full name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2">Portfolio Link</label>
                <input
                  type="url"
                  name="portfolioLink"
                  value={formData.portfolioLink}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  placeholder="https://yourportfolio.com"
                  required
                />
              </div>
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white hover:bg-gray-800 py-3 text-lg"
              >
                {isSubmitting ? "Submitting..." : "Submit Portfolio"}
              </Button>
            </form>
            
            {submitStatus && (
              <div className={`mt-6 p-4 rounded-md text-lg ${
                submitStatus.includes("Thank you") 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {submitStatus}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ForArtists() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <ForArtistsContent />
    </Suspense>
  );
}
