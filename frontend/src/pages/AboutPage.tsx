import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';

const AboutPage = () => {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (!user) return null;

  return (
    <DashboardLayout user={user} onLogout={handleLogout} currentPath="/about" hideProjectSwitcher={true}>
      <div className="p-6 sm:p-8 max-w-4xl mx-auto min-h-full pb-32">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="mb-8">
            <h1 className="font-sans font-black text-3xl text-[#161616] dark:text-white tracking-tight mb-2">About QA-Hub</h1>
            <p className="font-sans text-sm text-[#525252] dark:text-[#A8A8A8]">
              Test Management & Orchestration Platform.
            </p>
          </div>

          <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] rounded-[4px] p-6 shadow-sm">
            <h2 className="font-sans font-bold text-xl text-[#161616] dark:text-white mb-4">Meet the Creator</h2>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <img
                src="/creator_picture.JPEG"
                alt="Creator"
                className="w-24 h-24 rounded-full object-cover flex-shrink-0 border-2 border-[#E0E0E0] dark:border-[#393939]"
              />
              <div>
                <h3 className="font-sans font-black text-2xl text-[#161616] dark:text-white mb-2">QA-Hub Creator</h3>
                <p className="font-sans text-sm text-[#525252] dark:text-[#A8A8A8] leading-relaxed mb-4">
                  Welcome to QA-Hub! I'm Anisa, a QA professional and the creator of this platform. QA-Hub is designed to simplify engineering workflows by centralizing all your testing needs. It’s a tool built not just for QA, but for every IT professional committed to safeguarding system quality. By integrating test management, execution, and AI-powered insights, QA-Hub boosts productivity and drives high-quality software delivery. High-quality releases mean happy users 🥳🎉
                </p>
                <div className="flex gap-4">
                  <a href="https://www.linkedin.com/in/anisa-arum/" className="text-[#0F62FE] hover:underline font-sans text-sm font-semibold">LinkedIn</a>
                  <a href="https://github.com/anisanursekararum" className="text-[#0F62FE] hover:underline font-sans text-sm font-semibold">GitHub</a>
                  <a href="https://medium.com/@anisa-nur-sekar-arum" className="text-[#0F62FE] hover:underline font-sans text-sm font-semibold">Medium</a>
                  <a href="https://anisanursekararum.github.io/" className="text-[#0F62FE] hover:underline font-sans text-sm font-semibold">Portfolio</a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="font-mono text-xs text-[#757575] dark:text-[#8D8D8D]">
              QA-Hub v1.0.0 &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AboutPage;
