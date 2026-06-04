import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import RepositoryPage from './pages/RepositoryPage';
import { ProjectProvider } from './context/ProjectContext';
import TestRunsPage from './pages/TestRunsPage';
import TestRunDetailsPage from './pages/TestRunDetailsPage';
import TestRunCuration from './pages/TestRunCuration';
import SettingsPage from './pages/SettingsPage';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const resetTimer = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    const checkIdle = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0', 10);
      if (lastActivity && Date.now() - lastActivity > 86400000) { // 24 hours
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }, 60000); // Check every minute

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);

    return () => {
      clearInterval(checkIdle);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, []);

  return (
    <ProjectProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/repository" element={<RepositoryPage />} />
          <Route path="/runs" element={<TestRunsPage />} />
          <Route path="/runs/:runId" element={<TestRunDetailsPage />} />
          <Route path="/runs/:id/curation" element={<TestRunCuration />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Router>
    </ProjectProvider>
  );
}

export default App;
