"use client";

import React, { useState, useEffect } from "react";

const COOKIE_KEY = "cookieConsent";

const defaultPrefs = {
  analytics: true,
  functionality: true,
  targeting: true,
};

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [prefs, setPrefs] = useState(defaultPrefs);

  useEffect(() => {
    const saved = localStorage.getItem(COOKIE_KEY);
    if (!saved) setShow(true);
  }, []);

  const handleToggle = (key: keyof typeof defaultPrefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const savePrefs = (prefsToSave: typeof defaultPrefs) => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify(prefsToSave));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-2">Cookie Policy</h2>
        <p className="mb-4 text-sm">
          We use cookies and similar technologies (e.g., pixel tags) to recognize your browser or device, remember your preferences, analyze traffic, and improve our services.
        </p>
        <div className="mb-4">
          <div className="font-medium mb-1">Types of cookies we use:</div>
          <ul className="text-sm mb-2 list-disc pl-5">
            <li><b>Strictly Necessary Cookies:</b> These are essential for using our site (e.g., authentication). <span className="text-green-600">Always enabled</span></li>
            <li>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={prefs.analytics} onChange={() => handleToggle("analytics")}/>
                <span><b>Analytics Cookies:</b> Help us understand user behavior via tools like Google Analytics or Supabase logs.</span>
              </label>
            </li>
            <li>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={prefs.functionality} onChange={() => handleToggle("functionality")}/>
                <span><b>Functionality Cookies:</b> Remember your choices (e.g., language).</span>
              </label>
            </li>
            <li>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={prefs.targeting} onChange={() => handleToggle("targeting")}/>
                <span><b>Targeting Cookies:</b> May be used by marketing partners if applicable.</span>
              </label>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground mb-2">
            You can manage your preferences via your browser settings or our cookie consent tool. By continuing to use our site, you consent to our use of cookies in accordance with this policy.
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <button className="px-3 py-2 rounded bg-gray-200" onClick={() => { savePrefs({ analytics: false, functionality: false, targeting: false }); }}>Reject All</button>
          <button className="px-3 py-2 rounded bg-primary text-white" onClick={() => { savePrefs({ analytics: true, functionality: true, targeting: true }); }}>Accept All</button>
          <button className="px-3 py-2 rounded bg-black text-white" onClick={() => savePrefs(prefs)}>Save Preferences</button>
        </div>
      </div>
    </div>
  );
} 