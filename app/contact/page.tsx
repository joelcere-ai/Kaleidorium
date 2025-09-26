"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";

export default function ContactPage() {
  const [view, setView] = useState<"discover" | "collection" | "profile" | "for-artists" | "about" | "contact">("contact");
  const [collectionCount, setCollectionCount] = useState(0);
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleNavigate = (nextView: typeof view) => {
    if (nextView === "contact") return;
    router.push(`/?view=${nextView}`, { scroll: false });
  };

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
        setStatus("Your message has been sent. Thank you!");
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
    <div>
      <AppHeader view={view} setView={handleNavigate} collectionCount={collectionCount} />
      <div className="container mx-auto px-4 py-12 max-w-lg">
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
        </form>
        {status && <div className="mt-4 text-center text-blue-700" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>{status}</div>}
      </div>
    </div>
  );
} 