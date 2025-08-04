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
      console.error('Error al obtener tipos de sitio web:', error);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/ai-providers`);
      setProviders(response.data.providers);
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Por favor ingresa una descripción para tu sitio web');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    
    const steps = [
      'Inicializando modelos de IA...',
      'Procesando tus requerimientos...',
      'Generando estructura HTML...',
      'Creando estilos profesionales...',
      'Agregando elementos interactivos...',
      'Optimizando para móviles...',
      'Finalizando tu sitio web...'
    ];

    // Simular progreso
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
        console.log('Sitio web generado exitosamente:', response.data);
        onWebsiteGenerated(response.data);
        setPrompt('');
        alert('🎉 ¡Sitio web generado exitosamente! Revisa la pestaña Proyectos para verlo.');
      } else {
        console.error('Generación fallida:', response.data);
        alert('Error generando sitio web: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error de generación:', error);
      alert('Error al generar sitio web. Por favor intenta nuevamente.');
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
          <h2>Genera Tu Sitio Web Profesional</h2>
          <p>Describe tu visión y observa cómo la IA crea un sitio web impresionante</p>
        </div>

        <div className="generator-form">
          <div className="form-group">
            <label htmlFor="prompt">Descripción del Sitio Web</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe tu sitio web... ej: 'Una landing page moderna para software de gestión de proyectos con planes de precios, testimonios y diseño limpio'"
              rows="4"
              className="form-control"
              disabled={isGenerating}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="websiteType">Tipo de Sitio Web</label>
              <select
                id="websiteType"
                value={websiteType}
                onChange={(e) => setWebsiteType(e.target.value)}
                className="form-control"
                disabled={isGenerating}
              >
                {websiteTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.name === 'Landing Page' ? 'Página de Aterrizaje' :
                     type.name === 'Business Website' ? 'Sitio Empresarial' :
                     type.name === 'Portfolio' ? 'Portafolio' :
                     type.name === 'E-Commerce' ? 'Tienda Online' :
                     type.name === 'Blog' ? 'Blog' : type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="provider">Proveedor de IA</label>
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
                Generando...
              </>
            ) : (
              <>
                <span className="button-icon">✨</span>
                Generar Sitio Web Profesional
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
      title: 'Doble Poder de IA',
      description: 'Aprovecha tanto OpenAI GPT-4.1 como Google Gemini para resultados óptimos'
    },
    {
      icon: '📱',
      title: 'Diseño Mobile-First',
      description: 'Cada sitio web está optimizado para dispositivos móviles y tablets'
    },
    {
      icon: '⚡',
      title: 'Ultra Rápido',
      description: 'Genera sitios web completos en menos de 30 segundos'
    },
    {
      icon: '🎨',
      title: 'Diseño Profesional',
      description: 'Diseños de nivel empresarial que parecen creados por expertos'
    },
    {
      icon: '🔧',
      title: 'Personalización Total',
      description: 'Obtén archivos HTML, CSS y JavaScript completos para personalizar'
    },
    {
      icon: '📊',
      title: 'Listo para Analytics',
      description: 'Seguimiento integrado y optimización SEO para mejor rendimiento'
    }
  ];

  return (
    <section className="features-section">
      <div className="container">
        <div className="section-header">
          <h2>Características Poderosas para Resultados Profesionales</h2>
          <p>Todo lo que necesitas para crear sitios web impresionantes</p>
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
      alert('Por favor ingresa una descripción para tu sitio web');
      return;
    }

    setIsComparing(true);
    setComparisonResults(null);

    try {
      const response = await axios.post(`${API_URL}/api/generate-website`, {
        prompt,
        website_type: websiteType,
        provider: null // null activa el modo de comparación
      });

      if (response.data.success) {
        console.log('Comparación completada exitosamente:', response.data);
        setComparisonResults(response.data);
        // Agregar resultados de ambos proveedores como proyectos separados
        const openaiResult = response.data.results.openai;
        const geminiResult = response.data.results.gemini;
        
        if (openaiResult.success) {
          onWebsiteGenerated(openaiResult);
        }
        if (geminiResult.success) {
          onWebsiteGenerated(geminiResult);
        }
      } else {
        console.error('Comparación fallida:', response.data);
        alert('Error comparando proveedores: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error de comparación:', error);
      alert('Error al comparar proveedores. Por favor intenta nuevamente.');
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <section className="comparison-section">
      <div className="container">
        <div className="section-header">
          <h2>Comparación de Proveedores IA</h2>
          <p>Genera con ambas IAs y ve cuál crea mejores resultados para tus necesidades</p>
        </div>

        <div className="comparison-form">
          <div className="form-group">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe tu sitio web para comparación de IA..."
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
              <option value="landing">🚀 Página de Aterrizaje</option>
              <option value="business">🏢 Sitio Empresarial</option>
              <option value="portfolio">🎨 Portafolio</option>
              <option value="ecommerce">🛒 Tienda Online</option>
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
                Comparando IAs...
              </>
            ) : (
              <>
                <span className="button-icon">⚖️</span>
                Comparar Ambas IAs
              </>
            )}
          </button>
        </div>

        {comparisonResults && (
          <div className="comparison-results">
            <h3>Resultados de la Comparación</h3>
            <div className="results-grid">
              {Object.entries(comparisonResults.results).map(([provider, result]) => (
                <div key={provider} className="result-card">
                  <h4>
                    {provider === 'openai' ? '🤖 OpenAI GPT-3.5' : '💎 Google Gemini 1.5'}
                  </h4>
                  <div className="result-preview">
                    <iframe 
                      srcDoc={result.files?.['index.html'] || '<p>Vista previa no disponible</p>'}
                      className="preview-frame"
                      title={`Vista previa ${provider}`}
                    />
                  </div>
                  <div className="result-actions">
                    <button className="action-button">Ver Código</button>
                    <button className="action-button primary">Elegir Este</button>
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
  const [editingProject, setEditingProject] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  // Cargar proyectos de la API cuando se monta el componente
  useEffect(() => {
    fetchProjects();
  }, [propProjects]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log('Cargando proyectos desde la API...');
      
      const response = await axios.get(`${API_URL}/api/projects`);
      console.log('Proyectos cargados:', response.data);
      
      if (response.data && response.data.projects) {
        const apiProjects = response.data.projects;
        // Combinar proyectos de API con proyectos de props (recién generados)
        const allProjects = [...apiProjects, ...propProjects];
        setProjects(allProjects);
        console.log('Total de proyectos cargados:', allProjects.length);
      } else {
        setProjects(propProjects);
      }
    } catch (error) {
      console.error('Error cargando proyectos:', error);
      setError('Error al cargar proyectos de la base de datos');
      // Respaldo a proyectos de props si la API falla
      setProjects(propProjects);
    } finally {
      setLoading(false);
    }
  };

  const openProject = (project) => {
    console.log('Abriendo proyecto:', project);
    console.log('Estructura de archivos:', project.files);
    console.log('Tipo de archivos:', typeof project.files);
    if (project.files && Array.isArray(project.files)) {
      console.log('Archivos encontrados:', project.files.map(f => f.filename));
    }
    setSelectedProject(project);
  };

  const closeProject = () => {
    setSelectedProject(null);
    setEditingProject(null);
  };

  const deleteProject = async (project) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar "${project.name || 'este proyecto'}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/projects/${project.id}`);
      alert('✅ Proyecto eliminado exitosamente');
      // Recargar proyectos
      await fetchProjects();
      // Cerrar modal si el proyecto eliminado estaba abierto
      if (selectedProject?.id === project.id) {
        closeProject();
      }
    } catch (error) {
      console.error('Error eliminando proyecto:', error);
      alert('Error al eliminar el proyecto. Por favor intenta nuevamente.');
    }
  };

  const startEditing = (project) => {
    setEditingProject(project.id);
    setEditForm({
      name: project.name || '',
      description: project.description || ''
    });
  };

  const saveEdit = async (project) => {
    try {
      const response = await axios.put(`${API_URL}/api/projects/${project.id}`, {
        name: editForm.name,
        description: editForm.description
      });
      
      if (response.data.success) {
        alert('✅ Proyecto actualizado exitosamente');
        await fetchProjects();
        setEditingProject(null);
      }
    } catch (error) {
      console.error('Error actualizando proyecto:', error);
      alert('Error al actualizar el proyecto. Por favor intenta nuevamente.');
    }
  };

  const cancelEdit = () => {
    setEditingProject(null);
    setEditForm({ name: '', description: '' });
  };

  const downloadProject = (project, fileType = 'all') => {
    if (!project.files) {
      alert('No hay archivos disponibles para descargar');
      return;
    }

    if (fileType === 'all') {
      downloadSingleFile(project, 'index.html');
    } else {
      downloadSingleFile(project, fileType);
    }
  };

  const downloadSingleFile = (project, fileName) => {
    let fileContent = null;
    
    console.log('Attempting to download file:', fileName);
    console.log('Project files structure:', project.files);
    
    // Try to find file content in different structures
    if (project.files && Array.isArray(project.files)) {
      console.log('Files is array, searching for:', fileName);
      // Try exact match first
      let file = project.files.find(f => f.filename === fileName);
      
      // If not found, try partial match (in case of extra characters)
      if (!file) {
        file = project.files.find(f => f.filename && f.filename.includes(fileName.split('.')[0]));
      }
      
      // If still not found, try different common variations
      if (!file && fileName === 'index.html') {
        file = project.files.find(f => 
          f.filename && (
            f.filename.toLowerCase().includes('html') ||
            f.filename.toLowerCase().includes('index')
          )
        );
      }
      
      if (file) {
        fileContent = file.content;
        console.log('Found file content, length:', fileContent ? fileContent.length : 0);
      } else {
        console.log('Available files:', project.files.map(f => f.filename));
      }
    } else if (project.files && typeof project.files === 'object') {
      fileContent = project.files[fileName];
    }
    
    if (!fileContent) {
      alert(`El archivo ${fileName} no está disponible`);
      console.log('Archivo no encontrado:', fileName, 'en proyecto:', project);
      console.log('Available files:', project.files);
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
    
    console.log(`Archivo ${fileName} descargado exitosamente`);
  };

  const renderProjectPreview = (project) => {
    console.log('Rendering preview for project:', project);
    
    // Try multiple ways to find the HTML content
    let htmlContent = null;
    
    // Method 1: Check if files is an array (from database)
    if (project.files && Array.isArray(project.files)) {
      const htmlFile = project.files.find(file => 
        file.filename && file.filename.toLowerCase().includes('html')
      );
      if (htmlFile && htmlFile.content) {
        htmlContent = htmlFile.content;
      }
    }
    
    // Method 2: Check if files is an object (from direct generation)
    else if (project.files && typeof project.files === 'object') {
      // Look for index.html or any .html file
      htmlContent = project.files['index.html'] || 
                   project.files['main.html'] || 
                   Object.values(project.files).find(content => 
                     typeof content === 'string' && content.includes('<html>')
                   );
    }
    
    // Method 3: Check top level for HTML content
    else if (project.html || project.index_html) {
      htmlContent = project.html || project.index_html;
    }
    
    console.log('Found HTML content:', !!htmlContent);
    
    if (!htmlContent) {
      return `
        <div style="padding: 20px; text-align: center; color: #666; font-family: Arial, sans-serif;">
          <h3>Vista previa no disponible</h3>
          <p>No se encontró contenido HTML en este proyecto</p>
          <small>Estructura del proyecto: ${JSON.stringify(Object.keys(project), null, 2)}</small>
        </div>
      `;
    }
    
    return htmlContent;
  };

  return (
    <section className="projects-section">
      <div className="container">
        <div className="section-header">
          <h2>Tus Sitios Web Generados</h2>
          <p>Navega y administra tus proyectos generados con IA</p>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando tus proyectos...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Error Cargando Proyectos</h3>
            <p>{error}</p>
            <button onClick={fetchProjects}>Intentar Nuevamente</button>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3>Aún No Hay Proyectos</h3>
            <p>Genera tu primer sitio web profesional para verlo aquí</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project, index) => (
              <div key={project.id || index} className="project-card">
                <div className="project-preview" onClick={() => openProject(project)}>
                  <iframe 
                    srcDoc={renderProjectPreview(project)}
                    className="project-frame"
                    title={`Proyecto ${project.name || index + 1}`}
                  />
                </div>
                <div className="project-info">
                  {editingProject === project.id ? (
                    <div className="edit-form">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        placeholder="Nombre del proyecto"
                        className="edit-input"
                      />
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        placeholder="Descripción del proyecto"
                        className="edit-textarea"
                        rows="2"
                      />
                      <div className="edit-actions">
                        <button className="save-button" onClick={() => saveEdit(project)}>💾 Guardar</button>
                        <button className="cancel-button" onClick={cancelEdit}>❌ Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="project-title">{project.name || `Sitio Web ${index + 1}`}</h3>
                      <p className="project-provider">
                        Generado con {project.metadata?.provider === 'openai' ? '🤖 OpenAI' : project.provider === 'openai' ? '🤖 OpenAI' : '💎 Gemini 1.5'}
                      </p>
                      <p className="project-type">
                        Tipo: {project.metadata?.website_type || project.website_type || 'landing'}
                      </p>
                      <div className="project-actions">
                        <button className="action-button" onClick={() => openProject(project)}>👁️ Ver</button>
                        <button className="action-button" onClick={() => startEditing(project)}>✏️ Editar</button>
                        <button className="action-button" onClick={() => downloadProject(project)}>⬇️ Descargar</button>
                        <button className="action-button delete-button" onClick={() => deleteProject(project)}>🗑️ Borrar</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedProject && (
          <div className="project-modal" onClick={closeProject}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={closeProject}>×</button>
              <h3>Detalles del Proyecto</h3>
              <div className="project-details">
                <p><strong>Nombre:</strong> {selectedProject.name || 'Sitio Web Generado'}</p>
                <p><strong>Proveedor:</strong> {selectedProject.metadata?.provider === 'openai' ? '🤖 OpenAI GPT-3.5' : selectedProject.provider === 'openai' ? '🤖 OpenAI GPT-3.5' : '💎 Google Gemini 1.5'}</p>
                <p><strong>Tipo:</strong> {selectedProject.metadata?.website_type || selectedProject.website_type || 'landing'}</p>
                <p><strong>Generado:</strong> {selectedProject.metadata?.generated_at ? new Date(selectedProject.metadata.generated_at).toLocaleDateString() : selectedProject.created_at ? new Date(selectedProject.created_at).toLocaleDateString() : 'Desconocido'}</p>
                {selectedProject.description && <p><strong>Descripción:</strong> {selectedProject.description}</p>}
              </div>
              <div className="modal-preview">
                <iframe 
                  srcDoc={renderProjectPreview(selectedProject)}
                  className="full-preview"
                  title="Vista previa completa del proyecto"
                />
              </div>
              <div className="modal-actions">
                <button className="action-button" onClick={() => downloadSingleFile(selectedProject, 'index.html')}>Descargar HTML</button>
                <button className="action-button" onClick={() => downloadSingleFile(selectedProject, 'styles.css')}>Descargar CSS</button>
                <button className="action-button" onClick={() => downloadSingleFile(selectedProject, 'script.js')}>Descargar JS</button>
                <button className="action-button primary" onClick={() => downloadProject(selectedProject)}>Descargar Todo</button>
                <button className="action-button edit-button" onClick={() => startEditing(selectedProject)}>✏️ Editar Proyecto</button>
                <button className="action-button delete-button" onClick={() => deleteProject(selectedProject)}>🗑️ Eliminar Proyecto</button>
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
            <p>Generación profesional de sitios web potenciada por IA</p>
          </div>
          
          <div className="footer-links">
            <div className="link-group">
              <h4>Producto</h4>
              <a href="#features">Características</a>
              <a href="#pricing">Precios</a>
              <a href="#templates">Plantillas</a>
            </div>
            
            <div className="link-group">
              <h4>Soporte</h4>
              <a href="#docs">Documentación</a>
              <a href="#help">Centro de Ayuda</a>
              <a href="#contact">Contacto</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 WebsiteGen Pro. Potenciado por la excelencia de la IA.</p>
        </div>
      </div>
    </footer>
  );
};