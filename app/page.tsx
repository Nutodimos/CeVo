import Image from "next/image";
import Link from "next/link";
import { Shield, BarChart3, Users, Zap, CheckCircle2, Activity } from "lucide-react";

export default function RootPage() {
  return (
    <main className="min-h-screen bg-surface-50 overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
              CeVo
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="text-surface-600 hover:text-primary-600 font-medium transition-colors hidden sm:block">
              Contact Sales
            </Link>
            <Link href="/admin" className="btn-secondary text-sm px-4 py-2">
              Admin Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10 animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-extrabold text-surface-900 tracking-tight mb-8">
            Secure, Transparent, <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
              Seamless Elections.
            </span>
          </h1>
          <p className="text-xl text-surface-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            The modern platform for organizations to run trusted elections. 
            Real-time analytics, verifiable results, and an unparalleled voter experience.
          </p>
          <div className="flex justify-center mb-8 relative z-10">
            <Link href="/elections" className="btn-primary shadow-xl text-lg px-8 py-4">
              <span>View Active Elections</span>
            </Link>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-surface-500">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary-500"/> No app required</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary-500"/> End-to-end secure</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary-500"/> Real-time results</div>
          </div>
        </div>
      </section>

      {/* Showcases */}
      <section className="py-20 px-6 bg-white relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 animate-slide-down">
              <div className="glass-card p-2 rounded-2xl shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
                <Image 
                  src="/dashboard_mockup.jpg" 
                  alt="CeVo Dashboard Analytics" 
                  width={1200} 
                  height={675} 
                  className="rounded-xl w-full h-auto"
                />
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-6 animate-fade-in-up">
              <div className="inline-block p-3 bg-primary-50 rounded-xl mb-2">
                <BarChart3 className="w-6 h-6 text-primary-600" />
              </div>
              <h2 className="text-4xl font-bold text-surface-900">Powerful Analytics at your fingertips</h2>
              <p className="text-lg text-surface-600 leading-relaxed">
                Monitor turnout in real-time. Understand demographic participation and verify results instantly with our comprehensive dashboard designed for election administrators.
              </p>
              <Link href="/contact" className="btn-primary inline-flex mt-4">
                <span>Request a Demo</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-surface-50 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-surface-900 mb-4">Everything you need to run an election</h2>
            <p className="text-xl text-surface-600 max-w-2xl mx-auto">Built from the ground up for security, transparency, and ease of use.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 stagger-children">
            <div className="glass-card p-8">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-surface-900 mb-3">Bank-grade Security</h3>
              <p className="text-surface-600">Every vote is cryptographically secured ensuring tamper-proof results and voter privacy.</p>
            </div>
            <div className="glass-card p-8">
              <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-accent-600" />
              </div>
              <h3 className="text-xl font-bold text-surface-900 mb-3">Lightning Fast</h3>
              <p className="text-surface-600">Handle tens of thousands of concurrent voters without breaking a sweat. Real-time tallying.</p>
            </div>
            <div className="glass-card p-8">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-surface-900 mb-3">Voter Management</h3>
              <p className="text-surface-600">Easily import voter rolls, send secure email invites, and track participation status.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Showcase */}
      <section className="py-20 px-6 bg-primary-900 text-white relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold">A voter experience they'll love</h2>
              <p className="text-xl text-primary-200 leading-relaxed">
                No apps to download. Our mobile-first interface ensures voters can cast their ballot securely from any device in seconds. 
                Beautiful design encourages higher turnout.
              </p>
              <ul className="space-y-4 mt-8">
                <li className="flex items-center gap-3 text-lg"><CheckCircle2 className="text-accent-400" /> Intuitive candidate selection</li>
                <li className="flex items-center gap-3 text-lg"><CheckCircle2 className="text-accent-400" /> Clear digital receipts</li>
                <li className="flex items-center gap-3 text-lg"><CheckCircle2 className="text-accent-400" /> Fully accessible interface</li>
              </ul>
            </div>
            <div className="flex justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-t from-primary-900 via-transparent to-transparent z-10"></div>
              <div className="relative rounded-[2.5rem] border-8 border-surface-800 overflow-hidden shadow-2xl transform rotate-3">
                <Image 
                  src="/mobile_voting_mockup.jpg" 
                  alt="Mobile Voting Interface" 
                  width={300} 
                  height={600} 
                  className="w-auto h-[500px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-900 text-surface-400 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary-500" />
            <span className="text-xl font-bold text-white">CeVo</span>
          </div>
          <p>© {new Date().getFullYear()} CeVo. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
