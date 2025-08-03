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
  
  // Custom prompt modification state
  const [customPrompt, setCustomPrompt] = useState('');
  const [promptModifying, setPromptModifying] = useState(false);
  const [modificationHistory, setModificationHistory] = useState([]);
  const [showPromptSuggestions, setShowPromptSuggestions] = useState(false);
  
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
      console.log(`Aplicando mejora: ${enhancement.title}`);
      
      const response = await axios.post(`${API_URL}/api/enhance-project`, {
        project_id: project.id,
        enhancement: enhancement,
        apply: true,
        current_content: getProjectHTML(project)
      });
      
      if (response.data.success) {
        // Update projects list
        await fetchProjects();
        
        // Find and update the enhanced project
        const enhancedProject = {
          ...project,
          files: response.data.enhanced_project.files,
          metadata: {
            ...project.metadata,
            ...response.data.enhanced_project.metadata,
            enhanced: true,
            last_enhancement: enhancement.title,
            enhanced_at: new Date().toISOString()
          }
        };
        
        // Update live preview with enhanced version
        setLivePreview(enhancedProject);
        
        // Force iframe refresh to show changes
        setPreviewKey(prev => prev + 1);
        
        // Show success notification
        showNotification(`✨ ¡${enhancement.title} aplicada exitosamente!`, 'success');
        
        // Generate new suggestions based on enhanced content
        setTimeout(() => {
          generateEnhancementSuggestions(enhancedProject);
        }, 1000);
        
      } else {
        showNotification(`❌ Error aplicando mejora: ${response.data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error applying enhancement:', error);
      showNotification('❌ Error aplicando mejora. Intenta nuevamente.', 'error');
    } finally {
      setEnhancing(false);
    }
  };

  // Apply manual enhancements
  const applyManualEnhancement = async (project, enhancementType) => {
    setEnhancing(true);
    
    const enhancements = {
      colors: {
        title: 'Cambiar Paleta de Colores',
        prompt: 'Actualiza la paleta de colores del sitio web con una combinación moderna y atractiva. Usa colores que generen confianza y profesionalismo. Mantén la estructura pero mejora todos los colores de fondo, texto, botones y elementos decorativos.',
        icon: '🎨'
      },
      text: {
        title: 'Mejorar Textos y Contenido', 
        prompt: 'Mejora todos los textos del sitio web haciéndolos más persuasivos, claros y profesionales. Optimiza títulos, descripciones, llamadas a la acción y contenido general. Mantén la estructura pero mejora la redacción.',
        icon: '📝'
      },
      images: {
        title: 'Optimizar Imágenes y Visual',
        prompt: 'Mejora la presentación visual del sitio web. Optimiza el uso de imágenes, iconos y elementos visuales. Agrega placeholders para imágenes si faltan y mejora el diseño visual general.',
        icon: '🖼️'
      },
      config: {
        title: 'Configuración Avanzada',
        prompt: 'Optimiza la configuración técnica del sitio web: meta tags, SEO, performance, accesibilidad y estructura semántica. Agrega elementos técnicos que mejoren la funcionalidad.',
        icon: '⚙️'
      }
    };

    try {
      const enhancement = enhancements[enhancementType];
      if (!enhancement) return;

      console.log(`Aplicando mejora manual: ${enhancement.title}`);
      
      const response = await axios.post(`${API_URL}/api/enhance-project`, {
        project_id: project.id,
        enhancement: {
          ...enhancement,
          type: enhancementType,
          impact: 'high'
        },
        apply: true,
        current_content: getProjectHTML(project)
      });
      
      if (response.data.success) {
        // Same update logic as automatic enhancements
        await fetchProjects();
        
        const enhancedProject = {
          ...project,
          files: response.data.enhanced_project.files,
          metadata: {
            ...project.metadata,
            enhanced: true,
            last_enhancement: enhancement.title,
            enhanced_at: new Date().toISOString()
          }
        };
        
        setLivePreview(enhancedProject);
        setPreviewKey(prev => prev + 1);
        showNotification(`✨ ¡${enhancement.title} aplicada exitosamente!`, 'success');
        
        setTimeout(() => {
          generateEnhancementSuggestions(enhancedProject);
        }, 1000);
      }
    } catch (error) {
      console.error('Error applying manual enhancement:', error);
      showNotification('❌ Error aplicando mejora manual.', 'error');
    } finally {
      setEnhancing(false);
    }
  };

  // Show notification system
  const showNotification = (message, type) => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: type === 'success' ? '#10b981' : '#ef4444',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      zIndex: '10000',
      animation: 'slideInRight 0.3s ease',
      fontSize: '14px',
      fontWeight: '500'
    });
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };

  // Generate project summary
  const generateProjectSummary = async (project) => {
    try {
      const htmlContent = getProjectHTML(project);
      if (!htmlContent) return null;

      // Extract key information from HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      const title = tempDiv.querySelector('title')?.textContent || 
                    tempDiv.querySelector('h1')?.textContent || 
                    'Sitio Web Sin Título';
      
      const headings = Array.from(tempDiv.querySelectorAll('h1, h2, h3')).map(h => h.textContent);
      const paragraphs = Array.from(tempDiv.querySelectorAll('p')).slice(0, 3).map(p => p.textContent);
      const links = Array.from(tempDiv.querySelectorAll('a')).length;
      const images = Array.from(tempDiv.querySelectorAll('img')).length;
      const buttons = Array.from(tempDiv.querySelectorAll('button, .btn, [role="button"]')).length;

      return {
        title,
        headings: headings.slice(0, 5),
        keyContent: paragraphs.slice(0, 2),
        elementsCount: {
          links,
          images,
          buttons,
          sections: tempDiv.querySelectorAll('section, .section').length
        },
        hasNavigation: !!tempDiv.querySelector('nav'),
        hasFooter: !!tempDiv.querySelector('footer'),
        colorScheme: extractColorScheme(htmlContent),
        estimatedWords: tempDiv.textContent.split(' ').length
      };
    } catch (error) {
      console.error('Error generating summary:', error);
      return null;
    }
  };

  const extractColorScheme = (htmlContent) => {
    const colors = [];
    const colorRegex = /#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\)|rgba\([^)]+\)/g;
    const matches = htmlContent.match(colorRegex);
    if (matches) {
      colors.push(...matches.slice(0, 5));
    }
    return colors;
  };

  // Project Summary Component
  const ProjectSummary = ({ project }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (project) {
        generateProjectSummary(project).then(result => {
          setSummary(result);
          setLoading(false);
        });
      }
    }, [project]);

    if (loading) {
      return (
        <div className="summary-loading">
          <div className="loading-dots">Analizando proyecto...</div>
        </div>
      );
    }

    if (!summary) {
      return (
        <div className="summary-error">
          <span className="error-icon">⚠️</span>
          <span>Error generando resumen</span>
        </div>
      );
    }

    return (
      <div className="summary-content">
        <div className="summary-title">
          <h5>🏷️ {summary.title}</h5>
        </div>
        
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-icon">📝</span>
            <span className="stat-label">{summary.estimatedWords} palabras</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🔗</span>
            <span className="stat-label">{summary.elementsCount.links} enlaces</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🖼️</span>
            <span className="stat-label">{summary.elementsCount.images} imágenes</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🔘</span>
            <span className="stat-label">{summary.elementsCount.buttons} botones</span>
          </div>
        </div>

        {summary.headings.length > 0 && (
          <div className="summary-sections">
            <h6>📋 Secciones principales:</h6>
            <ul className="sections-list">
              {summary.headings.map((heading, index) => (
                <li key={index} className="section-item">
                  {heading.length > 40 ? heading.substring(0, 40) + '...' : heading}
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.keyContent.length > 0 && (
          <div className="summary-content-preview">
            <h6>💬 Contenido clave:</h6>
            {summary.keyContent.map((content, index) => (
              <p key={index} className="content-snippet">
                {content.length > 100 ? content.substring(0, 100) + '...' : content}
              </p>
            ))}
          </div>
        )}

        <div className="summary-features">
          <h6>✨ Características:</h6>
          <div className="features-list">
            {summary.hasNavigation && (
              <span className="feature-tag">📍 Navegación</span>
            )}
            {summary.hasFooter && (
              <span className="feature-tag">🦶 Footer</span>
            )}
            {summary.elementsCount.sections > 0 && (
              <span className="feature-tag">📦 {summary.elementsCount.sections} Secciones</span>
            )}
            {summary.colorScheme.length > 0 && (
              <span className="feature-tag">🎨 Colores personalizados</span>
            )}
          </div>
        </div>

        {summary.colorScheme.length > 0 && (
          <div className="color-palette">
            <h6>🎨 Paleta de colores:</h6>
            <div className="colors-preview">
              {summary.colorScheme.slice(0, 5).map((color, index) => (
                <div 
                  key={index}
                  className="color-swatch"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
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
                  <button 
                    className={`device-btn ${previewDevice === 'desktop' ? 'active' : ''}`}
                    onClick={() => handleDeviceChange('desktop')}
                  >
                    💻 Desktop
                  </button>
                  <button 
                    className={`device-btn ${previewDevice === 'mobile' ? 'active' : ''}`}
                    onClick={() => handleDeviceChange('mobile')}
                  >
                    📱 Mobile
                  </button>
                  <button 
                    className={`device-btn ${previewDevice === 'tablet' ? 'active' : ''}`}
                    onClick={() => handleDeviceChange('tablet')}
                  >
                    📱 Tablet
                  </button>
                </div>
                <div className="preview-tools">
                  <button className="tool-btn" onClick={handleRefresh}>
                    <span className={previewKey % 2 === 0 ? 'icon' : 'icon rotating'}>🔄</span>
                    Refresh
                  </button>
                  <button 
                    className={`tool-btn ${inspectMode ? 'active' : ''}`}
                    onClick={handleInspect}
                  >
                    <span className="icon">📐</span>
                    {inspectMode ? 'Exit Inspect' : 'Inspect'}
                  </button>
                </div>
              </div>
              
              <div className={`preview-frame ${previewDevice}`} style={getDeviceDimensions()}>
                <div className="device-frame">
                  <iframe 
                    key={previewKey}
                    ref={previewRef}
                    src={`data:text/html,${encodeURIComponent(getProjectHTML(livePreview) || '<div>Loading...</div>')}`}
                    className="preview-iframe"
                    title="Live Preview"
                    style={{
                      width: getDeviceDimensions().width,
                      height: getDeviceDimensions().height,
                      transform: `scale(${getDeviceDimensions().scale})`,
                      transformOrigin: 'center top'
                    }}
                  />
                  {previewDevice !== 'desktop' && (
                    <div className="device-chrome">
                      {previewDevice === 'mobile' && (
                        <>
                          <div className="mobile-notch"></div>
                          <div className="mobile-home-indicator"></div>
                        </>
                      )}
                      {previewDevice === 'tablet' && (
                        <div className="tablet-home-button"></div>
                      )}
                    </div>
                  )}
                </div>
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
                <button 
                  className="manual-btn"
                  onClick={() => applyManualEnhancement(livePreview, 'colors')}
                  disabled={enhancing}
                >
                  <span className="manual-icon">🎨</span>
                  <div className="manual-content">
                    <span className="manual-title">Cambiar Colores</span>
                    <span className="manual-desc">Actualizar paleta completa</span>
                  </div>
                  {enhancing && <span className="manual-loading">⏳</span>}
                </button>
                
                <button 
                  className="manual-btn"
                  onClick={() => applyManualEnhancement(livePreview, 'text')}
                  disabled={enhancing}
                >
                  <span className="manual-icon">📝</span>
                  <div className="manual-content">
                    <span className="manual-title">Editar Texto</span>
                    <span className="manual-desc">Mejorar contenido y copy</span>
                  </div>
                  {enhancing && <span className="manual-loading">⏳</span>}
                </button>
                
                <button 
                  className="manual-btn"
                  onClick={() => applyManualEnhancement(livePreview, 'images')}
                  disabled={enhancing}
                >
                  <span className="manual-icon">🖼️</span>
                  <div className="manual-content">
                    <span className="manual-title">Cambiar Imágenes</span>
                    <span className="manual-desc">Optimizar elementos visuales</span>
                  </div>
                  {enhancing && <span className="manual-loading">⏳</span>}
                </button>
                
                <button 
                  className="manual-btn"
                  onClick={() => applyManualEnhancement(livePreview, 'config')}
                  disabled={enhancing}
                >
                  <span className="manual-icon">⚙️</span>
                  <div className="manual-content">
                    <span className="manual-title">Configuración</span>
                    <span className="manual-desc">SEO y optimización técnica</span>
                  </div>
                  {enhancing && <span className="manual-loading">⏳</span>}
                </button>
              </div>
              
              {/* Project Summary */}
              <div className="project-summary">
                <h4>📊 Resumen del Proyecto</h4>
                <ProjectSummary project={livePreview} />
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