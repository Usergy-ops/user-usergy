
import React, { useState } from 'react';
import { Search, Code, Smartphone, Brain, Globe } from 'lucide-react';

export const InteractiveProjectExplorer: React.FC = () => {
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);

  const projects = [
    { id: 1, icon: Brain, color: 'from-purple-500 to-pink-600', title: 'AI Research' },
    { id: 2, icon: Smartphone, color: 'from-green-500 to-teal-600', title: 'Mobile App' },
    { id: 3, icon: Globe, color: 'from-blue-500 to-cyan-600', title: 'Web Platform' },
  ];

  return (
    <div className="relative w-80 h-80">
      {/* 3D Project Visualization */}
      <div className="relative w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl overflow-hidden">
        
        {/* Floating Project Cards */}
        {projects.map((project, index) => {
          const ProjectIcon = project.icon;
          return (
            <div
              key={project.id}
              className={`
                absolute w-20 h-16 bg-white rounded-xl shadow-lg cursor-pointer transition-all duration-500 hover:shadow-2xl
                ${hoveredProject === project.id ? 'scale-110 z-10' : 'hover:scale-105'}
                animate-float
              `}
              style={{
                top: `${20 + index * 25}%`,
                left: `${30 + index * 15}%`,
                transform: `rotate(${index * 5 - 5}deg)`,
                animationDelay: `${index * 0.5}s`
              }}
              onMouseEnter={() => setHoveredProject(project.id)}
              onMouseLeave={() => setHoveredProject(null)}
            >
              <div className="p-3 h-full flex flex-col items-center justify-center">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${project.color} flex items-center justify-center mb-1`}>
                  <ProjectIcon className="w-4 h-4 text-white" />
                </div>
                <div className="text-xs text-gray-600 text-center font-medium">
                  {project.title}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Interactive Center Element */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-300 shadow-2xl">
            <Search className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};
