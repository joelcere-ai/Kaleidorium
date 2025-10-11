"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import ArtDiscovery from "@/components/art-discovery";
import { ProfilePage } from '@/components/profile-page';
import { AboutContent } from "@/components/about-content";
import { NewMobileHeader } from "@/components/new-mobile-header";
import { DesktopHeader } from "@/components/desktop-header";
import MobileCardStack from "@/components/mobile-card-stack";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, X, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
import { useState as useStateContact } from "react";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile } = useMobileDetection();
  
  // Determine current view from search params
  const getCurrentView = (): "discover" | "collection" | "profile" | "for-artists" | "about" | "contact" | "terms" | "privacy" => {
    const viewParam = searchParams.get("view");
    if (viewParam && ["collection", "profile", "for-artists", "about", "contact", "terms", "privacy"].includes(viewParam)) {
      return viewParam as any;
    }
    return "discover";
  };

  // Get artwork ID from search params
  const getArtworkId = (): string | null => {
    return searchParams.get("artworkId");
  };
  
  const [view, setViewState] = useState<"discover" | "collection" | "profile" | "for-artists" | "about" | "contact" | "terms" | "privacy">(getCurrentView());
  const [collectionCount, setCollectionCount] = useState(0);
  const [showApp, setShowApp] = useState(false);
  const [collection, setCollection] = useState<any[]>([]);
  
  // Art Preferences state (copied from ProfilePage)
  const [insights, setInsights] = useState({
    summary: "Click 'Refresh Insights' to analyze your collection.",
    aesthetic_profile: "",
    collecting_pattern: "",
    topArtists: [],
    topTags: [],
    priceRange: "N/A",
    recommendations: [],
    preferredMediums: []
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCollectionDetailsExpanded, setIsCollectionDetailsExpanded] = useState(false);

  // Update view when pathname changes
  useEffect(() => {
    const currentView = getCurrentView();
    if (currentView !== view) {
      setViewState(currentView);
    }
  }, [pathname, searchParams]);

  // Create a setView function that updates both state and URL
  const setView = (newView: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact" | "terms" | "privacy") => {
    setViewState(newView);
    // Use shallow routing to avoid page reloads
    if (newView === "discover") {
      router.push("/", { scroll: false });
    } else {
    router.push(`/?view=${newView}`, { scroll: false });
    }
  };

  // Load collection from localStorage
  useEffect(() => {
    const loadCollection = () => {
      try {
        const savedCollection = localStorage.getItem('kaleidorium_temp_collection');
        console.log('Loading collection from localStorage:', savedCollection);
        if (savedCollection) {
          const parsedCollection = JSON.parse(savedCollection);
          console.log('Parsed collection:', parsedCollection);
          setCollection(parsedCollection);
          setCollectionCount(parsedCollection.length);
        } else {
          console.log('No collection found in localStorage');
        }
      } catch (error) {
        console.error('Error loading collection:', error);
      }
    };
    
    loadCollection();
  }, []);

  // Reload collection when collectionCount changes (from ArtDiscovery component)
  useEffect(() => {
    const loadCollection = () => {
      try {
        const savedCollection = localStorage.getItem('kaleidorium_temp_collection');
        if (savedCollection) {
          const parsedCollection = JSON.parse(savedCollection);
          setCollection(parsedCollection);
        }
      } catch (error) {
        console.error('Error reloading collection:', error);
      }
    };
    
    loadCollection();
  }, [collectionCount]);

  // Show app immediately - no loading delay
  useEffect(() => {
      setShowApp(true);
  }, []);

  // Collection management functions
  const handleRemoveFromCollection = (id: string) => {
    const updatedCollection = collection.filter(item => item.id !== id);
    setCollection(updatedCollection);
    setCollectionCount(updatedCollection.length);
    localStorage.setItem('kaleidorium_temp_collection', JSON.stringify(updatedCollection));
  };

  // Handle artwork selection for desktop collection - navigate to discover with artwork ID
  const handleArtworkClick = (artwork: any) => {
    router.push(`/?artworkId=${artwork.id}`, { scroll: false });
  };

  // Art Preferences functions (copied from ProfilePage)
  const generateInsights = async () => {
    setIsGenerating(true)
    try {
      // First get basic analysis for stats
      const basicAnalysis = analyzeCollection()
      
      // Then get AI-powered insights if collection has artworks
      if (collection.length > 0) {
        const response = await fetch('/api/profile-insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            collection: collection
          })
        })
        
        if (response.ok) {
          const aiInsights = await response.json()
          setInsights({
            ...basicAnalysis,
            summary: aiInsights.summary,
            aesthetic_profile: aiInsights.aesthetic_profile,
            collecting_pattern: aiInsights.collecting_pattern,
            recommendations: aiInsights.recommendations
          })
        } else {
          // Fallback to basic analysis if AI fails
          setInsights(basicAnalysis)
        }
      } else {
        setInsights(basicAnalysis)
      }
    } catch (error) {
      console.error('Error generating insights:', error)
      setInsights(analyzeCollection())
    } finally {
      setIsGenerating(false)
    }
  }

  const analyzeCollection = (): any => {
    if (collection.length === 0) {
      return {
        summary: "Your collection is empty. Add some artworks to get insights.",
        topArtists: [],
        topTags: [],
        priceRange: "N/A",
        recommendations: [],
        preferredMediums: []
      };
    }

    const artistCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    const mediumCounts: Record<string, number> = {};
    const prices: number[] = [];

    collection.forEach((artwork) => {
      if (artwork.artist) {
        artistCounts[artwork.artist] = (artistCounts[artwork.artist] || 0) + 1;
      }
      if (artwork.tags && Array.isArray(artwork.tags)) {
        artwork.tags.forEach((tag: string) => {
          if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
      if (artwork.medium) {
        mediumCounts[artwork.medium] = (mediumCounts[artwork.medium] || 0) + 1;
      }
      if (artwork.price) {
        const price = parseFloat(artwork.price.replace(/[^0-9.-]+/g, ""));
        if(!isNaN(price)) prices.push(price);
      }
    });

    const getTopItems = (counts: Record<string, number>, count: number) =>
      Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, count)
        .map(([name]) => name);

    const topArtists = getTopItems(artistCounts, 3);
    const topTags = getTopItems(tagCounts, 5);
    const preferredMediums = getTopItems(mediumCounts, 3);
    
    const priceRange = prices.length > 0 
      ? `$${Math.min(...prices).toLocaleString()} - $${Math.max(...prices).toLocaleString()}` 
      : "N/A";

    let summary = `Your diverse collection spans multiple styles including ${topTags.slice(0, 3).join(", ")}, showing an eclectic taste in digital art.`;
    if (collection.length === 1) {
      summary = `Your collection features a single piece by ${topArtists[0]}. This ${topTags[0] || 'abstract'} artwork suggests you're just beginning to explore the world of digital art.`;
    }

    const recommendations = [];
    if (topTags.includes("Abstract")) {
      recommendations.push("Explore more works in the generative and abstract genres.");
    }
    if (recommendations.length === 0) {
      recommendations.push("Explore more works in the Discover section to refine your preferences");
    }

    return {
      summary,
      topArtists,
      topTags,
      priceRange,
      preferredMediums,
      recommendations,
    };
  };

  // For Artists Form component
  const ForArtistsForm = () => {
    const [formData, setFormData] = useStateContact({
      name: "",
      email: "",
      portfolioLink: ""
    });
    const [isSubmitting, setIsSubmitting] = useStateContact(false);
    const [submitStatus, setSubmitStatus] = useStateContact<string | null>(null);

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
    );
  };

  // For Artists Invitation component
  const ForArtistsInvitation = () => {
    return (
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
              onClick={() => window.location.href = '/for-artists/register'}
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
    );
  };

  // For Artists FAQ component
  const ForArtistsFAQ = () => {
    return (
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
                No. Kaleidorium is not a marketplace nor a gallery. We do not facilitate any transaction. We connect artists and collectors. We're not part of any conversation or transaction that follows.
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
    );
  };

  // Terms of Service content component
  const TermsContent = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-sans font-bold text-black mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>1. Acceptance of Terms</h2>
          <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            By accessing and using Kaleidorium ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-sans font-bold text-black mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>2. Use License</h2>
          <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            Permission is granted to temporarily use Kaleidorium for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-sans font-bold text-black mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>3. Disclaimer</h2>
          <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            The materials on Kaleidorium are provided on an 'as is' basis. Kaleidorium makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-sans font-bold text-black mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>4. Limitations</h2>
          <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            In no event shall Kaleidorium or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Kaleidorium, even if Kaleidorium or a Kaleidorium authorized representative has been notified orally or in writing of the possibility of such damage.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-sans font-bold text-black mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>5. Accuracy of materials</h2>
          <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            The materials appearing on Kaleidorium could include technical, typographical, or photographic errors. Kaleidorium does not warrant that any of the materials on its website are accurate, complete or current.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-sans font-bold text-black mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>6. Links</h2>
          <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            Kaleidorium has not reviewed all of the sites linked to our website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Kaleidorium of the site.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-sans font-bold text-black mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>7. Modifications</h2>
          <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            Kaleidorium may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-sans font-bold text-black mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>8. Governing Law</h2>
          <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            These terms and conditions are governed by and construed in accordance with the laws of the United States and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
          </p>
        </div>
      </div>
    );
  };

  // Privacy & Data Policy content component
  const PrivacyContent = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-sans font-bold text-black mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>1. Information We Collect</h2>
          <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support. This may include your name, email address, and any other information you choose to provide.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-sans font-bold text-black mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>2. How We Use Your Information</h2>
          <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and communicate with you about products, services, and events.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-sans font-bold text-black mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>3. Information Sharing</h2>
          <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share your information with service providers who assist us in operating our website and conducting our business.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-sans font-bold text-black mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>4. Data Security</h2>
          <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-sans font-bold text-black mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>5. Cookies and Tracking</h2>
          <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            We use cookies and similar tracking technologies to collect and use personal information about you. You can control cookies through your browser settings.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-sans font-bold text-black mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>6. Your Rights</h2>
          <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            You have the right to access, update, or delete the information we have on you. You also have the right to opt out of certain communications from us.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-sans font-bold text-black mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>7. Children's Privacy</h2>
          <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-sans font-bold text-black mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>8. Changes to This Policy</h2>
          <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "last updated" date.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-sans font-bold text-black mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>9. Contact Us</h2>
          <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
            If you have any questions about this privacy policy, please contact us at thekurator@blockmeister.com.
          </p>
        </div>
      </div>
    );
  };

  // Contact form component
  const ContactForm = () => {
    const [email, setEmail] = useStateContact("");
    const [subject, setSubject] = useStateContact("");
    const [message, setMessage] = useStateContact("");
    const [status, setStatus] = useStateContact<string | null>(null);
    const [loading, setLoading] = useStateContact(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setStatus(null);
      
      try {
        console.log('Sending email via client-side EmailJS...');
        
        // Send email directly via EmailJS from client-side
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: 'service_za8v4ih',
            template_id: 'template_qo87gc7',
            user_id: 'CRMHpV3s39teTwijy',
            template_params: {
              to_email: 'thekurator@blockmeister.com',
              from_email: email,
              subject: subject,
              message: message,
            },
          }),
        });
        
        console.log('EmailJS response status:', response.status);
        
        if (response.ok) {
          console.log('Email sent successfully');
          setStatus("Your message is on its way. Our curators will reply shortly.");
          setEmail("");
          setSubject("");
          setMessage("");
        } else {
          const errorText = await response.text();
          console.error('EmailJS error:', errorText);
          setStatus("Failed to send your message. Please try again later.");
        }
      } catch (error) {
        console.error('Contact form error:', error);
        setStatus("Failed to send your message. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-sans font-bold text-black" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Your Email</label>
          <input
            type="email"
            className="border rounded px-3 py-2 w-full"
            style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-sans font-bold text-black" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Subject</label>
          <input
            className="border rounded px-3 py-2 w-full"
            style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
            placeholder="Subject"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-sans font-bold text-black" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Message</label>
          <textarea
            className="border rounded px-3 py-2 w-full"
            style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
            placeholder="Type your message here..."
            rows={6}
          />
        </div>
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded"
          disabled={loading}
          style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}
        >
          {loading ? "Sending..." : "Submit"}
        </button>
        {status && <div className="mt-4 text-center text-blue-700" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>{status}</div>}
      </form>
    );
  };

  // Show loading screen briefly, then show app
  if (!showApp) {
    console.log('Page.tsx: Waiting to show app...');
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          {isMobile ? (
            <>
              <h1 className="text-3xl font-bold text-black mb-2">Kaleidorium</h1>
              <p className="text-lg text-black mb-4">Your Personal Art Curator</p>
              <div className="text-black text-xl">Loading Artwork...</div>
            </>
          ) : (
            <div className="text-black text-xl">Loading Artwork...</div>
          )}
        </div>
      </div>
    );
  }

  console.log('Page.tsx: Showing unified app with view =', view);

  // Render appropriate header based on view
  const renderHeader = () => {
    if (isMobile) {
      return <NewMobileHeader currentPage={view} collectionCount={collectionCount} setView={setView} />;
    } else {
      return <DesktopHeader currentPage={view} collectionCount={collectionCount} setView={setView} />;
    }
  };

  // Render appropriate content based on view
  const renderContent = () => {
    switch (view) {
      case "discover":
        return <ArtDiscovery view="discover" setView={setView} collectionCount={collectionCount} setCollectionCount={setCollectionCount} selectedArtworkId={getArtworkId()} />;
      
      case "collection":
        return (
          <div className="flex-1 overflow-y-auto">
            {isMobile ? (
              <MobileCardStack
                artworks={collection}
                view="collection"
                setView={setView}
                collection={collection}
                onRemoveFromCollection={handleRemoveFromCollection}
                onLike={() => {}}
                onDislike={() => {}}
                onAddToCollection={() => {}}
                onLoadMore={() => {}}
              />
            ) : (
              <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                  <Button variant="ghost" onClick={() => setView("discover")} style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Discovery
                  </Button>
                </div>

                {/* Two-Tier Artistic Profile Section */}
                <div className="mb-8">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Your Artistic Profile</CardTitle>
                      </div>
                      <Button className="bg-black text-white hover:bg-gray-800" size="sm" onClick={generateInsights} disabled={isGenerating}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                        Refresh Insights
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Always Visible: Aesthetic Profile */}
                      {insights.aesthetic_profile && (
                        <div>
                          <p className="text-muted-foreground leading-relaxed">{insights.aesthetic_profile}</p>
                        </div>
                      )}

                      {/* Collapsible Toggle Button */}
                      <div className="flex justify-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsCollectionDetailsExpanded(!isCollectionDetailsExpanded)}
                          className="flex items-center gap-2"
                        >
                          {isCollectionDetailsExpanded ? (
                            <>
                              Hide Collection Insights
                              <ChevronUp className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              Show Collection Insights and Personalized Recommendations
                              <ChevronDown className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Expandable Content */}
                      {isCollectionDetailsExpanded && (
                        <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                          <Separator />

                          {/* AI-Generated Collection Summary */}
                          <div>
                            <h3 className="text-sm font-medium mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Collection Overview</h3>
                            <p className="text-muted-foreground leading-relaxed">{insights.summary}</p>
                          </div>

                          {/* AI-Generated Collecting Pattern */}
                          {insights.collecting_pattern && (
                            <div>
                              <h3 className="text-sm font-medium mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Collecting Pattern</h3>
                              <p className="text-muted-foreground leading-relaxed">{insights.collecting_pattern}</p>
                            </div>
                          )}

                          <Separator />

                          {/* Collection Statistics */}
                          <div>
                            <h3 className="text-sm font-medium mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Collection Statistics</h3>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <h4 className="text-sm font-medium mb-2">Top Artists</h4>
                              {insights.topArtists.length > 0 ? (
                                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                                  {insights.topArtists.map((artist: string) => (
                                    <li key={artist}>{artist}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-muted-foreground">No artists in collection yet</p>
                              )}
                            </div>

                            <div>
                                <h4 className="text-sm font-medium mb-2">Preferred Styles</h4>
                              <div className="flex flex-wrap gap-2">
                                {insights.topTags.length > 0 ? (
                                  insights.topTags.map((tag) => (
                                    <Badge key={tag} variant="secondary">
                                      {tag}
                                    </Badge>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground">No styles in collection yet</p>
                                )}
                            </div>
                          </div>

                            <div>
                                <h4 className="text-sm font-medium mb-2">Preferred Mediums</h4>
                              {insights.preferredMediums.length > 0 ? (
                                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                                  {insights.preferredMediums.map((medium) => (
                                    <li key={medium}>{medium}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-muted-foreground">No mediums in collection yet</p>
                              )}
                            </div>

                            <div>
                                <h4 className="text-sm font-medium mb-2">Price Range</h4>
                              <p className="text-sm text-muted-foreground">{insights.priceRange}</p>
                              </div>
                            </div>
                          </div>

                          <Separator />

                          {/* AI-Generated Recommendations */}
                          <div>
                            <h3 className="text-sm font-medium mb-3" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Personalized Recommendations</h3>
                            {insights.recommendations.length > 0 ? (
                              <ul className="space-y-2">
                                {insights.recommendations.map((recommendation, index) => (
                                <li key={index} className="flex items-start space-x-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span className="text-black leading-relaxed">{recommendation}</span>
                                </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-muted-foreground">
                                Add artworks to your collection to get personalized recommendations
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="mb-6">
                  <h1 className="text-base font-serif font-bold text-black mb-2" style={{fontSize: '14px', fontFamily: 'Times New Roman, serif'}}>My Collection ({collectionCount})</h1>
                </div>

                {(() => {
                  console.log('Collection display check - collection.length:', collection.length, 'collectionCount:', collectionCount);
                  return collection.length === 0;
                })() ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <Heart className="h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-xl font-medium mb-2 text-black" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Your collection is empty</h3>
                      <p className="text-gray-600 mb-6" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>Start exploring Kaleidorium's curated selection of artwork and add pieces you love to your collection.</p>
                      <Button 
                        onClick={() => setView("discover")}
                        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                        style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}
                      >
                        Discover Artwork
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collection.map((artwork) => (
                      <Card key={artwork.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <img
                            src={artwork.artwork_image || "/placeholder.svg"}
                            alt={artwork.title}
                            className="w-full h-64 object-cover cursor-pointer"
                            onClick={() => handleArtworkClick(artwork)}
                          />
                          <div className="p-4">
                            <h3 className="font-semibold mb-1" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>{artwork.title}</h3>
                            <p className="text-sm text-gray-600 mb-2" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>{artwork.artist}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveFromCollection(artwork.id)}
                              className="w-full"
                              style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}
                            >
                              Remove from Collection
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      
      case "profile":
        return (
          <div className="flex-1 overflow-y-auto">
            <ProfilePage collection={collection} onReturnToDiscover={() => setView("discover")} />
          </div>
        );
      
      case "for-artists":
        return (
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-4 max-w-3xl" data-view="for-artists">
              <div className="mb-8">
                <h1 
                  className="text-base font-serif font-bold text-black mb-8"
                  style={{fontSize: '16px', fontFamily: 'Times New Roman, serif'}}
                >
                  Be Discovered. Not Buried.
                </h1>
                <p className="text-sm font-sans text-black mb-4" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                  You put time, soul, and skill into your work. Only for it to disappear in endless scrolls and overcrowded marketplaces. Kaleidorium changes that.
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

              <ForArtistsForm />

              {/* Invitation Section */}
              <ForArtistsInvitation />

              {/* FAQ Section */}
              <ForArtistsFAQ />
            </div>
          </div>
        );
      
      case "about":
        return (
          <div className="flex-1 overflow-y-auto">
            <AboutContent setView={setView} />
          </div>
        );
      
      case "contact":
        return (
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-8 max-w-lg">
              <ContactForm />
            </div>
          </div>
        );
      
      case "terms":
        return (
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-8 max-w-3xl">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-base font-serif font-bold text-black" style={{fontSize: '16px', fontFamily: 'Times New Roman, serif'}}>Terms of Service</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setView("discover")}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <TermsContent />
            </div>
          </div>
        );
      
      case "privacy":
        return (
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-8 max-w-3xl">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-base font-serif font-bold text-black" style={{fontSize: '16px', fontFamily: 'Times New Roman, serif'}}>Privacy & Data Policy</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setView("discover")}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <PrivacyContent />
            </div>
          </div>
        );
      
      default:
        return <ArtDiscovery view="discover" setView={setView} collectionCount={collectionCount} setCollectionCount={setCollectionCount} selectedArtworkId={getArtworkId()} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderHeader()}
      {renderContent()}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-black text-xl">Loading Artwork...</div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

