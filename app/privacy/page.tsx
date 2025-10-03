"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NewMobileHeader } from "@/components/new-mobile-header";
import { DesktopHeader } from "@/components/desktop-header";

export default function PrivacyPage() {
  const [collectionCount, setCollectionCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {/* Conditional header rendering */}
      {isMobile ? (
        <NewMobileHeader currentPage="privacy" collectionCount={collectionCount} setView={() => {}} />
      ) : (
        <DesktopHeader currentPage={"privacy" as any} collectionCount={collectionCount} setView={() => {}} />
      )}
      <div className="container mx-auto px-4 pt-20 pb-16 max-w-3xl">
      <h1 className="font-serif text-2xl font-semibold mb-6">Privacy Policy & Data Protection</h1>
      <p className="text-sm mb-2">Updated on 1st of July 2025</p>
      <h2 className="font-bold mt-6 mb-2">1. Introduction</h2>
      <p>Kaleidorium is a service developed and operated by Hypehack Pte Ltd (the "Company"), a private limited liability company incorporated in Singapore.</p>
      <p>This privacy policy ("Policy") informs you of your choices and our practices in relation to your personal data (as defined below). In this Policy, "we" or "us" refers to Hypehack Pte Ltd (the "Company"), a private limited liability company incorporated in Singapore. We are the data controller under the Singapore Personal Data Protection Act (PDPA) and applicable privacy laws.</p>
      <p>Please read this Privacy Policy carefully to make sure you understand it. By using our Kaleidorium service, you are automatically deemed to agree to accept and be legally bound by this policy. You should read our Terms Of Kaleidorium service too which explains the terms and conditions under which we offer you access to our Kaleidorium service. For the avoidance of doubt, if you do not agree with the Privacy Policy herein or with our Terms Of Kaleidorium service, you should not proceed to register, access or use our Kaleidorium service.</p>
      <h2 className="font-bold mt-6 mb-2">2. Data Protection Officer (DPO)</h2>
      <p>At any time, you can contact us at <a href="mailto:kurator@kaleidorium.com" className="underline">kurator@kaleidorium.com</a> for any personal data protection queries.</p>
      <h2 className="font-bold mt-6 mb-2">3. Minors</h2>
      <p>Our services are not available for use by children and are intended for persons over the age of 18 years old. We do not intentionally gather personal data from visitors who are under the age of 18. Our Terms of Kaleidorium service require all users to be at least 18 years old. If a minor submits personal data to us and we learn that the personal data is the information of a user under 18, we will attempt to delete the information as soon as possible.</p>
      <h2 className="font-bold mt-6 mb-2">4. Types of Data We Collect</h2>
      <h3 className="font-semibold mt-4 mb-2">4.1. Personal data you provide to us upon Registration</h3>
      <ul className="list-disc ml-6 mb-2 text-sm">
        <li>First name</li>
        <li>Surname</li>
        <li>Your timezone and the country you are located in</li>
        <li>A picture for your profile</li>
        <li>Your email address</li>
        <li>A Username of your choice</li>
        <li>A Password</li>
        <li>Tags that are words you choose to tell us the type of artwork you enjoy</li>
        <li>Whether you agree to receive messages and correspondences from us, including newsletters</li>
        <li>If you register as an artist, in addition to the above we will collect and store the picture of the artwork you provided as well as the description, price and artwork URL you provided</li>
      </ul>
      <h3 className="font-semibold mt-4 mb-2">4.2. Personal data collected via usage of our Kaleidorium service & Technology</h3>
      <ul className="list-disc ml-6 mb-2 text-sm">
        <li>What artwork you thumbed up or down</li>
        <li>The type of artwork you search for using our filters</li>
        <li>The type of artwork you added to your Collection</li>
        <li>The type of artwork you viewed</li>
        <li>The type of artwork where you click the "View artwork" button</li>
        <li>Feedback or contact information you provide</li>
        <li>Other voluntarily provided data</li>
      </ul>
      <p>We also collect technical data such as browser type, operating system, IP address, mobile device ID, and date/time stamps. Log files and cookies are used to analyze trends, administer the service, and personalize your experience. We use pixel tags and analytics services (e.g., Google Analytics) to understand user behavior and improve our services.</p>
      <h3 className="font-semibold mt-4 mb-2">4.3. Personal data received from third parties</h3>
      <ul className="list-disc ml-6 mb-2 text-sm">
        <li>Analytics information from providers like Google Analytics</li>
        <li>Personal data from mobile measurement partners (e.g., IP address and location)</li>
      </ul>
      <h3 className="font-semibold mt-4 mb-2">4.4. Data we do NOT collect & Special Provision</h3>
      <ul className="list-disc ml-6 mb-2 text-sm">
        <li>We do not collect special categories of personal data (e.g., race, religion, health, etc.)</li>
        <li>We do not collect financial information (e.g., bank details, credit card info, wallet address)</li>
        <li>We do not collect personal identification documents unless required by law or for dispute resolution</li>
      </ul>
      <h2 className="font-bold mt-6 mb-2">5. How We Use Your Personal Information</h2>
      <p>We use your personal data only when the law allows us to, including to perform our services, for legitimate interests, to comply with legal obligations, or where you have opted in. Uses include:</p>
      <ul className="list-disc ml-6 mb-2 text-sm">
        <li>Account creation and security</li>
        <li>Identifying you as a user</li>
        <li>Providing and improving our services</li>
        <li>Customer support</li>
        <li>Investigating and addressing conduct that may violate our Terms</li>
        <li>Fraud detection and prevention</li>
        <li>Sending notifications and newsletters (if opted in)</li>
        <li>Complying with laws and cooperating with authorities</li>
        <li>Other purposes described at the time of data collection</li>
      </ul>
      <p>We may create anonymous data records for analysis and improvement of our services.</p>
      <h2 className="font-bold mt-6 mb-2">6. Disclosure of Personal Data</h2>
      <p>We may disclose your personal data to third-party service providers, affiliates, in corporate restructuring, to comply with legal obligations, or with your consent. Some processing is necessary for our or a third party's legitimate interests. We may collect and use information as necessary for our business purposes and as permitted by law.</p>
      <h2 className="font-bold mt-6 mb-2">7. Third Party Privacy Practices</h2>
      <p>If you access any service through a third-party (e.g., OpenSea.io), those services may collect information about you in accordance with their own terms and privacy policies. We are not responsible for third-party privacy practices.</p>
      <h2 className="font-bold mt-6 mb-2">8. Security</h2>
      <p>We use physical, administrative, and technological safeguards to protect your data. However, transmission over the internet is not completely secure. In the event of a breach, we will investigate and notify affected individuals as required by law.</p>
      <h2 className="font-bold mt-6 mb-2">9. Where We Process Your Personal Data</h2>
      <p>Your data may be processed by our employees and third-party service providers. We ensure adequate safeguards for international transfers, including to countries with adequate protection or via approved contracts.</p>
      <h2 className="font-bold mt-6 mb-2">10. Your Rights</h2>
      <p>Under certain circumstances, you have rights under data protection laws, including:</p>
      <ul className="list-disc ml-6 mb-2 text-sm">
        <li>Request access, correction, or erasure of your data</li>
        <li>Object to or restrict processing</li>
        <li>Request data transfer (portability)</li>
        <li>Withdraw consent</li>
      </ul>
      <p>To exercise your rights, email us at <a href="mailto:kurator@kaleidorium.com" className="underline">kurator@kaleidorium.com</a> with the subject "Data related question". We may need to verify your identity. We aim to respond within one month.</p>
      <h2 className="font-bold mt-6 mb-2">11. Contact and Complaints</h2>
      <p>Questions, comments, and requests regarding this Privacy Policy should be addressed to <a href="mailto:kurator@kaleidorium.com" className="underline">kurator@kaleidorium.com</a> or by mail to 24 Eastwood Drive, 486383 Singapore. We may need further information to verify your identity. We aim to respond to complaints within 30 days.</p>
      <h2 className="font-bold mt-6 mb-2">12. Changes to Privacy Policy</h2>
      <p>We can update and change this Privacy Policy from time to time. The most current version will be posted here. You may be invited to review and accept the revised Privacy Policy to continue using the Kaleidorium service. Please check this page regularly for updates.</p>
      <h2 className="font-bold mt-6 mb-2">13. Governing Law and Jurisdiction</h2>
      <p>This Agreement shall be governed by and construed in accordance with the laws of Singapore and you agree to submit to the exclusive jurisdiction of the Singapore courts.</p>
      <h2 className="font-bold mt-6 mb-2">14. EEA Users & International Transfers</h2>
      <p>If you are located in the European Economic Area (EEA), you have the right to lodge a complaint with your local data protection authority. If we transfer personal data outside the EEA, we ensure appropriate safeguards are in place, such as Standard Contractual Clauses or adequacy decisions.</p>
      <h2 className="font-bold mt-6 mb-2">15. Processors and Subprocessors</h2>
      <p>We engage third-party service providers ("Processors") to support the operation of the Kaleidorium service, including but not limited to data hosting (e.g., Supabase), analytics, AI functionality (e.g., OpenAI), email services, and subscription management. Where these vendors process personal data on our behalf, we enter into Data Processing Agreements (DPAs) that meet the requirements of Article 28 of the GDPR. A list of key vendors is available upon request. When required, personal data may be transferred outside the EEA under safeguards such as Standard Contractual Clauses or adequacy decisions.</p>
      <h2 className="font-bold mt-6 mb-2">16. Cookie Policy</h2>
      <p>We use cookies and similar technologies (e.g., pixel tags) to recognize your browser or device, remember your preferences, analyze traffic, and improve our services.</p>
      <ul className="list-disc ml-6 mb-2 text-sm">
        <li><b>Strictly Necessary Cookies:</b> Essential for using our site (e.g., authentication).</li>
        <li><b>Analytics Cookies:</b> Help us understand user behavior via tools like Google Analytics or Supabase logs.</li>
        <li><b>Functionality Cookies:</b> Remember your choices (e.g., language preferences).</li>
        <li><b>Targeting Cookies:</b> May be used by marketing partners if applicable.</li>
      </ul>
      <p>You can manage your preferences via your browser settings or our cookie consent tool. By continuing to use our site, you consent to our use of cookies in accordance with this policy.</p>
      </div>
    </>
  );
} 