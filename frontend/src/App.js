import React, { useState } from 'react';
import './App.css';
import { 
  Header,
  HeroSection,
  WebsiteGenerator,
  FeatureGrid,
  ProviderComparison,
  Footer
} from './components';
import { VisualProjectsGallery } from './components/VisualProjectsGallery';
import { DualCodeEditor } from './components/DualCodeEditor';

function App() {
  const [activeView, setActiveView] = useState('generator');
  const [generatedProjects, setGeneratedProjects] = useState([]);
  const [selectedProjectForEditing, setSelectedProjectForEditing] = useState(null);

  const handleWebsiteGenerated = (project) => {
    setGeneratedProjects(prev => [project, ...prev]);
  };

  const handleEditProject = (project) => {
    setSelectedProjectForEditing(project);
    setActiveView('code-editor');
  };

  return (
    <div className="app-container">
      {activeView !== 'projects' && activeView !== 'code-editor' && (
        <Header activeView={activeView} onViewChange={setActiveView} />
      )}
      
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
          <VisualProjectsGallery 
            projects={generatedProjects} 
            onBack={() => setActiveView('generator')}
          />
        )}
        
        {activeView === 'code-editor' && (
          <DualCodeEditor 
            initialCode=""
            framework="react"
            onCodeChange={(code) => console.log('Code changed:', code)}
            onError={(error) => console.error('Editor error:', error)}
            theme="dark"
            language="typescript"
          />
        )}
        
        {activeView === 'about' && (
          <div className="about-section">
            <div className="container">
              <h2>Acerca de WebsiteGen Pro</h2>
              <p>Crea sitios web impresionantes y profesionales con el poder de la IA</p>
              <div className="about-content">
                <div className="about-feature">
                  <h3>🤖 Inteligencia Artificial Avanzada</h3>
                  <p>Utilizamos los modelos más avanzados de OpenAI GPT-4.1 y Google Gemini 2.5 Pro para generar código de calidad profesional.</p>
                </div>
                <div className="about-feature">
                  <h3>🎨 Diseños Profesionales</h3>
                  <p>Cada sitio web generado cumple con estándares de diseño empresarial y está optimizado para todos los dispositivos.</p>
                </div>
                <div className="about-feature">
                  <h3>⚡ Velocidad Increíble</h3>
                  <p>Genera sitios web completos en cuestión de segundos, no horas o días como el desarrollo tradicional.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {activeView !== 'projects' && activeView !== 'code-editor' && <Footer />}
    </div>
  );
}

export default App;