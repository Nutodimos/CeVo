"use client";

import Link from "next/link";
import { Shield, ArrowLeft, Mail, Building, User, Activity, Loader2 } from "lucide-react";
import { submitContactForm } from "@/app/actions/contact";
import { toast } from "react-hot-toast";
import { useTransition } from "react";

export default function ContactPage() {
  const [isPending, startTransition] = useTransition();

  const handleAction = async (formData: FormData) => {
    startTransition(async () => {
      const result = await submitContactForm(formData);
      if (result.success) {
        toast.success("Message sent successfully! We'll be in touch soon.");
        // Optional: clear form by resetting it if needed, but since it's a contact page it's fine.
      } else {
        toast.error(result.error || "Failed to send message.");
      }
    });
  };

  return (
    <main className="min-h-screen bg-surface-50 flex flex-col relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-y-1/2 -translate-x-1/2"></div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20 group-hover:bg-primary-500 transition-colors">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
              CeVo
            </span>
          </Link>
          <Link href="/" className="text-surface-600 hover:text-primary-600 flex items-center gap-2 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 pt-24 pb-12 relative z-10">
        <div className="w-full max-w-lg animate-fade-in-up">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-surface-900 mb-4">Talk to Sales</h1>
            <p className="text-surface-600 text-lg">
              Ready to modernize your elections? Fill out the form below and our team will get in touch shortly.
            </p>
          </div>

          <div className="glass-card p-8 shadow-2xl">
            <form action={handleAction} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-surface-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 w-5 h-5" />
                    <input 
                      type="text" 
                      name="name"
                      placeholder="Jane Doe" 
                      className="input-field pl-12"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-surface-700 mb-1">Work Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 w-5 h-5" />
                    <input 
                      type="email" 
                      name="email"
                      placeholder="jane@organization.org" 
                      className="input-field pl-12"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-surface-700 mb-1">Organization Name</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 w-5 h-5" />
                    <input 
                      type="text" 
                      name="organization"
                      placeholder="Student Association" 
                      className="input-field pl-12"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-surface-700 mb-1">How can we help?</label>
                  <textarea 
                    name="message"
                    rows={4}
                    placeholder="Tell us about your election needs, estimated voter count, and timeline..." 
                    className="input-field resize-none"
                    required
                  ></textarea>
                </div>
              </div>

              <button type="submit" disabled={isPending} className="btn-primary w-full shadow-lg hover:shadow-xl">
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Send Message</span>}
              </button>
            </form>
          </div>
          
          <p className="text-center text-sm text-surface-500 mt-6">
            By submitting this form, you agree to our privacy policy and terms of service.
          </p>
        </div>
      </div>
    </main>
  );
}
