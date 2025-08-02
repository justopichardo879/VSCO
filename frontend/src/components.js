import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// =====================================
// HEADER COMPONENT
// =====================================
export const Header = ({ activeView, onViewChange }) => {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🚀</span>
            <span className="logo-text">WebsiteGen Pro</span>
          </div>
          
          <nav className="nav">
            <button 
              className={`nav-item ${activeView === 'generator' ? 'active' : ''}`}
              onClick={() => onViewChange('generator')}
            >
              <span className="nav-icon">⚡</span>
              Generador
            </button>
            <button 
              className={`nav-item ${activeView === 'comparison' ? 'active' : ''}`}
              onClick={() => onViewChange('comparison')}
            >
              <span className="nav-icon">⚖️</span>
              Comparar IAs
            </button>
            <button 
              className={`nav-item ${activeView === 'projects' ? 'active' : ''}`}
              onClick={() => onViewChange('projects')}
            >
              <span className="nav-icon">📁</span>
              Proyectos
            </button>
            <button 
              className={`nav-item ${activeView === 'about' ? 'active' : ''}`}
              onClick={() => onViewChange('about')}
            >
              <span className="nav-icon">ℹ️</span>
              Acerca de
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

// =====================================
// HERO SECTION COMPONENT
// =====================================
export const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-content">
          <h1 className="hero-title">
            Crea <span className="gradient-text">Sitios Web Profesionales</span>
            <br />con IA en <span className="highlight">Un Solo Clic</span>
          </h1>
          <p className="hero-description">
            Aprovecha el poder de OpenAI GPT-4.1 y Google Gemini 2.5 Pro para generar 
            sitios web impresionantes y profesionales que parecen creados por diseñadores expertos.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Sitios Generados</div>
            </div>
            <div className="stat">
              <div className="stat-number">2</div>
              <div className="stat-label">Proveedores IA</div>
            </div>
            <div className="stat">
              <div className="stat-number">5</div>
              <div className="stat-label">Tipos de Sitio</div>
            </div>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="floating-cards">
            <div className="card card-1">💼 Empresarial</div>
            <div className="card card-2">🎨 Portafolio</div>
            <div className="card card-3">🛒 Tienda Online</div>
            <div className="card card-4">📝 Blog</div>
          </div>
        </div>
      </div>
    </section>
  );
};

