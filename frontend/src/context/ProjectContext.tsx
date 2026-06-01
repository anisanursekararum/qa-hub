import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchProjects } from '../api/projects';

export interface Project {
  id: string;
  name: string;
  description: string;
  role: 'ADMIN_PROJECT' | 'MEMBER';
  teamSize: number;
}

interface ProjectContextType {
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  availableProjects: Project[];
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);

  const loadProjects = async () => {
    try {
      const projs = await fetchProjects();
      setAvailableProjects(projs);
      
      const stored = localStorage.getItem('activeProject');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const exists = projs.find((p: Project) => p.id === parsed.id);
          if (exists) setActiveProjectState(exists);
          else setActiveProjectState(null);
        } catch (e) {}
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('token')) {
      loadProjects();
    }
  }, []);

  const setActiveProject = (project: Project | null) => {
    setActiveProjectState(project);
    if (project) {
      localStorage.setItem('activeProject', JSON.stringify(project));
    } else {
      localStorage.removeItem('activeProject');
    }
  };

  return (
    <ProjectContext.Provider value={{ activeProject, setActiveProject, availableProjects, refreshProjects: loadProjects }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
