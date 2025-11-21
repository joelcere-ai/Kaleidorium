"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import ArtDiscovery from "@/components/art-discovery";
import { ProfilePage } from '@/components/profile-page';
import { AboutContent } from "@/components/about-content";
import { PricingContent } from "@/components/pricing-content";
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
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { CollectorArchetype, analyzeCollectionForArchetype } from "@/lib/collector-archetypes";
import { CollectorArchetypeCard } from "@/components/collector-archetype-card";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile } = useMobileDetection();
  const { toast } = useToast();
  
  // Determine current view from search params
  const getCurrentView = (): "discover" | "collection" | "profile" | "for-artists" | "for-galleries" | "about" | "contact" | "pricing" | "terms" | "privacy" => {
    const viewParam = searchParams.get("view");
    if (viewParam && ["collection", "profile", "for-artists", "for-galleries", "about", "contact", "pricing", "terms", "privacy"].includes(viewParam)) {
      return viewParam as any;
    }
    return "discover";
  };

  // Get artwork ID from search params
  const getArtworkId = (): string | null => {
    return searchParams.get("artworkId");
  };

  
  const [view, setViewState] = useState<"discover" | "collection" | "profile" | "for-artists" | "for-galleries" | "about" | "contact" | "pricing" | "terms" | "privacy">(getCurrentView());
  const [collectionCount, setCollectionCount] = useState(0);
  const [collection, setCollection] = useState<any[]>([]);
  const [dbCollection, setDbCollection] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  
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
  const [userArchetype, setUserArchetype] = useState<CollectorArchetype | null>(null);

  // Update view when pathname changes
  useEffect(() => {
    const currentView = getCurrentView();
    if (currentView !== view) {
      setViewState(currentView);
    }
  }, [pathname, searchParams]);


  // Create a setView function that updates both state and URL
  const setView = (newView: "discover" | "collection" | "profile" | "for-artists" | "for-galleries" | "about" | "contact" | "pricing" | "terms" | "privacy") => {
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

  // Update collectionCount when actual collections change
  useEffect(() => {
    const actualCount = user ? dbCollection.length : collection.length;
    if (actualCount !== collectionCount) {
      setCollectionCount(actualCount);
    }
  }, [collection.length, dbCollection.length, user, collectionCount]);

  // Fetch user's collection from database (for registered users)
  useEffect(() => {
    const fetchUserCollection = async () => {
      if (!user) return;
      
      try {
        const { data: collectionRows, error: collectionError } = await supabase
          .from('Collection')
          .select('artwork_id')
          .eq('user_id', user.id);
          
        if (collectionError) {
          console.error('Error fetching user collection:', collectionError);
          return;
        }
        
        const artworkIds = collectionRows?.map(row => row.artwork_id) || [];
        if (artworkIds.length === 0) {
          setDbCollection([]);
          return;
        }
        
        const { data: artworks, error: artworkError } = await supabase
          .from('Artwork')
          .select('*')
          .in('id', artworkIds);
          
        if (!artworkError && artworks) {
          setDbCollection(artworks);
        }
      } catch (error) {
        console.error('Error in fetchUserCollection:', error);
      }
    };
    
    fetchUserCollection();
  }, [user]);

  // Initialize user authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);


  // Enhanced localStorage helpers for temporary collection
  const saveTemporaryCollection = (newCollection: any[]) => {
    try {
      localStorage.setItem('kaleidorium_temp_collection', JSON.stringify(newCollection));
      setCollectionCount(newCollection.length);
    } catch (error) {
      console.error('Failed to save temporary collection:', error);
    }
  };

  // Collection management functions
  const handleRemoveFromCollection = async (id: string) => {
    if (!user) {
      // Handle temporary collection removal
      const newCollection = collection.filter((item) => item.id !== id);
      setCollection(newCollection);
      saveTemporaryCollection(newCollection); // Persist to localStorage
      
      const removedArtwork = collection.find((item) => item.id === id);
      toast({
        title: "Removed from collection",
        description: removedArtwork ? `\"${removedArtwork.title}\" has been removed from your collection.` : "Artwork removed from collection.",
      });
      return;
    }

    try {
      // Remove from Supabase database
      const { error } = await supabase
        .from('Collection')
        .delete()
        .eq('user_id', user.id)
        .eq('artwork_id', Number(id));

      if (error) {
        console.error('Error removing from collection:', error);
        toast({
          title: "Error",
          description: "Failed to remove artwork from collection. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setDbCollection(prev => prev.filter((item) => item.id !== id));
      setCollection(prev => prev.filter((item) => item.id !== id));
      
      // Update collection count
      setCollectionCount(Math.max(0, collectionCount - 1));
      
      toast({
        title: "Removed from collection",
        description: "Artwork has been removed from your collection.",
      });
    } catch (error) {
      console.error('Error removing from collection:', error);
      toast({
        title: "Error",
        description: "Failed to remove artwork from collection. Please try again.",
        variant: "destructive",
      });
    }
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
        
        // Analyze collector archetype
        const archetype = analyzeCollectionForArchetype(collection)
        setUserArchetype(archetype)
      } else {
        setInsights(basicAnalysis)
        // Analyze collector archetype even with empty collection
        const archetype = analyzeCollectionForArchetype(collection)
        setUserArchetype(archetype)
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

    const handlePortfolioBlur = () => {
      setFormData((prev) => {
        const trimmedLink = prev.portfolioLink.trim();

        if (!trimmedLink) {
          return prev;
        }

        if (/^https?:\/\//i.test(trimmedLink)) {
          return prev.portfolioLink === trimmedLink ? prev : { ...prev, portfolioLink: trimmedLink };
        }

        return {
          ...prev,
          portfolioLink: `https://${trimmedLink}`
        };
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
                onBlur={handlePortfolioBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="www.yourportfolio.com"
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


  // Simple FAQ component
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
        question: 'Is there a fee to join or submit my work?',
        answer: 'No. Kaleidorium is currently in beta and completely free for artists. There are no commissions, no submission fees, and no hidden charges. In 2026, once we\'ve reached a healthy community size, we may introduce a modest subscription and commission model for artists, with plenty of notice and the option to opt out. Collectors will always enjoy free access. If you ever wish to remove your work, you can do so in one click.'
      },
      {
        id: 'show-artwork',
        question: 'How will my artwork be shown to collectors?',
        answer: 'Your work is not displayed side-by-side in a crowded feed. Instead, it\'s shown individually to collectors whose preferences suggest they\'ll genuinely appreciate it. We use a personalized matching approach, more like a curator than a catalogue.'
      },
      {
        id: 'interested',
        question: 'What happens when collectors are interested?',
        answer: 'Each artwork links directly to your own website, online store, or gallery page. Kaleidorium does not handle transactions. We simply bring qualified, interested collectors to you. If you\'re represented by a gallery, you can set your redirect link to point there instead.'
      },
      {
        id: 'why-create',
        question: 'Why did you create Kaleidorium?',
        answer: 'We\'ve seen too many brilliant artists struggle to get noticed. In a world overflowing with content, being good is no longer enough, you also need to be found. Kaleidorium helps solve this by curating artwork to match each collector\'s taste, increasing the chance of discovery and appreciation.'
      },
      {
        id: 'not-selected',
        question: 'What if I\'m not selected?',
        answer: 'We\'re curating a high-quality experience for both artists and collectors. If you\'re not selected initially, we\'ll keep your information on file for future consideration as our community grows. You can always reapply with updated work.'
      },
      {
        id: 'get-started',
        question: 'How do I get started?',
        answer: 'Submit your portfolio using the form above. Our team will review your work and get back to you within a few days. If selected, you\'ll receive an invitation email with next steps.'
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
            If you have any questions about this privacy policy, please contact us at kurator@kaleidorium.com.
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
              to_email: 'kurator@kaleidorium.com',
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
          <label className="block mb-1 text-sm font-sans font-bold text-black">Your Email</label>
          <input
            type="email"
            className="font-sans border rounded px-3 py-2 w-full text-sm"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-sans font-bold text-black">Subject</label>
          <input
            className="font-sans border rounded px-3 py-2 w-full text-sm"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
            placeholder="Subject"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-sans font-bold text-black">Message</label>
          <textarea
            className="font-sans border rounded px-3 py-2 w-full text-sm"
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
            placeholder="Type your message here..."
            rows={6}
          />
        </div>
        <button
          type="submit"
          className="font-sans bg-black text-white px-4 py-2 rounded text-sm"
          disabled={loading}
          style={{fontFamily: 'Arial, sans-serif'}}
        >
          {loading ? "Sending..." : "Submit"}
        </button>
        {status && <div className="font-sans mt-4 text-center text-blue-700 text-sm">{status}</div>}
      </form>
    );
  };

  console.log('Page.tsx: Showing unified app with view =', view);

  // Render appropriate header based on view
  const renderHeader = () => {
    if (isMobile) {
      return <NewMobileHeader currentPage={view} collectionCount={collectionCount} setView={setView} />;
    } else {
      return (
        <DesktopHeader 
          currentPage={view} 
          collectionCount={collectionCount} 
          setView={setView}
          onToggleFilters={() => {
            // Call the global toggle function from ArtDiscovery component
            if ((window as any).toggleDesktopFilters) {
              (window as any).toggleDesktopFilters();
            } else {
              console.log('Desktop filters not yet available');
            }
          }}
          isFiltering={false}
          showFilters={false}
        />
      );
    }
  };

  // Render appropriate content based on view
  const renderContent = () => {
    switch (view) {
      case "discover":
        return <ArtDiscovery view="discover" setView={setView} collectionCount={collectionCount} setCollectionCount={setCollectionCount} selectedArtworkId={getArtworkId()} onToggleDesktopFilters={() => {}} />;
      
      case "collection":
        return (
          <div className="flex-1 overflow-y-auto">
            {isMobile ? (
              <MobileCardStack
                artworks={user ? dbCollection : collection}
                view="collection"
                setView={setView}
                collection={user ? dbCollection : collection}
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
                      {/* Collector Archetype Card */}
                      {userArchetype ? (
                        <div className="flex justify-center">
                          <CollectorArchetypeCard archetype={userArchetype} />
                        </div>
                      ) : (
                        <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">Discover your collector archetype!</p>
                          <p className="text-xs text-gray-500">Click "Refresh Insights" to analyze your collection and find out what type of collector you are.</p>
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
                  <h1 className="text-base font-serif font-bold text-black mb-2" style={{fontSize: '14px', fontFamily: 'Times New Roman, serif'}}>My Collection ({(user ? dbCollection : collection).length})</h1>
                </div>

                {(user ? dbCollection : collection).length === 0 ? (
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
                    {(user ? dbCollection : collection).map((artwork) => (
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
          <div className="flex-1 overflow-y-auto" data-view="for-artists">
            {isMobile ? (
              <div>
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-gray-50 to-white py-12">
              <div className="container mx-auto px-4 max-w-5xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  {/* Left Column - Text */}
                  <div className="lg:pr-8">
                    <h1 
                      className="text-2xl lg:text-3xl font-serif font-bold text-black mb-4"
                      style={{fontFamily: 'Times New Roman, serif'}}
                    >
                      Be Discovered. Not Buried.
                    </h1>
                    <p className="text-base font-sans text-black mb-4 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                      You put time, soul, and skill into your work. Only for it to disappear in endless scrolls and overcrowded marketplaces. Kaleidorium changes that.
                    </p>
                    <p className="text-sm font-sans text-black mb-3" style={{fontFamily: 'Arial, sans-serif'}}>
                      We're not a gallery, marketplace, or agent.
                    </p>
                    <p className="text-sm font-sans text-black mb-6" style={{fontFamily: 'Arial, sans-serif'}}>
                      We're a new kind of discovery platform, powered by AI and built to match your artwork with the right eyes.
                    </p>
                    
                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        onClick={() => document.getElementById('portfolio-form')?.scrollIntoView({ behavior: 'smooth' })}
                        className="bg-black text-white hover:bg-gray-800 px-6 py-2 text-sm font-medium"
                        style={{fontFamily: 'Arial, sans-serif'}}
                      >
                        Join the Founding 100 Artists
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                        className="border-black text-black hover:bg-black hover:text-white px-6 py-2 text-sm font-medium"
                        style={{fontFamily: 'Arial, sans-serif'}}
                      >
                        How it Works
                      </Button>
                    </div>
                  </div>
                  
                  {/* Right Column - Compact Artwork Grid */}
                  <div className="relative">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <p className="text-sm font-sans text-gray-600 text-center mb-4" style={{fontFamily: 'Arial, sans-serif'}}>
                        Your art finds its perfect audience
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

            {/* How It Works Section */}
            <div id="how-it-works" className="py-12 bg-white">
              <div className="container mx-auto px-4 max-w-5xl">
                <h2 
                  className="text-xl font-serif font-bold text-black text-center mb-8"
                  style={{fontFamily: 'Times New Roman, serif'}}
                >
                  How It Works
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Step 1 */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h3 className="text-base font-sans font-bold text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                      Upload Your Artwork
                    </h3>
                    <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                      Upload a picture of your artwork and link to your own site. Simple and straightforward.
                    </p>
                  </div>
                  
                  {/* Step 2 */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-sans font-bold text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                      AI matches you with collectors
                    </h3>
                    <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                      Our AI analyzes your visual signature and matches it with collectors who will love your style.
                    </p>
                  </div>
                  
                  {/* Step 3 */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-sans font-bold text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                      Track Performance
                    </h3>
                    <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                      See how your art performs: likes, saves, and collector engagement with detailed analytics.
                    </p>
                  </div>
                  
                  {/* Step 4 */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-sans font-bold text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                      Stay in Control
                    </h3>
                    <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                      You keep full control. No commissions. No middlemen. No gatekeeping.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Founding 100 Section */}
            <div className="py-12 bg-gray-50">
              <div className="container mx-auto px-4 max-w-4xl text-center">
                <h2 
                  className="text-xl font-serif font-bold text-black mb-4"
                  style={{fontFamily: 'Times New Roman, serif'}}
                >
                  Become a Founding Artist
                </h2>
                <p className="text-base font-sans text-black mb-6 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                  We're curating the first 100 artists who will shape Kaleidorium's discovery model and help us build the future of art discovery.
                </p>
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-sans font-bold text-black mb-4" style={{fontFamily: 'Arial, sans-serif'}}>
                    Founding Artist Benefits
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div>
                      <p className="text-sm font-sans text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                        ✓ 12 months of free platform access
                      </p>
                      <p className="text-sm font-sans text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                        ✓ Priority in our AI matching algorithm
                      </p>
                      <p className="text-sm font-sans text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                        ✓ Input on platform development
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-sans text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                        ✓ Exclusive founding artist badge
                      </p>
                      <p className="text-sm font-sans text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                        ✓ Early access to new features
                      </p>
                      <p className="text-sm font-sans text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                        ✓ Community of like-minded artists
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio Submission Form */}
            <div id="portfolio-form" className="py-12 bg-white">
              <div className="container mx-auto px-4 max-w-2xl">
                <div className="text-center mb-8">
                  <h2 
                    className="text-xl font-serif font-bold text-black mb-3"
                    style={{fontFamily: 'Times New Roman, serif'}}
                  >
                    Become a Founding Artist: Submit Your Portfolio
                  </h2>
                  <p className="text-base font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                    Join our curated artist community and help shape the future of art discovery.
                  </p>
                </div>
                <ForArtistsForm />
              </div>
            </div>

            {/* FAQ Section */}
            <div className="py-12 bg-gray-50">
              <div className="container mx-auto px-4 max-w-4xl">
                <InteractiveFAQ />
              </div>
            </div>
          </div>
            ) : (
              // Desktop FOR ARTISTS content stays the same
              <>
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-gray-50 to-white py-12">
                  <div className="container mx-auto px-4 max-w-5xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                      {/* Left Column - Text */}
                      <div className="lg:pr-8">
                        <h1 
                          className="text-2xl lg:text-3xl font-serif font-bold text-black mb-4"
                          style={{fontFamily: 'Times New Roman, serif'}}
                        >
                          Be Discovered. Not Buried.
                        </h1>
                        <p className="text-base font-sans text-black mb-4 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                          You put time, soul, and skill into your work. Only for it to disappear in endless scrolls and overcrowded marketplaces. Kaleidorium changes that.
                        </p>
                        <p className="text-sm font-sans text-black mb-3" style={{fontFamily: 'Arial, sans-serif'}}>
                          We're not a gallery, marketplace, or agent.
                        </p>
                        <p className="text-sm font-sans text-black mb-6" style={{fontFamily: 'Arial, sans-serif'}}>
                          We're a new kind of discovery platform, powered by AI and built to match your artwork with the right eyes.
                        </p>
                        
                        {/* CTA Button */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button 
                            onClick={() => document.getElementById('portfolio-form')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-black text-white hover:bg-gray-800 px-6 py-2 text-sm font-medium"
                            style={{fontFamily: 'Arial, sans-serif'}}
                          >
                            Join the Founding 100 Artists
                          </Button>
                        </div>
                      </div>
                      
                      {/* Right Column - Compact Artwork Grid */}
                      <div className="relative">
                        <div className="bg-gray-100 rounded-lg p-4">
                          <p className="text-sm font-sans text-gray-600 text-center mb-4" style={{fontFamily: 'Arial, sans-serif'}}>
                            Your art finds its perfect audience
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

                {/* How It Works Section */}
                <div id="how-it-works" className="py-12 bg-white">
                  <div className="container mx-auto px-4 max-w-5xl">
                    <h2 
                      className="text-xl font-serif font-bold text-black text-center mb-8"
                      style={{fontFamily: 'Times New Roman, serif'}}
                    >
                      How It Works
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Step 1 */}
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                          <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <h3 className="text-base font-sans font-bold text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                          Upload Your Artwork
                        </h3>
                        <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                          Upload a picture of your artwork and link to your own site. Simple and straightforward.
                        </p>
                      </div>
                      
                      {/* Step 2 */}
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                          <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <h3 className="text-base font-sans font-bold text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                          AI matches you with collectors
                        </h3>
                        <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                          Our AI analyzes your visual signature and matches it with collectors who will love your style.
                        </p>
                      </div>
                      
                      {/* Step 3 */}
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                          <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h3 className="text-base font-sans font-bold text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                          Track Performance
                        </h3>
                        <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                          See how your art performs: likes, saves, and collector engagement with detailed analytics.
                        </p>
                      </div>
                      
                      {/* Step 4 */}
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                          <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <h3 className="text-base font-sans font-bold text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                          Build Your Network
                        </h3>
                        <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                          Connect directly with collectors who love your work and build lasting relationships.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Founding 100 Artists Section */}
                <div className="py-12 bg-gray-50">
                  <div className="container mx-auto px-4 max-w-4xl">
                    <div className="text-center mb-8">
                      <h2 
                        className="text-xl font-serif font-bold text-black mb-4"
                        style={{fontFamily: 'Times New Roman, serif'}}
                      >
                        Join the Founding 100 Artists
                      </h2>
                      <p className="text-sm font-sans text-black mb-6" style={{fontFamily: 'Arial, sans-serif'}}>
                        Be part of the first 100 artists who will shape the recommendations and help us build a platform that truly serves artists.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-base font-sans font-bold text-black mb-4" style={{fontFamily: 'Arial, sans-serif'}}>Founding Artist Benefits</h3>
                        <ul style={{listStyle: 'none', padding: 0}}>
                          <li style={{marginBottom: '12px', display: 'block'}}>
                            <span style={{marginRight: '12px', fontSize: '14px', color: 'black'}}>✓</span>
                            <span style={{fontSize: '14px', color: 'black', fontFamily: 'Arial, sans-serif'}}>12 months of free platform access</span>
                          </li>
                          <li style={{marginBottom: '12px', display: 'block'}}>
                            <span style={{marginRight: '12px', fontSize: '14px', color: 'black'}}>✓</span>
                            <span style={{fontSize: '14px', color: 'black', fontFamily: 'Arial, sans-serif'}}>Input on platform development</span>
                          </li>
                          <li style={{marginBottom: '12px', display: 'block'}}>
                            <span style={{marginRight: '12px', fontSize: '14px', color: 'black'}}>✓</span>
                            <span style={{fontSize: '14px', color: 'black', fontFamily: 'Arial, sans-serif'}}>Early access to new features</span>
                          </li>
                          <li style={{marginBottom: '12px', display: 'block'}}>
                            <span style={{marginRight: '12px', fontSize: '14px', color: 'black'}}>✓</span>
                            <span style={{fontSize: '14px', color: 'black', fontFamily: 'Arial, sans-serif'}}>Community of like-minded artists</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-base font-sans font-bold text-black mb-4" style={{fontFamily: 'Arial, sans-serif'}}>How to Get Started</h3>
                        <ol className="space-y-3">
                          <li className="flex items-start">
                            <span className="w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </span>
                            <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>Submit your portfolio below</span>
                          </li>
                          <li className="flex items-start">
                            <span className="w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </span>
                            <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>Our team reviews your work</span>
                          </li>
                          <li className="flex items-start">
                            <span className="w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </span>
                            <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>If selected, you'll receive an invitation</span>
                          </li>
                          <li className="flex items-start">
                            <span className="w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </span>
                            <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>Join the founding 100 and start uploading</span>
                          </li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Portfolio Submission Form */}
                <div id="portfolio-form" className="py-12 bg-white">
                  <div className="container mx-auto px-4 max-w-2xl">
                    <ForArtistsForm />
                  </div>
                </div>

                {/* Invitation Section */}
                <div className="py-12 bg-gray-50">
                  <div className="container mx-auto px-4 max-w-4xl text-center">
                    <h2 
                      className="text-xl font-serif font-bold text-black mb-4"
                      style={{fontFamily: 'Times New Roman, serif'}}
                    >
                      Have you received your invitation?
                    </h2>
                    <p className="text-base font-sans text-black mb-6 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                      If you've received an invitation email with a token, click below to register.
                    </p>
                    <Button
                      onClick={() => router.push('/for-artists/register')}
                      className="bg-black text-white hover:bg-gray-800 px-8 py-2 text-sm font-medium"
                      style={{fontFamily: 'Arial, sans-serif'}}
                    >
                      Register as an Artist
                    </Button>
                    <p className="text-sm font-sans text-gray-600 mt-4" style={{fontFamily: 'Arial, sans-serif'}}>
                      Note: You'll need both your email address and the invitation token we sent you to complete registration.
                    </p>
                  </div>
                </div>

                {/* FAQ Section */}
                <div className="py-12 bg-white">
                  <div className="container mx-auto px-4 max-w-4xl">
                    <InteractiveFAQ />
                  </div>
                </div>
              </>
            )}
          </div>
        );
      
      case "for-galleries":
        // Gallery submission form component
        const ForGalleriesForm = () => {
          const [formData, setFormData] = useState({
            name: "",
            website: "",
            contactName: "",
            email: "",
            message: ""
          });
          const [isSubmitting, setIsSubmitting] = useState(false);
          const [submitStatus, setSubmitStatus] = useState<string | null>(null);

          const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setIsSubmitting(true);
            setSubmitStatus(null);

            // Ensure website has protocol
            let websiteUrl = formData.website.trim();
            if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
              websiteUrl = `https://${websiteUrl}`;
            }

            try {
              const response = await fetch('/api/artist-submission', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  type: 'gallery',
                  name: formData.name,
                  website: websiteUrl,
                  email: formData.email,
                  contactName: formData.contactName,
                  message: formData.message
                }),
              });

              if (response.ok) {
                setSubmitStatus("Thank you! Your gallery has been submitted for review. We'll be in touch soon.");
                setFormData({ name: "", website: "", contactName: "", email: "", message: "" });
              } else {
                setSubmitStatus("There was an error submitting your gallery. Please try again.");
              }
            } catch (error) {
              console.error('Submission error:', error);
              setSubmitStatus("There was an error submitting your gallery. Please try again.");
            } finally {
              setIsSubmitting(false);
            }
          };

          const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setFormData({
              ...formData,
              [e.target.name]: e.target.value
            });
          };

          const handleWebsiteBlur = () => {
            setFormData((prev) => {
              const trimmedLink = prev.website.trim();

              if (!trimmedLink) {
                return prev;
              }

              if (/^https?:\/\//i.test(trimmedLink)) {
                return prev.website === trimmedLink ? prev : { ...prev, website: trimmedLink };
              }

              return {
                ...prev,
                website: `https://${trimmedLink}`
              };
            });
          };

          return (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-base font-serif font-bold text-black" style={{fontSize: '16px', fontFamily: 'Times New Roman, serif'}}>Submit Your Gallery</CardTitle>
                <CardDescription className="text-sm font-sans text-black" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                  Submit your gallery details and which artists you would like to list.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-black mb-1">Gallery Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your gallery name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-black mb-1">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      onBlur={handleWebsiteBlur}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="www.yourgallery.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-black mb-1">Contact Name</label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your name"
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
                    <label className="block text-sm font-medium text-black mb-1">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tell us about your gallery and which artists you would like to list..."
                      rows={4}
                      required
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-black text-white hover:bg-gray-800"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Gallery"}
                  </Button>
                </form>

                <div className="mt-6">
                  <p className="mb-2 text-sm font-sans text-gray-600" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                    We will only use the information to review your gallery and to notify you. If you are not invited, we will delete this information within 1 week.
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

        // Gallery-specific FAQ component
        const GalleryFAQ = () => {
          const [openFAQ, setOpenFAQ] = useState<string | null>(null);

          const faqs = [
            {
              id: 'marketplace',
              question: 'Are you a marketplace or an online gallery?',
              answer: 'No. Kaleidorium is not a gallery or a selling platform. We don\'t take payments, negotiate deals, or participate in transactions. We simply connect collectors with the right artists and send them directly to you.'
            },
            {
              id: 'cost',
              question: 'What does it cost?',
              answer: 'Nothing during beta and we do not charge commissions. In 2027, we may introduce a modest subscription model for artists and galleries (see our pricing page). Collector access will always be free.'
            },
            {
              id: 'matching',
              question: 'How does Kaleidorium match collectors with artists?',
              answer: 'We analyze each artwork\'s visual signature and compare it with collectors\' taste profiles. This helps surface artists to collectors who are genuinely aligned with their aesthetics.'
            },
            {
              id: 'upload',
              question: 'Do I need to upload all my artists manually?',
              answer: 'You can, but you don\'t have to. If you represent many artists, contact us and we\'ll do it for you, from the information already on your website.'
            },
            {
              id: 'interested',
              question: 'What happens when collectors are interested in an artwork?',
              answer: 'They are redirected straight to your gallery website, online store, or inquiry page. We never sit between you and the buyer.'
            },
            {
              id: 'accept',
              question: 'Do you accept all galleries?',
              answer: 'We evaluate each submission to ensure a high-quality, intentional, and diverse selection of artists. We welcome galleries of all sizes, from boutique spaces to established institutions.'
            },
            {
              id: 'rights',
              question: 'Who owns the rights to the artwork and images?',
              answer: 'The artists retain full ownership and copyright. Kaleidorium does not claim rights over any images, descriptions, or data submitted.'
            },
            {
              id: 'why-create',
              question: 'Why did you create Kaleidorium?',
              answer: 'Because great artists deserve to make a living. Collectors often never discover the artists they would love most. We built Kaleidorium to change that, one match at a time.'
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
          <div className="flex-1 overflow-y-auto" data-view="for-galleries">
            {isMobile ? (
              <div>
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-gray-50 to-white py-12">
              <div className="container mx-auto px-4 max-w-5xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  {/* Left Column - Text */}
                  <div className="lg:pr-8">
                    <h1 
                      className="text-2xl lg:text-3xl font-serif font-bold text-black mb-4"
                      style={{fontFamily: 'Times New Roman, serif'}}
                    >
                      Grow your collector base, effortlessly.
                    </h1>
                    <p className="text-base font-sans text-black mb-4 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                      You represent talented artists whose work deserves the right eyes, not to be buried in costly online art platforms or drowned beneath larger gallery budgets. Kaleidorium helps collectors who already love your artists' styles finally find them.
                    </p>
                    <p className="text-sm font-sans text-black mb-3" style={{fontFamily: 'Arial, sans-serif'}}>
                      We're not a gallery, marketplace, or agent.
                    </p>
                    <p className="text-sm font-sans text-black mb-6" style={{fontFamily: 'Arial, sans-serif'}}>
                      We're a discovery engine built to expand your collector base, quietly, effectively, and without fees.
                    </p>
                    
                    {/* CTA Button */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        onClick={() => document.getElementById('gallery-form')?.scrollIntoView({ behavior: 'smooth' })}
                        className="bg-black text-white hover:bg-gray-800 px-6 py-2 text-sm font-medium"
                        style={{fontFamily: 'Arial, sans-serif'}}
                      >
                        Join the first 50 partner galleries
                      </Button>
                    </div>
                  </div>
                  
                  {/* Right Column - Compact Artwork Grid */}
                  <div className="relative">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <p className="text-sm font-sans text-gray-600 text-center mb-4" style={{fontFamily: 'Arial, sans-serif'}}>
                        Your artists find their perfect audience
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

            {/* How It Works Section */}
            <div id="how-it-works" className="py-12 bg-white">
              <div className="container mx-auto px-4 max-w-5xl">
                <h2 
                  className="text-xl font-serif font-bold text-black text-center mb-8"
                  style={{fontFamily: 'Times New Roman, serif'}}
                >
                  How It Works
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  {/* Step 1 */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h3 className="text-base font-sans font-bold text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                      Create profiles for your artists
                    </h3>
                    <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                      Add a picture of each artwork and a link to your gallery site or artist page. That's all you need to get started.
                    </p>
                  </div>
                  
                  {/* Step 2 */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-sans font-bold text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                      AI matches them with collectors
                    </h3>
                    <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                      Our algorithm analyzes visual signatures, subject, composition, palette, style, etc… and surfaces your artists' work to collectors most likely to appreciate it.
                    </p>
                  </div>
                  
                  {/* Step 3 */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                    <h3 className="text-base font-sans font-bold text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                      Receive qualified interest directly
                    </h3>
                    <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                      Collectors who like an artwork are redirected straight to your gallery website or contact page. We do not handle communication or transactions.
                    </p>
                  </div>
                  
                  {/* Step 4 */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-sans font-bold text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                      Track performance
                    </h3>
                    <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                      See how often your artists' work is viewed, liked, and clicked, insights you can use for curation, pricing, and promotion.
                    </p>
                  </div>
                  
                  {/* Step 5 */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <h3 className="text-base font-sans font-bold text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                      Let us onboard your whole roster
                    </h3>
                    <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                      If you represent many artists, we'll import their portfolios directly for you. Just reach out.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Partner Gallery Benefits Section */}
            <div className="py-12 bg-gray-50">
              <div className="container mx-auto px-4 max-w-4xl">
                <h2 
                  className="text-xl font-serif font-bold text-black text-center mb-6"
                  style={{fontFamily: 'Times New Roman, serif'}}
                >
                  Partner Gallery Benefits
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <span className="text-black mr-3 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>✓</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      Qualified leads straight to your gallery website or sales channels
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-black mr-3 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>✓</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      No fees, no commissions during Beta phase (see pricing)
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-black mr-3 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>✓</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      Priority placement during beta
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-black mr-3 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>✓</span>
                    <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                      Support for multi-artist galleries
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Get Started Section */}
            <div className="py-12 bg-white">
              <div className="container mx-auto px-4 max-w-4xl">
                <h2 
                  className="text-xl font-serif font-bold text-black text-center mb-4"
                  style={{fontFamily: 'Times New Roman, serif'}}
                >
                  Get Started
                </h2>
                <div className="space-y-3 text-center mb-8">
                  <p className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                    Submit your gallery details and which artists you would like to list
                  </p>
                  <p className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                    We review your submission
                  </p>
                  <p className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                    If selected, your gallery receives early access and onboarding support
                  </p>
                </div>
              </div>
            </div>

            {/* Gallery Submission Form */}
            <div id="gallery-form" className="py-12 bg-gray-50">
              <div className="container mx-auto px-4 max-w-2xl">
                <div className="text-center mb-8">
                  <h2 
                    className="text-xl font-serif font-bold text-black mb-3"
                    style={{fontFamily: 'Times New Roman, serif'}}
                  >
                    Join the first 50 partner galleries
                  </h2>
                  <p className="text-base font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                    Submit Your Gallery
                  </p>
                </div>
                <ForGalleriesForm />
              </div>
            </div>

            {/* Invitation Section */}
            <div className="py-12 bg-white">
              <div className="container mx-auto px-4 max-w-4xl text-center">
                <h2 
                  className="text-xl font-serif font-bold text-black mb-4"
                  style={{fontFamily: 'Times New Roman, serif'}}
                >
                  Have you received your invitation?
                </h2>
                <p className="text-base font-sans text-black mb-6 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                  If you've received an invitation email with a token, click below to register.
                </p>
                <Button
                  onClick={() => router.push('/for-galleries/register')}
                  className="bg-black text-white hover:bg-gray-800 px-8 py-2 text-sm font-medium"
                  style={{fontFamily: 'Arial, sans-serif'}}
                >
                  Register as a Gallery
                </Button>
                <p className="text-sm font-sans text-gray-600 mt-4" style={{fontFamily: 'Arial, sans-serif'}}>
                  Note: You'll need both your email address and the invitation token we sent you to complete registration.
                </p>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="py-12 bg-white">
              <div className="container mx-auto px-4 max-w-4xl">
                <GalleryFAQ />
              </div>
            </div>
          </div>
            ) : (
              // Desktop FOR GALLERIES content
              <>
                {/* Hero Section */}
                <div className="bg-gradient-to-br from-gray-50 to-white py-12">
                  <div className="container mx-auto px-4 max-w-5xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                      {/* Left Column - Text */}
                      <div className="lg:pr-8">
                        <h1 
                          className="text-2xl lg:text-3xl font-serif font-bold text-black mb-4"
                          style={{fontFamily: 'Times New Roman, serif'}}
                        >
                          Grow your collector base, effortlessly.
                        </h1>
                        <p className="text-base font-sans text-black mb-4 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                          You represent talented artists whose work deserves the right eyes, not to be buried in costly online art platforms or drowned beneath larger gallery budgets. Kaleidorium helps collectors who already love your artists' styles finally find them.
                        </p>
                        <p className="text-sm font-sans text-black mb-3" style={{fontFamily: 'Arial, sans-serif'}}>
                          We're not a gallery, marketplace, or agent.
                        </p>
                        <p className="text-sm font-sans text-black mb-6" style={{fontFamily: 'Arial, sans-serif'}}>
                          We're a discovery engine built to expand your collector base, quietly, effectively, and without fees.
                        </p>
                        
                        {/* CTA Button */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button 
                            onClick={() => document.getElementById('gallery-form')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-black text-white hover:bg-gray-800 px-6 py-2 text-sm font-medium"
                            style={{fontFamily: 'Arial, sans-serif'}}
                          >
                            Join the first 50 partner galleries
                          </Button>
                        </div>
                      </div>
                      
                      {/* Right Column - Compact Artwork Grid */}
                      <div className="relative">
                        <div className="bg-gray-100 rounded-lg p-4">
                          <p className="text-sm font-sans text-gray-600 text-center mb-4" style={{fontFamily: 'Arial, sans-serif'}}>
                            Your artists find their perfect audience
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

                {/* How It Works Section */}
                <div id="how-it-works" className="py-12 bg-white">
                  <div className="container mx-auto px-4 max-w-5xl">
                    <h2 
                      className="text-xl font-serif font-bold text-black text-center mb-8"
                      style={{fontFamily: 'Times New Roman, serif'}}
                    >
                      How It Works
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                      {/* Step 1 */}
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                          <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <h3 className="text-base font-sans font-bold text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                          Create profiles for your artists
                        </h3>
                        <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                          Add a picture of each artwork and a link to your gallery site or artist page. That's all you need to get started.
                        </p>
                      </div>
                      
                      {/* Step 2 */}
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                          <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <h3 className="text-base font-sans font-bold text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                          AI matches them with collectors
                        </h3>
                        <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                          Our algorithm analyzes visual signatures, subject, composition, palette, style, etc… and surfaces your artists' work to collectors most likely to appreciate it.
                        </p>
                      </div>
                      
                      {/* Step 3 */}
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                          <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                        <h3 className="text-base font-sans font-bold text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                          Receive qualified interest directly
                        </h3>
                        <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                          Collectors who like an artwork are redirected straight to your gallery website or contact page. We do not handle communication or transactions.
                        </p>
                      </div>
                      
                      {/* Step 4 */}
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                          <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h3 className="text-base font-sans font-bold text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                          Track performance
                        </h3>
                        <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                          See how often your artists' work is viewed, liked, and clicked, insights you can use for curation, pricing, and promotion.
                        </p>
                      </div>
                      
                      {/* Step 5 */}
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                          <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <h3 className="text-base font-sans font-bold text-black mb-2" style={{fontFamily: 'Arial, sans-serif'}}>
                          Let us onboard your whole roster
                        </h3>
                        <p className="text-xs font-sans text-gray-600 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                          If you represent many artists, we'll import their portfolios directly for you. Just reach out.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Partner Gallery Benefits Section */}
                <div className="py-12 bg-gray-50">
                  <div className="container mx-auto px-4 max-w-4xl">
                    <h2 
                      className="text-xl font-serif font-bold text-black text-center mb-6"
                      style={{fontFamily: 'Times New Roman, serif'}}
                    >
                      Partner Gallery Benefits
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start">
                        <span className="text-black mr-3 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>✓</span>
                        <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                          Qualified leads straight to your gallery website or sales channels
                        </span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-black mr-3 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>✓</span>
                        <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                          No fees, no commissions during Beta phase (see pricing)
                        </span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-black mr-3 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>✓</span>
                        <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                          Priority placement during beta
                        </span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-black mr-3 flex-shrink-0 mt-1" style={{fontFamily: 'Arial, sans-serif'}}>✓</span>
                        <span className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                          Support for multi-artist galleries
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Get Started Section */}
                <div className="py-12 bg-white">
                  <div className="container mx-auto px-4 max-w-4xl">
                    <h2 
                      className="text-xl font-serif font-bold text-black text-center mb-4"
                      style={{fontFamily: 'Times New Roman, serif'}}
                    >
                      Get Started
                    </h2>
                    <div className="space-y-3 text-center mb-8">
                      <p className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                        Submit your gallery details and which artists you would like to list
                      </p>
                      <p className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                        We review your submission
                      </p>
                      <p className="text-sm font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                        If selected, your gallery receives early access and onboarding support
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gallery Submission Form */}
                <div id="gallery-form" className="py-12 bg-gray-50">
                  <div className="container mx-auto px-4 max-w-2xl">
                    <div className="text-center mb-8">
                      <h2 
                        className="text-xl font-serif font-bold text-black mb-3"
                        style={{fontFamily: 'Times New Roman, serif'}}
                      >
                        Join the first 50 partner galleries
                      </h2>
                      <p className="text-base font-sans text-black" style={{fontFamily: 'Arial, sans-serif'}}>
                        Submit Your Gallery
                      </p>
                    </div>
                    <ForGalleriesForm />
                  </div>
                </div>

                {/* Invitation Section */}
                <div className="py-12 bg-white">
                  <div className="container mx-auto px-4 max-w-4xl text-center">
                    <h2 
                      className="text-xl font-serif font-bold text-black mb-4"
                      style={{fontFamily: 'Times New Roman, serif'}}
                    >
                      Have you received your invitation?
                    </h2>
                    <p className="text-base font-sans text-black mb-6 leading-relaxed" style={{fontFamily: 'Arial, sans-serif'}}>
                      If you've received an invitation email with a token, click below to register.
                    </p>
                    <Button
                      onClick={() => router.push('/for-galleries/register')}
                      className="bg-black text-white hover:bg-gray-800 px-8 py-2 text-sm font-medium"
                      style={{fontFamily: 'Arial, sans-serif'}}
                    >
                      Register as a Gallery
                    </Button>
                    <p className="text-sm font-sans text-gray-600 mt-4" style={{fontFamily: 'Arial, sans-serif'}}>
                      Note: You'll need both your email address and the invitation token we sent you to complete registration.
                    </p>
                  </div>
                </div>

                {/* FAQ Section */}
                <div className="py-12 bg-white">
                  <div className="container mx-auto px-4 max-w-4xl">
                    <GalleryFAQ />
                  </div>
                </div>
              </>
            )}
          </div>
        );
      
      case "about":
        return (
          <div className="flex-1 overflow-y-auto">
            {isMobile ? (
              <div>
                <AboutContent setView={setView} />
              </div>
            ) : (
              <AboutContent setView={setView} />
            )}
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
      
      case "pricing":
        return (
          <div className="flex-1 overflow-y-auto">
            <PricingContent />
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
                  className="text-gray-600 hover:text-gray-900 h-10 w-10"
                >
                  <X className="w-6 h-6" />
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
                  className="text-gray-600 hover:text-gray-900 h-10 w-10"
                >
                  <X className="w-6 h-6" />
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

  const mobileContentPadding = isMobile
    ? {
        paddingTop: 'calc(96px + env(safe-area-inset-top))',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
      }
    : {};

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {renderHeader()}
      <main
        className="flex-1 flex flex-col"
        style={mobileContentPadding}
      >
        {renderContent()}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

