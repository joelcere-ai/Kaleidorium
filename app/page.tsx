"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import ArtDiscovery from "@/components/art-discovery";
import { ProfilePage } from '@/components/profile-page';
import { AboutContent } from "@/components/about-content";
import { NewMobileHeader } from "@/components/new-mobile-header";
import { DesktopHeader } from "@/components/desktop-header";
import MobileCardStack from "@/components/mobile-card-stack";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft } from "lucide-react";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
import { useState as useStateContact } from "react";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile } = useMobileDetection();
  
  // Determine current view from search params
  const getCurrentView = (): "discover" | "collection" | "profile" | "for-artists" | "about" | "contact" => {
    const viewParam = searchParams.get("view");
    if (viewParam && ["collection", "profile", "for-artists", "about", "contact"].includes(viewParam)) {
      return viewParam as any;
    }
    return "discover";
  };
  
  const [view, setViewState] = useState<"discover" | "collection" | "profile" | "for-artists" | "about" | "contact">(getCurrentView());
  const [collectionCount, setCollectionCount] = useState(0);
  const [showApp, setShowApp] = useState(false);
  const [collection, setCollection] = useState<any[]>([]);

  // Update view when pathname changes
  useEffect(() => {
    const currentView = getCurrentView();
    if (currentView !== view) {
      setViewState(currentView);
    }
  }, [pathname, searchParams]);

  // Create a setView function that updates both state and URL
  const setView = (newView: "discover" | "collection" | "profile" | "for-artists" | "about" | "contact") => {
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
        const savedCollection = localStorage.getItem('artwork-collection');
        if (savedCollection) {
          const parsedCollection = JSON.parse(savedCollection);
          setCollection(parsedCollection);
          setCollectionCount(parsedCollection.length);
        }
      } catch (error) {
        console.error('Error loading collection:', error);
      }
    };
    
    loadCollection();
  }, []);

  // Show app immediately - no loading delay
  useEffect(() => {
    setShowApp(true);
  }, []);

  // Collection management functions
  const handleRemoveFromCollection = (id: string) => {
    const updatedCollection = collection.filter(item => item.id !== id);
    setCollection(updatedCollection);
    setCollectionCount(updatedCollection.length);
    localStorage.setItem('artwork-collection', JSON.stringify(updatedCollection));
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          {isMobile ? (
            <>
              <h1 className="text-3xl font-bold text-white mb-2">Kaleidorium</h1>
              <p className="text-lg text-white mb-4">Your Personal Art Curator</p>
              <div className="text-white text-xl">Loading Artwork...</div>
            </>
          ) : (
            <div className="text-white text-xl">Loading Artwork...</div>
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
        return <ArtDiscovery view="discover" setView={setView} collectionCount={collectionCount} setCollectionCount={setCollectionCount} />;
      
      case "collection":
        return (
          <div className="flex-1 overflow-y-auto pt-20">
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
                <div className="flex items-center justify-between mb-6">
                  <Button
                    variant="ghost"
                    onClick={() => setView("discover")}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Discovery
                  </Button>
                  <h1 className="text-2xl font-bold">My Collection ({collectionCount})</h1>
                </div>
                
                {collection.length === 0 ? (
                  <Card className="p-8 text-center">
                    <CardContent>
                      <Heart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold mb-2">Your collection is empty</h3>
                      <p className="text-gray-600 mb-4">Start discovering artwork to build your collection</p>
                      <Button onClick={() => setView("discover")}>
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
                            src={artwork.imageUrl}
                            alt={artwork.title}
                            className="w-full h-64 object-cover"
                          />
                          <div className="p-4">
                            <h3 className="font-semibold mb-1">{artwork.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{artwork.artist}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveFromCollection(artwork.id)}
                              className="w-full"
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
          <div className="flex-1 overflow-y-auto pt-20">
            <ProfilePage collection={collection} onReturnToDiscover={() => setView("discover")} />
          </div>
        );
      
      case "for-artists":
        return (
          <div className="flex-1 overflow-y-auto pt-20">
            <div className="container mx-auto px-4 py-8">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">For Artists</h1>
                
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Join Our Platform</h2>
                    <p className="text-gray-600 mb-6">
                      Share your artwork with collectors worldwide and get discovered by art enthusiasts.
                    </p>
                    <Button 
                      onClick={() => window.location.href = '/for-artists/register'}
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      Register as Artist
                    </Button>
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Why Choose Us?</h2>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Global reach to art collectors</li>
                      <li>• Professional portfolio presentation</li>
                      <li>• Direct communication with buyers</li>
                      <li>• No listing fees</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-8 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">How do I get started?</h4>
                      <p className="text-gray-600">Simply register as an artist and upload your artwork with descriptions and pricing.</p>
                    </div>
                    <div>
                      <h4 className="font-medium">What types of artwork are accepted?</h4>
                      <p className="text-gray-600">We accept all forms of visual art including paintings, sculptures, digital art, and photography.</p>
                    </div>
                    <div>
                      <h4 className="font-medium">How do I receive payments?</h4>
                      <p className="text-gray-600">We facilitate secure transactions between artists and collectors through our platform.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case "about":
        return (
          <div className="flex-1 overflow-y-auto pt-20">
            <AboutContent setView={setView} />
          </div>
        );
      
      case "contact":
        return (
          <div className="flex-1 overflow-y-auto pt-20">
            <div className="container mx-auto px-4 py-8">
              <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Contact Us</h1>
                <ContactForm />
              </div>
            </div>
          </div>
        );
      
      default:
        return <ArtDiscovery view="discover" setView={setView} collectionCount={collectionCount} setCollectionCount={setCollectionCount} />;
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl">Loading Artwork...</div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

