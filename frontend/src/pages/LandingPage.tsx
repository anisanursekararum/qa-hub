import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Zap, Shield, Sparkles } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const LandingPage = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] text-[#161616] dark:text-[#F4F4F4] transition-colors duration-300 font-sans selection:bg-[#0F62FE] selection:text-white">
      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 border-b border-[#E0E0E0] dark:border-[#2D2D39] bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <img src="/qa-hub-logo.png" alt="QA-Hub Logo" className="w-10 h-10 rounded-[4px] object-contain bg-white" />
            <span className="font-sans font-black text-xl tracking-tight">
              QA<span className="text-[#0F62FE]">-Hub</span>
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <ThemeToggle />
            <button 
              onClick={() => navigate('/login')} 
              className="text-sm font-semibold hover:text-[#0F62FE] transition-colors"
            >
              Log in
            </button>
            <button 
              onClick={() => navigate('/signup')} 
              className="bg-[#0F62FE] hover:bg-[#0353E9] text-white text-sm font-semibold px-5 py-2 rounded-[4px] transition-colors shadow-lg shadow-[#0F62FE]/20"
            >
              Sign up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center space-x-2 bg-[#F4F4F4] dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] px-3 py-1.5 rounded-full">
              <Sparkles size={14} className="text-[#8A3FFC]" />
              <span className="text-xs font-semibold">Introducing QA-Hub Core 1.0</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
              Test management, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0F62FE] to-[#8A3FFC]">reimagined.</span>
            </h1>
            <p className="text-lg md:text-xl text-[#525252] dark:text-[#A8A8A8] max-w-2xl leading-relaxed">
              Elevate your software quality with our enterprise-grade orchestration platform. Seamlessly combine manual curation, automated execution, and AI-driven insights in one powerful workspace.
            </p>
            <div className="flex items-center space-x-4 pt-4">
              <button 
                onClick={() => navigate('/signup')}
                className="bg-[#161616] dark:bg-white text-white dark:text-[#161616] text-base font-semibold px-8 py-3.5 rounded-[4px] hover:bg-[#393939] dark:hover:bg-[#E0E0E0] transition-colors flex items-center space-x-2"
              >
                <span>Get Started for Free</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
          <div className="flex-1 w-full animate-in fade-in slide-in-from-right-8 duration-700 delay-150">
            <div className="relative rounded-[8px] overflow-hidden border border-[#E0E0E0] dark:border-[#2D2D39] shadow-2xl shadow-[#0F62FE]/10 bg-[#F4F4F4] dark:bg-[#161616]">
               <div className="h-8 border-b border-[#E0E0E0] dark:border-[#2D2D39] bg-white dark:bg-[#1C1C21] flex items-center px-4 space-x-2">
                 <div className="w-3 h-3 rounded-full bg-[#DA1E28]"></div>
                 <div className="w-3 h-3 rounded-full bg-[#F1C21B]"></div>
                 <div className="w-3 h-3 rounded-full bg-[#24A148]"></div>
               </div>
               <div className="p-8 aspect-video flex flex-col justify-center items-center bg-gradient-to-br from-[#F4F4F4] to-white dark:from-[#121212] dark:to-[#1C1C21]">
                 {/* Abstract UI representation */}
                 <div className="w-full max-w-md bg-white dark:bg-[#2D2D39] rounded-[4px] shadow-sm border border-[#E0E0E0] dark:border-[#393939] p-4 mb-4">
                    <div className="h-4 w-1/3 bg-[#E0E0E0] dark:bg-[#525252] rounded-[2px] mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-[#F4F4F4] dark:bg-[#1C1C21] rounded-[2px]"></div>
                      <div className="h-2 w-5/6 bg-[#F4F4F4] dark:bg-[#1C1C21] rounded-[2px]"></div>
                      <div className="h-2 w-4/6 bg-[#F4F4F4] dark:bg-[#1C1C21] rounded-[2px]"></div>
                    </div>
                 </div>
                 <div className="w-full max-w-md flex space-x-4">
                    <div className="flex-1 bg-[#0F62FE]/10 border border-[#0F62FE]/20 rounded-[4px] p-4 flex items-center justify-center">
                      <span className="font-mono text-xs font-bold text-[#0F62FE]">89% COVERAGE</span>
                    </div>
                    <div className="flex-1 bg-[#24A148]/10 border border-[#24A148]/20 rounded-[4px] p-4 flex items-center justify-center">
                      <span className="font-mono text-xs font-bold text-[#24A148]">0 DEFECTS</span>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="bg-[#F4F4F4] dark:bg-[#121212] py-24 border-y border-[#E0E0E0] dark:border-[#2D2D39]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white dark:bg-[#1C1C21] rounded-full flex items-center justify-center shadow-sm border border-[#E0E0E0] dark:border-[#393939]">
              <CheckCircle className="text-[#24A148]" size={24} />
            </div>
            <h3 className="text-xl font-bold">Uncompromising Quality</h3>
            <p className="text-[#525252] dark:text-[#A8A8A8] leading-relaxed">
              Design meticulous test cases and organize them into robust modules. Establish a single source of truth for your QA efforts.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white dark:bg-[#1C1C21] rounded-full flex items-center justify-center shadow-sm border border-[#E0E0E0] dark:border-[#393939]">
              <Zap className="text-[#0F62FE]" size={24} />
            </div>
            <h3 className="text-xl font-bold">Flawless Execution</h3>
            <p className="text-[#525252] dark:text-[#A8A8A8] leading-relaxed">
              Run manual and automated tests side-by-side. Our real-time telemetry stream keeps you updated on every automation step.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white dark:bg-[#1C1C21] rounded-full flex items-center justify-center shadow-sm border border-[#E0E0E0] dark:border-[#393939]">
              <Shield className="text-[#8A3FFC]" size={24} />
            </div>
            <h3 className="text-xl font-bold">Enterprise Security</h3>
            <p className="text-[#525252] dark:text-[#A8A8A8] leading-relaxed">
              Protect your workspaces with time-bound join codes, granular roles, and built-in brute-force protection.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center">
        <p className="font-mono text-xs text-[#757575] dark:text-[#525252]">
          &copy; {new Date().getFullYear()} QA-Hub. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
