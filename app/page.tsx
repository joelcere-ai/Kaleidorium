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
                <div className="mb-6">
                  <Button variant="ghost" onClick={() => setView("discover")} style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Discovery
                  </Button>
                </div>

                <div className="mb-6">
                  <h1 className="text-base font-serif font-bold text-black mb-2" style={{fontSize: '14px', fontFamily: 'Times New Roman, serif'}}>My Collection ({collectionCount})</h1>
                </div>

                {collection.length === 0 ? (
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
                            src={artwork.imageUrl}
                            alt={artwork.title}
                            className="w-full h-64 object-cover"
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
          <div className="flex-1 overflow-y-auto pt-20">
            <ProfilePage collection={collection} onReturnToDiscover={() => setView("discover")} />
          </div>
        );
      
      case "for-artists":
        return (
          <div className="flex-1 overflow-y-auto pt-20">
            <div className="container mx-auto px-4 py-4 max-w-3xl" data-view="for-artists">
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
          <div className="flex-1 overflow-y-auto pt-20">
            <AboutContent setView={setView} />
          </div>
        );
      
      case "contact":
        return (
          <div className="flex-1 overflow-y-auto pt-20">
            <div className="container mx-auto px-4 pt-20 pb-16 max-w-lg">
              <ContactForm />
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

