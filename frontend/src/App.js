import React, { useState } from 'react';
import './App.css';
import { 
  Header,
  HeroSection,
  WebsiteGenerator,
  FeatureGrid,
  ProviderComparison,
  ProjectGallery,
  Footer
} from './components';

function App() {
  const [activeView, setActiveView] = useState('generator');
  const [generatedProjects, setGeneratedProjects] = useState([]);

  const handleWebsiteGenerated = (project) => {
    setGeneratedProjects(prev => [project, ...prev]);
  };

  return (
    <div className="app-container">
      <Header activeView={activeView} onViewChange={setActiveView} />
      
      <main className="main-content">
        {activeView === 'generator' && (
          <>
            <HeroSection />
            <WebsiteGenerator onWebsiteGenerated={handleWebsiteGenerated} />
            <FeatureGrid />
          </>
        )}
        
        {activeView === 'comparison' && (
          <ProviderComparison onWebsiteGenerated={handleWebsiteGenerated} />
        )}
        
        {activeView === 'projects' && (
          <ProjectGallery projects={generatedProjects} />
        )}
        
        {activeView === 'about' && (
          <div className="about-section">
            <div className="container">
              <h2>About Professional Website Generator</h2>
              <p>Create stunning, professional websites with the power of AI</p>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

export default App;