import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Zap, Shield, Sparkles } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

// Interactive Particle Web Canvas Background
const ParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, radius: 180 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Dynamic resize handler
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse movement tracker
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Particle class
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 2 + 1.5;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce borders
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Mouse hover interaction (magnetic pull)
        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseRef.current.radius) {
          const force = (mouseRef.current.radius - dist) / mouseRef.current.radius;
          this.x -= (dx / dist) * force * 0.8;
          this.y -= (dy / dist) * force * 0.8;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = document.documentElement.classList.contains('dark')
          ? 'rgba(138, 63, 252, 0.45)'
          : 'rgba(15, 98, 254, 0.35)';
        ctx.fill();
      }
    }

    // Initialize particles
    const particleCount = Math.min(Math.floor((width * height) / 9000), 120);
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const alpha = (110 - dist) / 110 * 0.12;
            ctx.strokeStyle = document.documentElement.classList.contains('dark')
              ? `rgba(138, 63, 252, ${alpha})`
              : `rgba(15, 98, 254, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-70" />;
};

// Simulated AI Logger component
const SimulatedAILogger = () => {
  const logs = [
    'Establishing secure WebSocket session with backend...',
    'LLM AI Engine loaded successfully.',
    'Reading PRD specification file: purchase_flow.pdf (size 2.4MB)...',
    'Analyzing Section 1.2: "Add items to cart" details...',
    'Generating testcase Draft [TC-CRT-001] for Checkout verification...',
    'Analyzing Section 1.5: "Discount code validations"...',
    'Generating testcase Draft [TC-CRT-002] for Coupon codes...',
    'Analyzing Section 2.1: "Stripe payment gateway callback"...',
    'Generating testcase Draft [TC-CRT-003] for Stripe failure scenario...',
    'LLM AI analysis complete. Extracted 3 cases assigned to "Cart Flow" module.',
    'Waiting for User Review...'
  ];

  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < logs.length) {
      const timer = setTimeout(() => {
        setVisibleLogs((prev) => [...prev, logs[currentIndex]]);
        setCurrentIndex((prev) => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      // Loop logs after 6 seconds complete delay
      const resetTimer = setTimeout(() => {
        setVisibleLogs([]);
        setCurrentIndex(0);
      }, 6000);
      return () => clearTimeout(resetTimer);
    }
  }, [currentIndex]);

  return (
    <div className="w-full bg-[#161616] border border-[#393939] rounded-[4px] shadow-2xl flex flex-col text-left h-72">
      <div className="p-3 border-b border-[#393939] bg-[#000000] flex justify-between items-center">
        <h5 className="font-mono font-bold text-xs text-[#8A3FFC] flex items-center">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8A3FFC] animate-ping mr-2"></span>
          AI PRD EXTRACTOR FEED
        </h5>
        <span className="font-mono text-[9px] text-[#757575]">LLM_SOCKET_LIVE</span>
      </div>
      <div className="p-4 flex-1 overflow-y-auto font-mono text-xs text-[#A8A8A8] space-y-2.5 bg-[#121212] select-none">
        {visibleLogs.map((log, index) => {
          const isDone = log.includes('complete') || log.includes('Waiting');
          const isErr = log.includes('error') || log.includes('failed');
          return (
            <div key={index} className="flex space-x-2 animate-in fade-in duration-300">
              <span className="text-[#8A3FFC] shrink-0">&gt;</span>
              <span className={isDone ? 'text-[#24A148] font-bold' : isErr ? 'text-[#DA1E28]' : 'text-[#E0E0E0]'}>
                {log}
              </span>
            </div>
          );
        })}
        {currentIndex < logs.length && (
          <div className="flex space-x-2 animate-pulse">
            <span className="text-[#8A3FFC] shrink-0">&gt;</span>
            <span className="text-[#8A3FFC]">Processing specs...</span>
          </div>
        )}
      </div>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  // Interactive Mockup State
  const [activeMockId, setActiveMockId] = useState('TC-AI-003');

  const mockCases = {
    'TC-AUTH-001': {
      id: 'TC-AUTH-001',
      title: 'Verify Google OAuth registration flow',
      priority: 'HIGH',
      status: 'READY',
      prerequisite: 'User has active internet connection and valid Google account credentials.',
      steps: '1. Click on "Log in with Google" button.\n2. In OAuth popup, enter credentials.\n3. Approve required profile permissions.',
      expected: 'User is registered, session is generated, and user is redirected to onboarding screen.'
    },
    'TC-PAY-002': {
      id: 'TC-PAY-002',
      title: 'Check multi-currency checkout calculation',
      priority: 'MEDIUM',
      status: 'DRAFT',
      prerequisite: 'Selected active products in shopping cart, conversion rates seeded in bank module.',
      steps: '1. Add items to cart.\n2. In checkout summary, swap base currency from USD to EUR.\n3. Verify converted total sum matches currency API rate.',
      expected: 'Cart total converts with 0.01 margin of accuracy and matches computed exchange rate.'
    },
    'TC-AI-003': {
      id: 'TC-AI-003',
      title: 'Run AI LLM extraction on PDF specifications',
      priority: 'HIGH',
      status: 'DRAFT',
      prerequisite: 'PDF contains standard text-based PRD/requirements specification sheets.',
      steps: '1. Drag and drop purchase_flow.pdf spec file to AI Extractor area.\n2. Click "Start Extraction" button.\n3. Monitor real-time logs and await generation.',
      expected: 'System generates structured testcases mapped to correct features with DRAFT status.'
    }
  };

  const activeCase = mockCases[activeMockId as keyof typeof mockCases];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-br from-[#F8FAFC] via-[#EEF2F6] to-[#E2E8F0] dark:from-[#09090C] dark:via-[#130E26] dark:to-[#090D1C] text-[#161616] dark:text-[#F4F4F4] transition-colors duration-500 font-sans selection:bg-[#0F62FE] selection:text-white">
      {/* Dynamic particles background */}
      <ParticleCanvas />

      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 bg-white/70 dark:bg-[#09090C]/65 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-[#0F62FE] to-[#8A3FFC] rounded-[4px] p-0.5 shadow-md shadow-[#0F62FE]/15">
              <div className="w-full h-full bg-white dark:bg-[#0F0F12] rounded-[3px] flex items-center justify-center">
                <span className="font-sans font-black text-sm text-[#0F62FE] dark:text-white">QA</span>
              </div>
            </div>
            <span className="font-sans font-black text-xl tracking-tight">
              <span className="text-[#0F62FE]">QA</span><span className="text-[#8A3FFC]">-Hub</span>
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <ThemeToggle />
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold hover:text-[#0F62FE] dark:hover:text-white transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="bg-gradient-to-r from-[#0F62FE] to-[#0353E9] text-white text-sm font-semibold px-5 py-2.5 rounded-[4px] transition-all hover:scale-[1.02] shadow-lg shadow-[#0F62FE]/25 hover:shadow-[#0F62FE]/35"
            >
              Sign up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-36 pb-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 text-left animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center space-x-2 bg-[#0F62FE]/5 dark:bg-[#8A3FFC]/10 border border-[#0F62FE]/20 dark:border-[#8A3FFC]/30 px-3.5 py-1.5 rounded-full shadow-sm">
              <Sparkles size={14} className="text-[#8A3FFC] animate-pulse" />
              <span className="text-xs font-semibold text-[#0F62FE] dark:text-[#8A3FFC] uppercase tracking-wider font-mono">Enterprise Test Orchestration</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.15]">
              Unified QA <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0F62FE] via-[#6366F1] to-[#8A3FFC] drop-shadow-sm">Management.</span>
            </h1>
            <p className="text-lg md:text-xl text-[#525252] dark:text-[#A8A8A8] max-w-2xl leading-relaxed">
              Design meticulous cases, extract test steps from PRDs with AI LLM, and orchestrate manual or automated test runs in a single, high-fidelity environment.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <button
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-[#0F62FE] via-[#6366F1] to-[#8A3FFC] hover:from-[#0b5cd9] hover:to-[#762fe3] text-white text-base font-semibold px-8 py-4 rounded-[4px] shadow-xl shadow-[#0F62FE]/15 hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
              >
                <span>Get Started for Free</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Interactive Micro-App Dashboard Mockup */}
          <div className="flex-1 w-full animate-in fade-in slide-in-from-right-8 duration-700 delay-150">
            <div className="relative rounded-[8px] overflow-hidden border border-[#E0E0E0] dark:border-[#2D2D39] shadow-2xl shadow-[#8A3FFC]/5 bg-white dark:bg-[#121215] flex flex-col h-[400px]">
              {/* Mock browser header */}
              <div className="h-10 border-b border-[#E0E0E0] dark:border-[#2D2D39] bg-[#F7F7F7] dark:bg-[#18181C] flex items-center justify-between px-4 shrink-0 select-none">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#DA1E28]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#F1C21B]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#24A148]"></div>
                </div>
                <span className="font-mono text-[10px] text-[#A8A8A8] dark:text-[#525252]">REPOSITORY_MOCKUP_PREVIEW</span>
                <div className="w-6"></div>
              </div>

              {/* Mockup split container */}
              <div className="flex-1 flex overflow-hidden">
                {/* Mock List (Left column) */}
                <div className="flex-1 overflow-y-auto p-4 border-r border-[#E0E0E0]/60 dark:border-[#2D2D39] space-y-3 bg-[#FCFCFD] dark:bg-[#101012] text-left">
                  <span className="text-[10px] font-bold text-[#8D8D8D] tracking-wider font-mono">TEST CASES LIST</span>

                  {Object.values(mockCases).map((tc) => {
                    const isActive = activeMockId === tc.id;
                    return (
                      <div
                        key={tc.id}
                        onClick={() => setActiveMockId(tc.id)}
                        className={`p-3 rounded-[3px] border cursor-pointer transition-all duration-150 select-none ${isActive
                          ? 'bg-[#E8F0FE] dark:bg-[#0f62fe]/15 border-[#0F62FE] shadow-sm'
                          : 'bg-white dark:bg-[#18181C] border-[#E0E0E0] dark:border-[#23232C] hover:border-[#CCCCCC] dark:hover:border-[#393939]'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-[#0F62FE]">{tc.id}</span>
                          <span className={`font-mono text-[8px] font-bold px-1 py-0.2 rounded-[2px] ${tc.priority === 'HIGH' ? 'text-[#DA1E28] bg-[#DA1E28]/5' : 'text-[#F1C21B] bg-[#F1C21B]/5'}`}>{tc.priority}</span>
                        </div>
                        <h4 className="text-xs font-semibold mt-1 truncate text-black dark:text-white">{tc.title}</h4>
                      </div>
                    );
                  })}
                </div>

                {/* Mock Jira-style side modal (Right column) */}
                <div className="w-[200px] sm:w-[260px] bg-white dark:bg-[#16161C] p-4 overflow-y-auto flex flex-col h-full text-left animate-in slide-in-from-right duration-300">
                  <div className="flex items-center justify-between border-b border-[#E0E0E0]/60 dark:border-[#2D2D39] pb-2 mb-3 shrink-0">
                    <span className="text-[10px] font-bold text-[#8D8D8D] font-mono">CASE DETAILS</span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-[2px] ${activeCase.status === 'READY' ? 'text-[#24A148] bg-[#24A148]/10' : 'text-[#F1C21B] bg-[#F1C21B]/10'}`}>{activeCase.status}</span>
                  </div>

                  <div className="space-y-3 flex-1 text-[11px] font-sans">
                    <div>
                      <span className="text-[#8D8D8D] font-bold">TITLE</span>
                      <p className="mt-0.5 text-black dark:text-white font-semibold leading-tight">{activeCase.title}</p>
                    </div>
                    <div>
                      <span className="text-[#8D8D8D] font-bold">PREREQUISITE</span>
                      <p className="mt-0.5 text-[#525252] dark:text-[#A8A8A8] leading-tight line-clamp-3" title={activeCase.prerequisite}>{activeCase.prerequisite}</p>
                    </div>
                    <div>
                      <span className="text-[#8D8D8D] font-bold">EXPECTED RESULT</span>
                      <p className="mt-0.5 text-[#525252] dark:text-[#A8A8A8] leading-tight line-clamp-3">{activeCase.expected}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-2 border-t border-[#E0E0E0]/60 dark:border-[#2D2D39] text-[9px] font-mono text-[#8D8D8D] shrink-0">
                    * Click any case to test live sync!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* AI Spotlight Section */}
      <section className="py-24 bg-[#F8FAFC]/55 dark:bg-[#101015]/40 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-left space-y-6 order-2 lg:order-1">
            <SimulatedAILogger />
          </div>
          <div className="flex-1 text-left space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center space-x-2 bg-[#8A3FFC]/5 dark:bg-[#8A3FFC]/10 border border-[#8A3FFC]/20 dark:border-[#8A3FFC]/30 px-3 py-1.5 rounded-full">
              <Sparkles size={14} className="text-[#8A3FFC]" />
              <span className="text-xs font-semibold text-[#8A3FFC] font-mono uppercase tracking-wider">AI Extractor</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Extract test cases <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A3FFC] via-[#6366F1] to-[#0F62FE]">from specs instantly.</span>
            </h2>
            <p className="text-base md:text-lg text-[#525252] dark:text-[#A8A8A8] leading-relaxed">
              Don't spend hours writing boilerplate tests. Simply drag and drop your PRD document in PDF format. Our AI LLM engine reads requirements, parses functional steps, creates relevant modules, and saves them directly to your repository in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Built for modern engineering teams</h2>
            <p className="text-[#525252] dark:text-[#A8A8A8]">A cohesive toolkit to eliminate manual testing friction and streamline delivery pipelines.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white/60 dark:bg-[#16161F]/40 backdrop-blur-md border border-[#E0E0E0]/60 dark:border-[#2D2D39]/50 rounded-[6px] p-8 space-y-4 hover:border-[#0F62FE]/30 dark:hover:border-[#8A3FFC]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#0F62FE]/5 group select-none">
              <div className="w-12 h-12 bg-[#24A148]/10 dark:bg-[#24A148]/20 border border-[#24A148]/20 rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                <CheckCircle className="text-[#24A148]" size={24} />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white">Jira-style Side Curation</h3>
              <p className="text-[#525252] dark:text-[#A8A8A8] text-sm leading-relaxed">
                Review and update test cases side-by-side with your index. Shift through files with dynamic row highlights and completely independent scrollbars.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/60 dark:bg-[#16161F]/40 backdrop-blur-md border border-[#E0E0E0]/60 dark:border-[#2D2D39]/50 rounded-[6px] p-8 space-y-4 hover:border-[#0F62FE]/30 dark:hover:border-[#8A3FFC]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#0F62FE]/5 group select-none">
              <div className="w-12 h-12 bg-[#0F62FE]/10 dark:bg-[#0F62FE]/20 border border-[#0F62FE]/20 rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                <Zap className="text-[#0F62FE]" size={24} />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white">Real-time Telemetry</h3>
              <p className="text-[#525252] dark:text-[#A8A8A8] text-sm leading-relaxed">
                Stream test suite updates and execution logs live with socket.io support. Connect manual steps and automated coverage seamlessly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/60 dark:bg-[#16161F]/40 backdrop-blur-md border border-[#E0E0E0]/60 dark:border-[#2D2D39]/50 rounded-[6px] p-8 space-y-4 hover:border-[#0F62FE]/30 dark:hover:border-[#8A3FFC]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#0F62FE]/5 group select-none">
              <div className="w-12 h-12 bg-[#8A3FFC]/10 dark:bg-[#8A3FFC]/20 border border-[#8A3FFC]/20 rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                <Shield className="text-[#8A3FFC]" size={24} />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white">Collaboration Spaces</h3>
              <p className="text-[#525252] dark:text-[#A8A8A8] text-sm leading-relaxed">
                Assign teammates, collaborate on repositories, and secure your workspaces using dynamic join codes and brute-force protection systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-sans font-black text-sm text-[#0F62FE]">QA</span>
            <span className="text-xs font-mono text-[#757575] dark:text-[#8D8D8D]">&copy; {new Date().getFullYear()} QA-Hub. All rights reserved.</span>
          </div>
          <p className="font-mono text-[10px] text-[#757575] dark:text-[#525252]">
            ENTERPRISE QUALITY ASSURANCE ENGINE v1.0
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
