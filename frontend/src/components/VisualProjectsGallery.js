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
  
  // Interactive chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMode, setChatMode] = useState('suggestions'); // 'suggestions' or 'chat'
  
  const previewRef = useRef(null);
  const chatEndRef = useRef(null);

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

  // Función para eliminar proyectos
  const deleteProject = async (project, event) => {
    // Evitar que se ejecute la acción de abrir el proyecto
    event.stopPropagation();

    // Confirmación mejorada con más información
    const confirmMessage = `⚠️ ¿Eliminar proyecto?

📝 Nombre: "${project.name || 'Proyecto sin nombre'}"
🤖 Generado con: ${project.metadata?.provider === 'openai' ? 'OpenAI GPT-3.5' : 'Google Gemini 1.5'}
📅 Creado: ${project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Fecha desconocida'}

Esta acción NO se puede deshacer.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      // Mostrar indicador de carga
      showNotification('🗑️ Eliminando proyecto...', 'info');
      
      const response = await axios.delete(`${API_URL}/api/projects/${project.id}`);
      
      if (response.data.success) {
        // Éxito - mostrar notificación y recargar proyectos
        showNotification('✅ ¡Proyecto eliminado exitosamente!', 'success');
        
        // Recargar la lista de proyectos
        await fetchProjects();
        
        // Si el proyecto eliminado estaba siendo previsualizdo, cerrar el panel
        if (livePreview && livePreview.id === project.id) {
          setLivePreview(null);
          setSelectedProject(null);
        }
      } else {
        showNotification(`❌ Error: ${response.data.message || 'No se pudo eliminar el proyecto'}`, 'error');
      }
    } catch (error) {
      console.error('Error eliminando proyecto:', error);
      
      // Manejar diferentes tipos de error
      if (error.response) {
        const status = error.response.status;
        if (status === 404) {
          showNotification('⚠️ El proyecto ya no existe o fue eliminado', 'error');
          // Refrescar la lista por si acaso
          await fetchProjects();
        } else if (status === 500) {
          showNotification('❌ Error del servidor. Intenta más tarde', 'error');
        } else {
          showNotification(`❌ Error ${status}: ${error.response.data?.detail || 'Error desconocido'}`, 'error');
        }
      } else if (error.request) {
        showNotification('🌐 Error de conexión. Verifica tu internet', 'error');
      } else {
        showNotification('❌ Error inesperado eliminando proyecto', 'error');
      }
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
    // Initialize chat with welcome message
    setChatMessages([
      {
        id: Date.now(),
        type: 'ai',
        message: `¡Hola! 👋 Soy tu asistente de mejoras de IA. Puedo ayudarte a modificar "${project.name || 'tu proyecto'}" de muchas formas. ¿Qué te gustaría cambiar o agregar?`,
        timestamp: new Date().toISOString(),
        suggestions: [
          '💬 Agregar testimonios',
          '📧 Formulario de contacto', 
          '🎨 Cambiar colores',
          '📱 Mejorar responsive'
        ]
      }
    ]);
    // Generate AI enhancement suggestions
    generateEnhancementSuggestions(project);
  };

  const generateEnhancementSuggestions = async (project) => {
    setEnhancing(true);
    setEnhancementSuggestions([]); // Clear previous suggestions
    
    try {
      console.log('Generating enhancement suggestions for project:', project.id);
      
      const response = await axios.post(`${API_URL}/api/enhance-project`, {
        project_id: project.id,
        current_content: getProjectHTML(project),
        enhancement_type: 'suggestions'
      });
      
      console.log('Suggestions response:', response.data);
      
      if (response.data.success && response.data.suggestions) {
        setEnhancementSuggestions(response.data.suggestions);
        showNotification('✨ Nuevas sugerencias de mejora generadas', 'info');
      } else {
        console.warn('No suggestions received from backend, using fallback');
        // Enhanced fallback suggestions based on project analysis
        const fallbackSuggestions = [
          {
            title: 'Mejorar Paleta de Colores',
            description: 'Aplicar una paleta de colores moderna y profesional que mejore la legibilidad y el impacto visual',
            impact: 'high',
            icon: '🎨',
            type: 'visual'
          },
          {
            title: 'Agregar Animaciones CSS',
            description: 'Incluir micro-interacciones y transiciones suaves para mejorar la experiencia de usuario',
            impact: 'medium',
            icon: '✨',
            type: 'animation'
          },
          {
            title: 'Optimizar Contenido',
            description: 'Mejorar los textos, títulos y llamadas a la acción para mayor efectividad',
            impact: 'high',
            icon: '📝',
            type: 'content'
          },
          {
            title: 'Mejorar Responsive',
            description: 'Optimizar el diseño para dispositivos móviles y tablets con mejores breakpoints',
            impact: 'high',
            icon: '📱',
            type: 'responsive'
          },
          {
            title: 'Agregar SEO Meta Tags',
            description: 'Incluir meta tags, structured data y optimizaciones para motores de búsqueda',
            impact: 'medium',
            icon: '🔍',
            type: 'seo'
          }
        ];
        setEnhancementSuggestions(fallbackSuggestions);
        showNotification('💡 Sugerencias predefinidas cargadas', 'info');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Error generando sugerencias: ';
      if (error.response) {
        const status = error.response.status;
        if (status === 403) {
          errorMessage += 'Sin permisos para generar sugerencias.';
        } else if (status === 429) {
          errorMessage += 'Límite de solicitudes alcanzado.';
        } else if (status === 500) {
          errorMessage += 'Error del servidor. Verifica las API keys.';
        } else {
          errorMessage += `Error ${status}`;
        }
      } else if (error.request) {
        errorMessage += 'Sin conexión al servidor.';
      } else {
        errorMessage += 'Error inesperado.';
      }
      
      // Always provide fallback suggestions even on error
      const emergencySuggestions = [
        {
          title: '🎨 Cambiar Colores',
          description: 'Actualizar paleta de colores completa',
          impact: 'high',
          icon: '🎨',
          type: 'visual'
        },
        {
          title: '📝 Mejorar Textos',
          description: 'Optimizar contenido y copy del sitio',
          impact: 'high',
          icon: '📝',
          type: 'content'
        },
        {
          title: '📱 Optimizar Mobile',
          description: 'Mejorar diseño responsive',
          impact: 'high',
          icon: '📱',
          type: 'responsive'
        }
      ];
      
      setEnhancementSuggestions(emergencySuggestions);
      showNotification(errorMessage, 'error');
    } finally {
      setEnhancing(false);
    }
  };

  const applyEnhancement = async (project, enhancement) => {
    setEnhancing(true);
    try {
      console.log(`Aplicando mejora: ${enhancement.title}`);
      
      const requestPayload = {
        project_id: project.id,
        enhancement: enhancement,
        apply: true,
        current_content: getProjectHTML(project)
      };
      
      console.log('Request payload:', requestPayload);
      
      const response = await axios.post(`${API_URL}/api/enhance-project`, requestPayload);
      
      console.log('Enhancement response:', response.data);
      
      if (response.data.success && response.data.enhanced_project) {
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
        const errorMsg = response.data.error || 'No se recibió el proyecto mejorado del servidor';
        console.error('Enhancement failed:', errorMsg);
        showNotification(`❌ Error aplicando mejora: ${errorMsg}`, 'error');
      }
    } catch (error) {
      console.error('Error applying enhancement:', error);
      
      // Better error handling
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 500) {
          showNotification('🚨 Error del servidor. Es posible que no tengas API keys configuradas.', 'error');
        } else if (status === 429) {
          showNotification('⏳ Límite de API alcanzado. Intenta en unos minutos.', 'error');
        } else {
          showNotification(`❌ Error ${status}: ${errorData?.detail || 'Error desconocido'}`, 'error');
        }
      } else if (error.request) {
        showNotification('🌐 Error de conexión. Verifica tu internet.', 'error');
      } else {
        showNotification('❌ Error inesperado aplicando mejora. Intenta nuevamente.', 'error');
      }
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
      if (!enhancement) {
        showNotification('❌ Tipo de mejora no válido', 'error');
        return;
      }

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
      
      console.log('Manual enhancement response:', response.data);
      
      if (response.data.success && response.data.enhanced_project) {
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
      } else {
        const errorMsg = response.data.error || 'No se recibió el proyecto mejorado del servidor';
        console.error('Manual enhancement failed:', errorMsg);
        showNotification(`❌ Error aplicando mejora: ${errorMsg}`, 'error');
      }
    } catch (error) {
      console.error('Error applying manual enhancement:', error);
      
      // Better error handling
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 500) {
          showNotification('🚨 Error del servidor. Verifica las API keys de OpenAI/Gemini.', 'error');
        } else if (status === 429) {
          showNotification('⏳ Límite de API alcanzado. Intenta en unos minutos.', 'error');
        } else {
          showNotification(`❌ Error ${status}: ${errorData?.detail || 'Error desconocido'}`, 'error');
        }
      } else if (error.request) {
        showNotification('🌐 Error de conexión. Verifica tu internet.', 'error');
      } else {
        showNotification('❌ Error inesperado aplicando mejora manual.', 'error');
      }
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
    const notificationColors = {
      'success': '#10b981',
      'error': '#ef4444',
      'info': '#3b82f6'
    };
    
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: notificationColors[type] || '#6b7280',
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
    
    // Remove after 3 seconds (or 5 seconds for info)
    const timeout = type === 'info' ? 5000 : 3000;
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, timeout);
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

  // Apply custom prompt modification
  const applyCustomModification = async () => {
    if (!customPrompt.trim() || !livePreview) {
      showNotification('⚠️ Escribe una instrucción para modificar la página', 'error');
      return;
    }

    setPromptModifying(true);
    
    try {
      console.log(`Aplicando modificación personalizada: ${customPrompt}`);
      
      const response = await axios.post(`${API_URL}/api/enhance-project`, {
        project_id: livePreview.id,
        enhancement: {
          title: 'Modificación Personalizada',
          description: customPrompt,
          type: 'custom',
          impact: 'high',
          icon: '✏️',
          prompt: customPrompt
        },
        apply: true,
        current_content: getProjectHTML(livePreview),
        modification_type: 'custom_prompt'
      });
      
      if (response.data.success) {
        // Add to modification history
        const modification = {
          id: Date.now(),
          prompt: customPrompt,
          timestamp: new Date().toISOString(),
          applied: true
        };
        
        setModificationHistory(prev => [modification, ...prev.slice(0, 9)]); // Keep last 10
        
        // Update projects list
        await fetchProjects();
        
        // Update live preview
        const enhancedProject = {
          ...livePreview,
          files: response.data.enhanced_project.files,
          metadata: {
            ...livePreview.metadata,
            ...response.data.enhanced_project.metadata,
            last_modification: customPrompt,
            modified_at: new Date().toISOString()
          }
        };
        
        setLivePreview(enhancedProject);
        setPreviewKey(prev => prev + 1);
        
        // Clear prompt and show success
        setCustomPrompt('');
        showNotification(`✨ ¡Modificación aplicada exitosamente!`, 'success');
        
        // Generate new suggestions
        setTimeout(() => {
          generateEnhancementSuggestions(enhancedProject);
        }, 1000);
        
      } else {
        showNotification(`❌ Error: ${response.data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error applying custom modification:', error);
      showNotification('❌ Error aplicando modificación. Intenta nuevamente.', 'error');
    } finally {
      setPromptModifying(false);
    }
  };

  // Quick modification suggestions
  const quickModifications = [
    {
      icon: '➕',
      title: 'Agregar sección de testimonios',
      prompt: 'Agrega una sección de testimonios con 3 testimonios de clientes satisfechos, con nombres, fotos y reseñas convincentes'
    },
    {
      icon: '📧',
      title: 'Agregar formulario de contacto',
      prompt: 'Agrega un formulario de contacto profesional con campos para nombre, email, asunto y mensaje, con validación y estilos modernos'
    },
    {
      icon: '💰',
      title: 'Agregar sección de precios',
      prompt: 'Agrega una sección de planes y precios con 3 opciones (básico, premium, enterprise) con características y botones de compra'
    },
    {
      icon: '🎯',
      title: 'Mejorar call-to-action',
      prompt: 'Mejora y fortalece todas las llamadas a la acción del sitio, haciéndolas más persuasivas y visibles con mejores textos y diseño'
    },
    {
      icon: '📊',
      title: 'Agregar estadísticas',
      prompt: 'Agrega una sección de estadísticas impresionantes con números grandes, iconos y descripciones que demuestren el valor de la empresa'
    },
    {
      icon: '🌟',
      title: 'Agregar sección de características',
      prompt: 'Agrega una sección que destaque las principales características o beneficios con iconos, títulos y descripciones atractivas'
    }
  ];

  // Apply quick modification
  const applyQuickModification = (modification) => {
    setCustomPrompt(modification.prompt);
    setShowPromptSuggestions(false);
  };

  // Get modification history for display
  const getModificationHistoryDisplay = () => {
    return modificationHistory.slice(0, 5).map(mod => ({
      ...mod,
      shortPrompt: mod.prompt.length > 60 ? mod.prompt.substring(0, 60) + '...' : mod.prompt,
      timeAgo: getTimeAgo(mod.timestamp)
    }));
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays}d`;
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

  // Chat functionality - FIXED VERSION
  const sendChatMessage = async () => {
    if (!chatInput.trim() || !livePreview) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: chatInput.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message to chat
    setChatMessages(prev => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setIsChatLoading(true);

    try {
      console.log('Sending chat message to backend:', {
        project_id: livePreview.id,
        message: currentInput,
        modification_type: 'chat_interactive'
      });

      // Send to backend with proper format
      const response = await axios.post(`${API_URL}/api/enhance-project`, {
        project_id: livePreview.id,
        current_content: getProjectHTML(livePreview),
        enhancement_type: 'chat_interactive', 
        modification_type: 'chat_interactive',
        enhancement: {
          title: `Chat: ${currentInput.substring(0, 50)}...`,
          prompt: currentInput,
          impact: 'high',
          type: 'chat_interactive'
        },
        apply: true
      });

      console.log('Chat backend response:', response.data);

      if (response.data.success && response.data.enhanced_project) {
        // Create AI response message
        const aiResponse = {
          id: Date.now() + 1,
          type: 'ai',
          message: `✨ ¡Perfecto! He aplicado los cambios que me pediste: "${currentInput}". Los cambios ya están visibles en el preview.`,
          timestamp: new Date().toISOString(),
          suggestions: generateNextSuggestions(currentInput),
          changes_applied: response.data.changes || []
        };

        setChatMessages(prev => [...prev, aiResponse]);

        // Update live preview with enhanced version
        const enhancedProject = {
          ...livePreview,
          files: response.data.enhanced_project.files,
          metadata: {
            ...livePreview.metadata,
            ...response.data.enhanced_project.metadata,
            enhanced: true,
            last_chat_modification: currentInput,
            enhanced_at: new Date().toISOString()
          }
        };

        setLivePreview(enhancedProject);
        setPreviewKey(prev => prev + 1);
        
        // Update projects list
        await fetchProjects();
        
        // Show success notification
        showNotification(`✨ ¡Cambios aplicados via Chat IA!`, 'success');
        
        // Generate new suggestions based on enhanced content
        setTimeout(() => {
          generateEnhancementSuggestions(enhancedProject);
        }, 1000);

      } else {
        // Handle API error response
        const errorMsg = response.data.error || 'No se pudo procesar tu solicitud';
        const errorResponse = {
          id: Date.now() + 1,
          type: 'ai',
          message: `❌ Lo siento, hubo un problema procesando tu solicitud: "${errorMsg}". ¿Podrías intentar reformular tu pregunta?`,
          timestamp: new Date().toISOString(),
          suggestions: ['🔄 Intenta de nuevo', '💬 Reformula la pregunta', '🎯 Sé más específico']
        };
        setChatMessages(prev => [...prev, errorResponse]);
        showNotification(`❌ Error en Chat IA: ${errorMsg}`, 'error');
      }

    } catch (error) {
      console.error('Error in chat message:', error);
      
      // Create error response message
      let errorMessage = '❌ Error de conexión. ';
      if (error.response) {
        const status = error.response.status;
        if (status === 403) {
          errorMessage += 'No tienes permisos para esta acción.';
        } else if (status === 429) {
          errorMessage += 'Demasiadas solicitudes. Espera un momento.';
        } else if (status === 500) {
          errorMessage += 'Error del servidor. Verifica las API keys.';
        } else {
          errorMessage += `Error ${status}: ${error.response.data?.detail || 'Error desconocido'}`;
        }
      } else if (error.request) {
        errorMessage += 'No se pudo conectar al servidor.';
      } else {
        errorMessage += 'Error inesperado.';
      }

      const errorResponse = {
        id: Date.now() + 1,
        type: 'ai',
        message: errorMessage + ' ¿Puedes intentar nuevamente?',
        timestamp: new Date().toISOString(),
        suggestions: ['🔄 Reintentar', '🛠️ Verificar conexión', '💡 Probar sugerencias automáticas']
      };

      setChatMessages(prev => [...prev, errorResponse]);
      showNotification('❌ Error en Chat IA', 'error');
    } finally {
      setIsChatLoading(false);
      
      // Scroll to bottom after message
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Generate modification summary based on user input
  const generateModificationSummary = (userInput, responseData) => {
    const input = userInput.toLowerCase();
    let summary = '';

    if (input.includes('testimonios') || input.includes('reseñas')) {
      summary = '• **Testimonios:** Agregada sección con reseñas de clientes\n• **Diseño:** Aplicado layout moderno con avatars y estrellas\n• **Responsive:** Optimizado para móviles y tablets';
    } else if (input.includes('contacto') || input.includes('formulario')) {
      summary = '• **Formulario:** Creado formulario de contacto funcional\n• **Validación:** Agregada validación de campos\n• **Estilos:** Aplicado diseño profesional y accessible';
    } else if (input.includes('color') || input.includes('tema')) {
      summary = '• **Colores:** Actualizada paleta de colores completa\n• **Consistencia:** Aplicado tema en toda la página\n• **Contraste:** Optimizado para mejor legibilidad';
    } else if (input.includes('precio') || input.includes('plan')) {
      summary = '• **Precios:** Agregada sección de planes y tarifas\n• **Layout:** Diseño tipo tarjetas con características\n• **CTA:** Botones de acción optimizados para conversión';
    } else {
      summary = '• **Contenido:** Modificado según tus especificaciones\n• **Diseño:** Aplicado estilo consistente y profesional\n• **Funcionalidad:** Optimizado para mejor experiencia de usuario';
    }

    return summary;
  };

  // Generate next suggestions based on current modification
  const generateNextSuggestions = (userInput) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('testimonios')) {
      return ['🎨 Cambiar colores de la sección', '📧 Agregar formulario', '📊 Agregar estadísticas'];
    } else if (input.includes('contacto')) {
      return ['💬 Agregar testimonios', '🗺️ Agregar mapa', '📞 Agregar info de contacto'];
    } else if (input.includes('color')) {
      return ['✨ Agregar animaciones', '📝 Mejorar textos', '🖼️ Optimizar imágenes'];
    } else {
      return ['🎯 Mejorar call-to-action', '📱 Optimizar mobile', '⚡ Agregar animaciones'];
    }
  };

  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
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
                {project.metadata?.provider === 'openai' ? 'OpenAI 3.5' : 'Gemini 1.5'}
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
              <button 
                className="quick-action danger" 
                title="Eliminar"
                onClick={(e) => deleteProject(project, e)}
              >
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
              <div className="panel-controls">
                <button 
                  className={`mode-toggle ${chatMode === 'suggestions' ? 'active' : ''}`}
                  onClick={() => setChatMode('suggestions')}
                >
                  💡 Sugerencias
                </button>
                <button 
                  className={`mode-toggle ${chatMode === 'chat' ? 'active' : ''}`}
                  onClick={() => setChatMode('chat')}
                >
                  💬 Chat IA
                </button>
              </div>
            </div>

            {chatMode === 'suggestions' ? (
              // Original suggestions interface
              <>
                <div className="panel-status">
                  {enhancing ? 
                    <span className="loading-dots">Analizando...</span> : 
                    <span className="ready-indicator">✨ Listo</span>
                  }
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
              </>
            ) : (
              // Interactive Chat Interface
              <div className="chat-interface">
                <div className="chat-messages">
                  {chatMessages.map((message) => (
                    <div key={message.id} className={`chat-message ${message.type}`}>
                      <div className="message-avatar">
                        {message.type === 'user' ? '👤' : '🤖'}
                      </div>
                      <div className="message-content">
                        <div className="message-bubble">
                          <div 
                            className="message-text"
                            dangerouslySetInnerHTML={{ 
                              __html: message.message.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            }} 
                          />
                          <div className="message-time">
                            {new Date(message.timestamp).toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                        
                        {message.suggestions && (
                          <div className="message-suggestions">
                            {message.suggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                className="suggestion-chip"
                                onClick={() => setChatInput(suggestion.replace(/^[^\s]*\s/, ''))}
                                disabled={isChatLoading}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {isChatLoading && (
                    <div className="chat-message ai">
                      <div className="message-avatar">🤖</div>
                      <div className="message-content">
                        <div className="message-bubble loading">
                          <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                          <div className="loading-text">Aplicando cambios...</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={chatEndRef} />
                </div>

                <div className="chat-input-container">
                  <div className="chat-input-wrapper">
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={handleChatKeyPress}
                      placeholder="Escribe qué quieres modificar... Ej: 'Agrega testimonios de clientes'"
                      className="chat-input"
                      rows="1"
                      disabled={isChatLoading}
                    />
                    <button
                      onClick={sendChatMessage}
                      disabled={!chatInput.trim() || isChatLoading}
                      className="chat-send-btn"
                    >
                      {isChatLoading ? (
                        <span className="icon rotating">⚙️</span>
                      ) : (
                        <span className="icon">🚀</span>
                      )}
                    </button>
                  </div>
                  
                  <div className="chat-quick-actions">
                    <button 
                      className="quick-action-chip"
                      onClick={() => setChatInput('Agrega una sección de testimonios con 3 reseñas')}
                      disabled={isChatLoading}
                    >
                      💬 Testimonios
                    </button>
                    <button 
                      className="quick-action-chip"
                      onClick={() => setChatInput('Agrega un formulario de contacto')}
                      disabled={isChatLoading}
                    >
                      📧 Contacto
                    </button>
                    <button 
                      className="quick-action-chip"
                      onClick={() => setChatInput('Cambia la paleta de colores a tonos más modernos')}
                      disabled={isChatLoading}
                    >
                      🎨 Colores
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Manual Enhancement and Project Summary sections remain the same */}
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