// =====================================
// WEBSITE GENERATOR COMPONENT
// =====================================
export const WebsiteGenerator = ({ onWebsiteGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [websiteType, setWebsiteType] = useState('landing');
  const [provider, setProvider] = useState('openai');
  const [isGenerating, setIsGenerating] = useState(false);
  const [websiteTypes, setWebsiteTypes] = useState([]);
  const [providers, setProviders] = useState([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  useEffect(() => {
    fetchWebsiteTypes();
    fetchProviders();
  }, []);

  const fetchWebsiteTypes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/website-types`);
      setWebsiteTypes(response.data.types);
    } catch (error) {
      console.error('Error fetching website types:', error);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/ai-providers`);
      setProviders(response.data.providers);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a description for your website');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    
    const steps = [
      'Initializing AI models...',
      'Processing your requirements...',
      'Generating HTML structure...',
      'Creating professional styles...',
      'Adding interactive elements...',
      'Optimizing for mobile...',
      'Finalizing your website...'
    ];

    // Simulate progress
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i]);
      setGenerationProgress((i + 1) / steps.length * 100);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      const response = await axios.post(`${API_URL}/api/generate-website`, {
        prompt,
        website_type: websiteType,
        provider
      });

      if (response.data.success) {
        console.log('Website generated successfully:', response.data);
        onWebsiteGenerated(response.data);
        setPrompt('');
        alert('🎉 Website generated successfully! Check the Projects tab to view it.');
      } else {
        console.error('Generation failed:', response.data);
        alert('Error generating website: ' + response.data.error);
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate website. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setCurrentStep('');
    }
  };

  return (
    <section className="generator-section">
      <div className="container">
        <div className="generator-header">
          <h2>Generate Your Professional Website</h2>
          <p>Describe your vision and watch AI create a stunning website</p>
        </div>

        <div className="generator-form">
          <div className="form-group">
            <label htmlFor="prompt">Website Description</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your website... e.g., 'A modern SaaS landing page for project management software with pricing tiers, testimonials, and clean design'"
              rows="4"
              className="form-control"
              disabled={isGenerating}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="websiteType">Website Type</label>
              <select
                id="websiteType"
                value={websiteType}
                onChange={(e) => setWebsiteType(e.target.value)}
                className="form-control"
                disabled={isGenerating}
              >
                {websiteTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="provider">AI Provider</label>
              <select
                id="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="form-control"
                disabled={isGenerating}
              >
                {providers.map(prov => (
                  <option key={prov.id} value={prov.id}>
                    {prov.icon} {prov.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="generate-button"
          >
            {isGenerating ? (
              <>
                <span className="spinner"></span>
                Generating...
              </>
            ) : (
              <>
                <span className="button-icon">✨</span>
                Generate Professional Website
              </>
            )}
          </button>

          {isGenerating && (
            <div className="generation-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${generationProgress}%` }}
                ></div>
              </div>
              <div className="progress-text">{currentStep}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// =====================================
// FEATURE GRID COMPONENT
// =====================================
export const FeatureGrid = () => {
  const features = [
    {
      icon: '🤖',
      title: 'Dual AI Power',
      description: 'Leverage both OpenAI GPT-4.1 and Google Gemini for optimal results'
    },
    {
      icon: '📱',
      title: 'Mobile-First Design',
      description: 'Every website is optimized for mobile devices and tablets'
    },
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Generate complete websites in under 30 seconds'
    },
    {
      icon: '🎨',
      title: 'Professional Design',
      description: 'Enterprise-grade designs that look crafted by experts'
    },
    {
      icon: '🔧',
      title: 'Full Customization',
      description: 'Get complete HTML, CSS, and JavaScript files to customize'
    },
    {
      icon: '📊',
      title: 'Analytics Ready',
      description: 'Built-in tracking and SEO optimization for better performance'
    }
  ];

  return (
    <section className="features-section">
      <div className="container">
        <div className="section-header">
          <h2>Powerful Features for Professional Results</h2>
          <p>Everything you need to create stunning websites</p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// =====================================
// PROVIDER COMPARISON COMPONENT
// =====================================
export const ProviderComparison = ({ onWebsiteGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [websiteType, setWebsiteType] = useState('landing');
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState(null);

  const handleCompare = async () => {
    if (!prompt.trim()) {
      alert('Please enter a description for your website');
      return;
    }

    setIsComparing(true);
    setComparisonResults(null);

    try {
      const response = await axios.post(`${API_URL}/api/generate-website`, {
        prompt,
        website_type: websiteType,
        provider: null // null triggers comparison mode
      });

      if (response.data.success) {
        console.log('Comparison completed successfully:', response.data);
        setComparisonResults(response.data);
        // Add both provider results as separate projects
        const openaiResult = response.data.results.openai;
        const geminiResult = response.data.results.gemini;
        
        if (openaiResult.success) {
          onWebsiteGenerated(openaiResult);
        }
        if (geminiResult.success) {
          onWebsiteGenerated(geminiResult);
        }
      } else {
        console.error('Comparison failed:', response.data);
        alert('Error comparing providers: ' + response.data.error);
      }
    } catch (error) {
      console.error('Comparison error:', error);
      alert('Failed to compare providers. Please try again.');
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <section className="comparison-section">
      <div className="container">
        <div className="section-header">
          <h2>AI Provider Comparison</h2>
          <p>Generate with both AIs and see which one creates better results for your needs</p>
        </div>

        <div className="comparison-form">
          <div className="form-group">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your website for AI comparison..."
              rows="4"
              className="form-control"
              disabled={isComparing}
            />
          </div>

          <div className="form-group">
            <select
              value={websiteType}
              onChange={(e) => setWebsiteType(e.target.value)}
              className="form-control"
              disabled={isComparing}
            >
              <option value="landing">🚀 Landing Page</option>
              <option value="business">🏢 Business Website</option>
              <option value="portfolio">🎨 Portfolio</option>
              <option value="ecommerce">🛒 E-Commerce</option>
              <option value="blog">📝 Blog</option>
            </select>
          </div>

          <button 
            onClick={handleCompare}
            disabled={isComparing || !prompt.trim()}
            className="compare-button"
          >
            {isComparing ? (
              <>
                <span className="spinner"></span>
                Comparing AIs...
              </>
            ) : (
              <>
                <span className="button-icon">⚖️</span>
                Compare Both AIs
              </>
            )}
          </button>
        </div>

        {comparisonResults && (
          <div className="comparison-results">
            <h3>Comparison Results</h3>
            <div className="results-grid">
              {Object.entries(comparisonResults.results).map(([provider, result]) => (
                <div key={provider} className="result-card">
                  <h4>
                    {provider === 'openai' ? '🤖 OpenAI GPT-4.1' : '💎 Google Gemini'}
                  </h4>
                  <div className="result-preview">
                    <iframe 
                      srcDoc={result.files?.['index.html'] || '<p>No preview available</p>'}
                      className="preview-frame"
                      title={`${provider} preview`}
                    />
                  </div>
                  <div className="result-actions">
                    <button className="action-button">View Code</button>
                    <button className="action-button primary">Choose This</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// =====================================
// PROJECT GALLERY COMPONENT
// =====================================
export const ProjectGallery = ({ projects: propProjects = [] }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch projects from API when component mounts
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        console.log('Fetching projects from API...');
        
        const response = await axios.get(`${API_URL}/api/projects`);
        console.log('Projects fetched:', response.data);
        
        if (response.data && response.data.projects) {
          const apiProjects = response.data.projects;
          // Merge API projects with any prop projects (newly generated ones)
          const allProjects = [...apiProjects, ...propProjects];
          setProjects(allProjects);
          console.log('Total projects loaded:', allProjects.length);
        } else {
          setProjects(propProjects);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError('Failed to load projects from database');
        // Fallback to prop projects if API fails
        setProjects(propProjects);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [propProjects]);

  const openProject = (project) => {
    console.log('Opening project:', project);
    setSelectedProject(project);
  };

  const closeProject = () => {
    setSelectedProject(null);
  };

  const downloadProject = (project, fileType = 'all') => {
    if (!project.files) {
      alert('No files available for download');
      return;
    }

    if (fileType === 'all') {
      // Download all files as a zip would be ideal, but for now we'll download HTML
      downloadSingleFile(project, 'index.html');
    } else {
      downloadSingleFile(project, fileType);
    }
  };

  const downloadSingleFile = (project, fileName) => {
    const fileContent = project.files?.[fileName];
    if (!fileContent) {
      alert(`File ${fileName} not available`);
      return;
    }

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderProjectPreview = (project) => {
    // Check if project has files and HTML content
    if (!project.files || !project.files['index.html']) {
      return '<div style="padding: 20px; text-align: center; color: #666;">Preview not available - No HTML content</div>';
    }
    return project.files['index.html'];
  };

  return (
    <section className="projects-section">
      <div className="container">
        <div className="section-header">
          <h2>Your Generated Websites</h2>
          <p>Browse and manage your AI-generated projects</p>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your projects...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Error Loading Projects</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3>No Projects Yet</h3>
            <p>Generate your first professional website to see it here</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project, index) => (
              <div key={project.id || index} className="project-card" onClick={() => openProject(project)}>
                <div className="project-preview">
                  <iframe 
                    srcDoc={renderProjectPreview(project)}
                    className="project-frame"
                    title={`Project ${project.name || index + 1}`}
                  />
                </div>
                <div className="project-info">
                  <h3 className="project-title">{project.name || `Website ${index + 1}`}</h3>
                  <p className="project-provider">
                    Generated with {project.metadata?.provider === 'openai' ? '🤖 OpenAI' : project.provider === 'openai' ? '🤖 OpenAI' : '💎 Gemini'}
                  </p>
                  <p className="project-type">
                    Type: {project.metadata?.website_type || project.website_type || 'landing'}
                  </p>
                  <div className="project-actions" onClick={e => e.stopPropagation()}>
                    <button className="action-button" onClick={() => openProject(project)}>View</button>
                    <button className="action-button" onClick={() => downloadProject(project)}>Download</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedProject && (
          <div className="project-modal" onClick={closeProject}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={closeProject}>×</button>
              <h3>Project Details</h3>
              <div className="project-details">
                <p><strong>Name:</strong> {selectedProject.name || 'Generated Website'}</p>
                <p><strong>Provider:</strong> {selectedProject.metadata?.provider === 'openai' ? '🤖 OpenAI GPT-4.1' : selectedProject.provider === 'openai' ? '🤖 OpenAI GPT-4.1' : '💎 Google Gemini'}</p>
                <p><strong>Type:</strong> {selectedProject.metadata?.website_type || selectedProject.website_type || 'landing'}</p>
                <p><strong>Generated:</strong> {selectedProject.metadata?.generated_at ? new Date(selectedProject.metadata.generated_at).toLocaleDateString() : selectedProject.created_at ? new Date(selectedProject.created_at).toLocaleDateString() : 'Unknown'}</p>
                {selectedProject.description && <p><strong>Description:</strong> {selectedProject.description}</p>}
              </div>
              <div className="modal-preview">
                <iframe 
                  srcDoc={renderProjectPreview(selectedProject)}
                  className="full-preview"
                  title="Full project preview"
                />
              </div>
              <div className="modal-actions">
                <button className="action-button" onClick={() => downloadSingleFile(selectedProject, 'index.html')}>Download HTML</button>
                <button className="action-button" onClick={() => downloadSingleFile(selectedProject, 'styles.css')}>Download CSS</button>
                <button className="action-button" onClick={() => downloadSingleFile(selectedProject, 'script.js')}>Download JS</button>
                <button className="action-button primary" onClick={() => downloadProject(selectedProject)}>Download All</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// =====================================
// FOOTER COMPONENT
// =====================================
export const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="logo-icon">🚀</span>
            <span className="logo-text">WebsiteGen Pro</span>
            <p>Professional AI-powered website generation</p>
          </div>
          
          <div className="footer-links">
            <div className="link-group">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#templates">Templates</a>
            </div>
            
            <div className="link-group">
              <h4>Support</h4>
              <a href="#docs">Documentation</a>
              <a href="#help">Help Center</a>
              <a href="#contact">Contact</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 WebsiteGen Pro. Powered by AI excellence.</p>
        </div>
      </div>
    </footer>
  );
};