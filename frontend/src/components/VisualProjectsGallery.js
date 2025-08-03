import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './VisualProjectsGallery.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// =====================================
// ADVANCED VISUAL PROJECTS GALLERY
// =====================================
export const VisualProjectsGallery = ({ projects: propProjects = [], onBack }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [livePreview, setLivePreview] = useState(null);
  const [enhancing, setEnhancing] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, kanban
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [enhancementSuggestions, setEnhancementSuggestions] = useState([]);
  
  // Preview controls state
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  const [inspectMode, setInspectMode] = useState(false);
  
  const previewRef = useRef(null);

  useEffect(() => {
    fetchProjects();
  }, [propProjects]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/projects`);
      if (response.data && response.data.projects) {
        const allProjects = [...response.data.projects, ...propProjects];
        setProjects(allProjects);
      } else {
        setProjects(propProjects);
      }
    } catch (error) {
      console.error('Error cargando proyectos:', error);
      setProjects(propProjects);
    } finally {
      setLoading(false);
    }
  };

  const generateThumbnail = (project) => {
    const htmlContent = getProjectHTML(project);
    if (!htmlContent) return null;
    
    // Create a thumbnail from HTML content
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <foreignObject width="400" height="300">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;background:white;transform:scale(0.25);transform-origin:0 0;overflow:hidden;">
            ${htmlContent.substring(0, 1000)}...
          </div>
        </foreignObject>
      </svg>
    `)}`;
  };

  const getProjectHTML = (project) => {
    if (project.files && Array.isArray(project.files)) {
      const htmlFile = project.files.find(file => 
        file.filename && file.filename.toLowerCase().includes('html')
      );
      return htmlFile ? htmlFile.content : null;
    } else if (project.files && typeof project.files === 'object') {
      return project.files['index.html'] || Object.values(project.files).find(content => 
        typeof content === 'string' && content.includes('<html>')
      );
    }
    return null;
  };

  const openLivePreview = (project) => {
    setLivePreview(project);
    setSelectedProject(project);
    // Generate AI enhancement suggestions
    generateEnhancementSuggestions(project);
  };

  const generateEnhancementSuggestions = async (project) => {
    setEnhancing(true);
    try {
      const response = await axios.post(`${API_URL}/api/enhance-project`, {
        project_id: project.id,
        current_content: getProjectHTML(project),
        enhancement_type: 'suggestions'
      });
      
      if (response.data.suggestions) {
        setEnhancementSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      // Fallback suggestions
      setEnhancementSuggestions([
        {
          type: 'visual',
          title: 'Mejorar Paleta de Colores',
          description: 'Actualizar esquema de colores para mayor impacto visual',
          impact: 'high',
          icon: '🎨'
        },
        {
          type: 'functionality',
          title: 'Agregar Animaciones',
          description: 'Incluir micro-interacciones y transiciones suaves',
          impact: 'medium',
          icon: '✨'
        },
        {
          type: 'content',
          title: 'Optimizar Contenido',
          description: 'Mejorar textos y llamadas a la acción',
          impact: 'high',
          icon: '📝'
        },
        {
          type: 'performance',
          title: 'Optimización SEO',
          description: 'Mejorar meta tags y estructura para SEO',
          impact: 'medium',
          icon: '🚀'
        }
      ]);
    } finally {
      setEnhancing(false);
    }
  };

  const applyEnhancement = async (project, enhancement) => {
    setEnhancing(true);
    try {
      const response = await axios.post(`${API_URL}/api/enhance-project`, {
        project_id: project.id,
        enhancement: enhancement,
        apply: true
      });
      
      if (response.data.success) {
        await fetchProjects();
        // Update live preview
        setLivePreview(response.data.enhanced_project);
        // Force iframe refresh
        setPreviewKey(prev => prev + 1);
        alert(`✨ ¡Mejora aplicada exitosamente! ${enhancement.title}`);
      }
    } catch (error) {
      console.error('Error applying enhancement:', error);
      alert('Error aplicando mejora. Funcionalidad en desarrollo.');
    } finally {
      setEnhancing(false);
    }
  };

  // Device viewport controls
  const handleDeviceChange = (device) => {
    setPreviewDevice(device);
    if (previewRef.current) {
      // Apply device-specific styles to iframe container
      const container = previewRef.current.parentElement;
      container.className = `preview-frame ${device}`;
    }
  };

  // Refresh preview
  const handleRefresh = () => {
    setPreviewKey(prev => prev + 1);
    // Show refresh animation
    if (previewRef.current) {
      previewRef.current.style.opacity = '0.5';
      setTimeout(() => {
        if (previewRef.current) {
          previewRef.current.style.opacity = '1';
        }
      }, 300);
    }
  };

  // Toggle inspect mode
  const handleInspect = () => {
    setInspectMode(!inspectMode);
    if (previewRef.current) {
      if (!inspectMode) {
        // Enable inspect mode - add overlay with grid and measurements
        const inspectOverlay = document.createElement('div');
        inspectOverlay.className = 'inspect-overlay';
        inspectOverlay.innerHTML = `
          <div class="inspect-grid"></div>
          <div class="inspect-measurements"></div>
        `;
        previewRef.current.parentElement.appendChild(inspectOverlay);
      } else {
        // Disable inspect mode
        const overlay = previewRef.current.parentElement.querySelector('.inspect-overlay');
        if (overlay) overlay.remove();
      }
    }
  };

  // Get device viewport dimensions
  const getDeviceDimensions = () => {
    switch (previewDevice) {
      case 'mobile':
        return { width: '375px', height: '667px', scale: 0.8 };
      case 'tablet':
        return { width: '768px', height: '1024px', scale: 0.7 };
      default:
        return { width: '100%', height: '100%', scale: 1 };
    }
  };

  const filteredAndSortedProjects = projects
    .filter(project => {
      if (filterType !== 'all' && project.metadata?.website_type !== filterType) return false;
      if (searchTerm && !project.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'created_at') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });

  const ProjectCard = ({ project, index }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
      <div 
        className={`visual-project-card ${isHovered ? 'hovered' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => openLivePreview(project)}
        style={{ '--animation-delay': `${index * 0.1}s` }}
      >
        <div className="card-header">
          <div className="project-thumbnail">
            <iframe 
              src={`data:text/html,${encodeURIComponent(getProjectHTML(project) || '<div>Preview</div>')}`}
              className="thumbnail-iframe"
              title={`Thumbnail ${project.name}`}
            />
            <div className="thumbnail-overlay">
              <div className="overlay-actions">
                <button className="action-btn primary" onClick={(e) => {
                  e.stopPropagation();
                  openLivePreview(project);
                }}>
                  <span className="icon">👁️</span>
                  Ver & Editar
                </button>
                <button className="action-btn secondary" onClick={(e) => {
                  e.stopPropagation();
                  // Download functionality
                }}>
                  <span className="icon">⬇️</span>
                  Descargar
                </button>
              </div>
            </div>
          </div>
          
          <div className="card-status">
            <div className={`status-indicator ${project.metadata?.provider || 'unknown'}`}>
              {project.metadata?.provider === 'openai' ? '🤖' : '💎'}
            </div>
            <div className="project-type">
              {project.metadata?.website_type || 'landing'}
            </div>
          </div>
        </div>

        <div className="card-content">
          <h3 className="project-title">{project.name || `Proyecto ${index + 1}`}</h3>
          <p className="project-description">
            {project.description || 'Sitio web generado con IA'}
          </p>
          
          <div className="project-meta">
            <div className="meta-item">
              <span className="meta-label">Creado</span>
              <span className="meta-value">
                {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Reciente'}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">IA</span>
              <span className="meta-value">
                {project.metadata?.provider === 'openai' ? 'OpenAI' : 'Gemini'}
              </span>
            </div>
          </div>

          <div className="card-actions">
            <div className="quick-actions">
              <button className="quick-action" title="Duplicar">
                <span className="icon">📋</span>
              </button>
              <button className="quick-action" title="Compartir">
                <span className="icon">🔗</span>
              </button>
              <button className="quick-action danger" title="Eliminar">
                <span className="icon">🗑️</span>
              </button>
            </div>
            <div className="enhancement-indicator">
              <span className="enhancement-dot"></span>
              <span className="enhancement-text">IA Lista para Mejorar</span>
            </div>
          </div>
        </div>

        <div className="card-hover-effects">
          <div className="glow-effect"></div>
          <div className="shine-effect"></div>
        </div>
      </div>
    );
  };

  const LivePreviewPanel = () => {
    if (!livePreview) return null;

    return (
      <div className="live-preview-panel">
        <div className="preview-header">
          <div className="preview-title">
            <h2>{livePreview.name || 'Proyecto sin nombre'}</h2>
            <div className="preview-status">
              <span className="status-dot live"></span>
              <span>Vista en vivo</span>
            </div>
          </div>
          <div className="preview-actions">
            <button className="preview-btn" onClick={() => setLivePreview(null)}>
              <span className="icon">✕</span>
            </button>
          </div>
        </div>

        <div className="preview-content">
          <div className="preview-main">
            <div className="preview-viewport">
              <div className="viewport-controls">
                <div className="device-selector">
                  <button className="device-btn active">💻 Desktop</button>
                  <button className="device-btn">📱 Mobile</button>
                  <button className="device-btn">📱 Tablet</button>
                </div>
                <div className="preview-tools">
                  <button className="tool-btn">🔄 Refresh</button>
                  <button className="tool-btn">📐 Inspect</button>
                </div>
              </div>
              
              <div className="preview-frame">
                <iframe 
                  ref={previewRef}
                  src={`data:text/html,${encodeURIComponent(getProjectHTML(livePreview) || '<div>Loading...</div>')}`}
                  className="preview-iframe"
                  title="Live Preview"
                />
              </div>
            </div>
          </div>

          <div className="enhancement-panel">
            <div className="panel-header">
              <h3>🚀 Mejoras con IA</h3>
              <div className="panel-status">
                {enhancing ? 
                  <span className="loading-dots">Analizando...</span> : 
                  <span className="ready-indicator">✨ Listo</span>
                }
              </div>
            </div>

            <div className="suggestions-list">
              {enhancementSuggestions.map((suggestion, index) => (
                <div key={index} className={`suggestion-card ${suggestion.impact}`}>
                  <div className="suggestion-header">
                    <span className="suggestion-icon">{suggestion.icon}</span>
                    <div className="suggestion-info">
                      <h4>{suggestion.title}</h4>
                      <span className={`impact-badge ${suggestion.impact}`}>
                        {suggestion.impact === 'high' ? 'Alto Impacto' : 'Medio Impacto'}
                      </span>
                    </div>
                  </div>
                  <p className="suggestion-description">{suggestion.description}</p>
                  <button 
                    className="apply-btn"
                    onClick={() => applyEnhancement(livePreview, suggestion)}
                    disabled={enhancing}
                  >
                    {enhancing ? 'Aplicando...' : 'Aplicar Mejora'}
                  </button>
                </div>
              ))}
            </div>

            <div className="manual-enhancement">
              <h4>✏️ Edición Manual</h4>
              <div className="manual-tools">
                <button className="manual-btn">🎨 Cambiar Colores</button>
                <button className="manual-btn">📝 Editar Texto</button>
                <button className="manual-btn">🖼️ Cambiar Imágenes</button>
                <button className="manual-btn">⚙️ Configuración</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="visual-loading">
        <div className="loading-animation">
          <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
          <h3>Cargando proyectos visuales...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="visual-projects-gallery">
      {/* Header with controls */}
      <div className="gallery-header">
        <div className="header-main">
          <div className="header-top">
            {onBack && (
              <button className="back-button" onClick={onBack}>
                <span className="icon">←</span>
                Volver al Generador
              </button>
            )}
          </div>
          <h1 className="gallery-title">
            <span className="title-icon">🚀</span>
            Tus Proyectos Visuales
          </h1>
          <p className="gallery-subtitle">
            Gestiona y mejora tus sitios web con IA avanzada
          </p>
        </div>

        <div className="gallery-controls">
          <div className="search-filter-group">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar proyectos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <select 
              className="filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Todos los tipos</option>
              <option value="landing">Landing Page</option>
              <option value="business">Empresarial</option>
              <option value="portfolio">Portafolio</option>
              <option value="ecommerce">Tienda Online</option>
              <option value="blog">Blog</option>
            </select>

            <select 
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="created_at">Más recientes</option>
              <option value="name">Por nombre</option>
            </select>
          </div>

          <div className="view-controls">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <span className="icon">⊞</span>
              Grid
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <span className="icon">☰</span>
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className={`projects-container ${viewMode}`}>
        {filteredAndSortedProjects.length === 0 ? (
          <div className="empty-state-visual">
            <div className="empty-animation">
              <div className="empty-icon">🎨</div>
              <h3>No se encontraron proyectos</h3>
              <p>Crea tu primer proyecto o ajusta los filtros</p>
              <button className="create-project-btn">
                <span className="icon">✨</span>
                Crear Nuevo Proyecto
              </button>
            </div>
          </div>
        ) : (
          <div className="projects-grid">
            {filteredAndSortedProjects.map((project, index) => (
              <ProjectCard key={project.id || index} project={project} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* Live Preview Panel */}
      {livePreview && <LivePreviewPanel />}

      {/* Floating Action Button */}
      <button className="fab">
        <span className="fab-icon">➕</span>
        <span className="fab-text">Nuevo Proyecto</span>
      </button>
    </div>
  );
};