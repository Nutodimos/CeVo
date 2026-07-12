"use client";
import toast from 'react-hot-toast';

import { useState, useEffect } from "react";
import { Copy, QrCode, Check } from "lucide-react";
import QRCode from "qrcode";

export default function VoterLinkCard({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const [eligibilityCopied, setEligibilityCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const baseUrl = mounted ? window.location.origin : "https://cevo.app";
  const voterUrl = `${baseUrl}/e/${slug}`;
  const eligibilityUrl = `${baseUrl}/e/${slug}/check`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(voterUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyEligibility = async () => {
    try {
      await navigator.clipboard.writeText(eligibilityUrl);
      setEligibilityCopied(true);
      setTimeout(() => setEligibilityCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownloadQR = async () => {
    try {
      const qrDataUrl = await QRCode.toDataURL(voterUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: "#0F172A",
          light: "#FFFFFF"
        }
      });
      const a = document.createElement("a");
      a.href = qrDataUrl;
      a.download = `${slug}-voter-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to generate QR code:", err);
      toast.error("Failed to generate QR code");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 mb-8">
      <h3 className="text-lg font-semibold text-surface-900 mb-4">Election Links</h3>
      
      <div className="space-y-6">
        {/* Main Voter Link */}
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-2">Main Voting Portal</label>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="flex-1 bg-surface-50 border border-surface-200 rounded-lg px-4 py-3 font-mono text-sm text-surface-900 overflow-x-auto whitespace-nowrap">
              {voterUrl}
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={handleCopy}
                className="btn-secondary py-2 flex items-center justify-center gap-2 min-w-[120px]"
              >
                {copied ? (
                  <><Check className="w-4 h-4 text-emerald-500" /> Copied ✓</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy Link</>
                )}
              </button>
              
              <button 
                onClick={handleDownloadQR}
                className="btn-primary py-2 flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" /> Download QR
              </button>
            </div>
          </div>
          <p className="text-sm text-surface-500 mt-2">
            Share this link or QR code with voters to cast their ballots. The same link shows results once voting ends.
          </p>
        </div>

        {/* Eligibility Check Link */}
        <div className="pt-4 border-t border-surface-100">
          <label className="block text-sm font-medium text-surface-700 mb-2">Pre-Election Eligibility Check</label>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="flex-1 bg-surface-50 border border-surface-200 rounded-lg px-4 py-3 font-mono text-sm text-surface-900 overflow-x-auto whitespace-nowrap">
              {eligibilityUrl}
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={handleCopyEligibility}
                className="btn-secondary py-2 flex items-center justify-center gap-2 min-w-[120px]"
              >
                {eligibilityCopied ? (
                  <><Check className="w-4 h-4 text-emerald-500" /> Copied ✓</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy Link</>
                )}
              </button>
            </div>
          </div>
          <p className="text-sm text-surface-500 mt-2">
            Share this link so students can verify their matriculation number is on the voter roll before voting opens.
          </p>
        </div>
      </div>
    </div>
  );
}
