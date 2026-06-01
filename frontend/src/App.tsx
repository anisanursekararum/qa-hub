import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import RepositoryPage from './pages/RepositoryPage';
import { ProjectProvider } from './context/ProjectContext';
import TestRunsPage from './pages/TestRunsPage';
import TestRunDetailsPage from './pages/TestRunDetailsPage';

function App() {
  return (
    <ProjectProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/repository" element={<RepositoryPage />} />
          <Route path="/runs" element={<TestRunsPage />} />
          <Route path="/runs/:runId" element={<TestRunDetailsPage />} />
        </Routes>
      </Router>
    </ProjectProvider>
  );
}

export default App;
