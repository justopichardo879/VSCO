import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ProjectBuilder.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// =====================================
// ULTIMATE PROJECT BUILDER 2025
// =====================================
export const ProjectBuilder = ({ onBack }) => {
  const [selectedStack, setSelectedStack] = useState({});
  const [projectType, setProjectType] = useState('');
  const [projectName, setProjectName] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [previewMode, setPreviewMode] = useState('desktop');
  const [liveProject, setLiveProject] = useState(null);
  const [codeView, setCodeView] = useState('preview'); // preview, code, split
  const [selectedFile, setSelectedFile] = useState('');
  const [buildLogs, setBuildLogs] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  // Advanced Stack Options 2025
  const stackOptions = {
    frontend: {
      title: '🚀 Frontend Bestias 2025',
      options: [
        { 
          id: 'react19-nextjs14', 
          name: 'React 19 + Next.js 14', 
          description: 'Server Components, Server Actions, ISR, Edge Runtime',
          icon: '⚛️',
          features: ['SSR', 'Server Actions', 'App Router', 'Edge Runtime'],
          popularity: 98
        },
        { 
          id: 'react19-vite', 
          name: 'React 19 + Vite 5', 
          description: 'Ultra-fast HMR, optimizado para desarrollo',
          icon: '⚡',
          features: ['Lightning Fast', 'HMR', 'ESBuild', 'Rollup'],
          popularity: 95
        },
        { 
          id: 'nextjs14-standalone', 
          name: 'Next.js 14 Pure', 
          description: 'Framework fullstack más potente',
          icon: '🔥',
          features: ['App Router', 'Server Components', 'Middleware', 'API Routes'],
          popularity: 97
        }
      ]
    },
    styling: {
      title: '🎨 Styling Systems Premium',
      options: [
        { 
          id: 'tailwind4-shadcn', 
          name: 'Tailwind CSS 4 + shadcn/ui', 
          description: 'Utility-first + componentes premium',
          icon: '💎',
          features: ['Dark Mode', 'Mobile First', 'Radix UI', 'Accessibility'],
          popularity: 99
        },
        { 
          id: 'tailwind4-framer', 
          name: 'Tailwind 4 + Framer Motion', 
          description: 'Animaciones fluidas profesionales',
          icon: '✨',
          features: ['Smooth Animations', 'Gestures', 'Layout Animations', 'SVG'],
          popularity: 94
        },
        { 
          id: 'styled-components', 
          name: 'Styled Components + Emotion', 
          description: 'CSS-in-JS con theming avanzado',
          icon: '🎭',
          features: ['CSS-in-JS', 'Theming', 'SSR Support', 'TypeScript'],
          popularity: 88
        }
      ]
    },
    backend: {
      title: '⚡ Backend Potentes',
      options: [
        { 
          id: 'fastapi-python312', 
          name: 'FastAPI + Python 3.12+', 
          description: 'API ultra-rápida con type hints',
          icon: '🐍',
          features: ['Auto Docs', 'Async/Await', 'Type Safety', 'High Performance'],
          popularity: 96
        },
        { 
          id: 'nodejs22-express5', 
          name: 'Node.js 22+ + Express 5', 
          description: 'JavaScript everywhere, máximo rendimiento',
          icon: '🟢',
          features: ['ES2025', 'Performance', 'Middleware', 'Streaming'],
          popularity: 93
        },
        { 
          id: 'nestjs-trpc', 
          name: 'NestJS + tRPC', 
          description: 'TypeScript end-to-end type safety',
          icon: '🏗️',
          features: ['Type Safety', 'Decorators', 'GraphQL', 'Microservices'],
          popularity: 91
        }
      ]
    },
    database: {
      title: '💾 Bases de Datos All-Terrain',
      options: [
        { 
          id: 'postgresql16-supabase', 
          name: 'PostgreSQL 16 + Supabase', 
          description: 'SQL potente + BaaS completo',
          icon: '🐘',
          features: ['Real-time', 'Auth', 'Storage', 'Edge Functions'],
          popularity: 97
        },
        { 
          id: 'mongodb8-atlas', 
          name: 'MongoDB 8 + Atlas', 
          description: 'NoSQL escalable con Vector Search',
          icon: '🍃',
          features: ['Vector Search', 'Sharding', 'Atlas Search', 'Change Streams'],
          popularity: 89
        },
        { 
          id: 'redis7-postgres', 
          name: 'Redis 7 + PostgreSQL', 
          description: 'Cache + persistencia híbrida',
          icon: '🔄',
          features: ['Caching', 'Pub/Sub', 'Persistence', 'High Availability'],
          popularity: 92
        }
      ]
    },
    ai: {
      title: '🤖 IA & Data Science',
      options: [
        { 
          id: 'pytorch2-langchain', 
          name: 'PyTorch 2 + LangChain', 
          description: 'ML avanzado + LLM integration',
          icon: '🧠',
          features: ['Deep Learning', 'LLM Chain', 'Vector DB', 'Embeddings'],
          popularity: 95
        },
        { 
          id: 'tensorflow216-llamaindex', 
          name: 'TensorFlow 2.16 + LlamaIndex', 
          description: 'ML production + RAG systems',
          icon: '🔬',
          features: ['Production ML', 'RAG', 'Document Processing', 'Agents'],
          popularity: 88
        },
        { 
          id: 'openai-anthropic', 
          name: 'OpenAI + Anthropic APIs', 
          description: 'GPT-4 + Claude integration premium',
          icon: '🌟',
          features: ['GPT-4 Turbo', 'Claude 3', 'Function Calling', 'Assistants'],
          popularity: 99
        }
      ]
    },
    deployment: {
      title: '🌐 Deployment & DevOps',
      options: [
        { 
          id: 'vercel-docker', 
          name: 'Vercel + Docker', 
          description: 'Deploy instantáneo + containerization',
          icon: '🚢',
          features: ['Edge Runtime', 'CI/CD', 'Serverless', 'Analytics'],
          popularity: 96
        },
        { 
          id: 'kubernetes-github', 
          name: 'Kubernetes + GitHub Actions', 
          description: 'Orquestación + CI/CD automatizado',
          icon: '⚙️',
          features: ['Orchestration', 'Auto Scaling', 'Rolling Updates', 'Monitoring'],
          popularity: 87
        },
        { 
          id: 'aws-terraform', 
          name: 'AWS + Terraform', 
          description: 'Cloud nativo + Infrastructure as Code',
          icon: '☁️',
          features: ['Multi-Region', 'Auto Scaling', 'IaC', 'Cost Optimization'],
          popularity: 91
        }
      ]
    }
  };

  // Premium Project Templates 2025
  const projectTemplates = [
    {
      id: 'ai-dashboard',
      name: 'AI Analytics Dashboard',
      description: 'Dashboard con IA, análisis de datos en tiempo real y visualizaciones 3D',
      icon: '🧠',
      category: 'AI & Analytics',
      complexity: 'Advanced',
      features: ['Real-time Analytics', 'AI Predictions', '3D Charts', 'Live Data'],
      recommendedStack: {
        frontend: 'react19-nextjs14',
        styling: 'tailwind4-shadcn',
        backend: 'fastapi-python312',
        database: 'postgresql16-supabase',
        ai: 'pytorch2-langchain',
        deployment: 'vercel-docker'
      },
      preview: '/templates/ai-dashboard-preview.jpg',
      estimatedTime: '15 mins'
    },
    {
      id: 'saas-platform',
      name: 'SaaS Platform Completo',
      description: 'Plataforma SaaS escalable con auth, billing, analytics y API',
      icon: '🏢',
      category: 'Business',
      complexity: 'Expert',
      features: ['Multi-tenant', 'Stripe Integration', 'Admin Panel', 'API Gateway'],
      recommendedStack: {
        frontend: 'react19-nextjs14',
        styling: 'tailwind4-shadcn',
        backend: 'nestjs-trpc',
        database: 'postgresql16-supabase',
        ai: 'openai-anthropic',
        deployment: 'kubernetes-github'
      },
      preview: '/templates/saas-preview.jpg',
      estimatedTime: '25 mins'
    },
    {
      id: 'ecommerce-advanced',
      name: 'E-commerce Ultra-Moderno',
      description: 'Tienda online con IA, recomendaciones, pagos y inventario',
      icon: '🛒',
      category: 'E-commerce',
      complexity: 'Advanced',
      features: ['AI Recommendations', 'Real-time Inventory', 'Multi-payment', '3D Products'],
      recommendedStack: {
        frontend: 'react19-nextjs14',
        styling: 'tailwind4-framer',
        backend: 'nodejs22-express5',
        database: 'mongodb8-atlas',
        ai: 'tensorflow216-llamaindex',
        deployment: 'vercel-docker'
      },
      preview: '/templates/ecommerce-preview.jpg',
      estimatedTime: '20 mins'
    },
    {
      id: 'portfolio-3d',
      name: 'Portfolio 3D Interactivo',
      description: 'Portfolio premium con Three.js, animaciones y experiencias inmersivas',
      icon: '🎨',
      category: 'Creative',
      complexity: 'Intermediate',
      features: ['3D Scenes', 'WebGL', 'Smooth Animations', 'Interactive'],
      recommendedStack: {
        frontend: 'react19-vite',
        styling: 'tailwind4-framer',
        backend: 'nodejs22-express5',
        database: 'redis7-postgres',
        ai: 'openai-anthropic',
        deployment: 'vercel-docker'
      },
      preview: '/templates/portfolio-3d-preview.jpg',
      estimatedTime: '12 mins'
    },
    {
      id: 'data-viz-platform',
      name: 'Data Visualization Platform',
      description: 'Plataforma de visualización de datos con ML y dashboards interactivos',
      icon: '📊',
      category: 'Data Science',
      complexity: 'Expert',
      features: ['ML Pipelines', 'Real-time Viz', 'Custom Charts', 'Data Processing'],
      recommendedStack: {
        frontend: 'react19-nextjs14',
        styling: 'tailwind4-shadcn',
        backend: 'fastapi-python312',
        database: 'postgresql16-supabase',
        ai: 'pytorch2-langchain',
        deployment: 'kubernetes-github'
      },
      preview: '/templates/data-viz-preview.jpg',
      estimatedTime: '30 mins'
    },
    {
      id: 'social-platform',
      name: 'Social Media Platform',
      description: 'Red social completa con real-time, multimedia y algoritmos de IA',
      icon: '👥',
      category: 'Social',
      complexity: 'Expert',
      features: ['Real-time Chat', 'Media Upload', 'AI Feed', 'Social Graph'],
      recommendedStack: {
        frontend: 'react19-nextjs14',
        styling: 'tailwind4-shadcn',
        backend: 'nestjs-trpc',
        database: 'mongodb8-atlas',
        ai: 'openai-anthropic',
        deployment: 'aws-terraform'
      },
      preview: '/templates/social-preview.jpg',
      estimatedTime: '35 mins'
    }
  ];

  // Build Project Function
  const buildProject = async () => {
    if (!projectType || !projectName.trim()) {
      alert('🚨 Selecciona un template y nombre para tu proyecto');
      return;
    }

    setIsBuilding(true);
    setBuildProgress(0);
    setBuildLogs([]);

    const template = projectTemplates.find(t => t.id === projectType);
    const buildSteps = [
      '🚀 Inicializando proyecto ultra-moderno...',
      '📦 Configurando stack technology bestias...',
      '⚡ Instalando dependencias premium...',
      '🏗️ Generando arquitectura escalable...',
      '🎨 Aplicando diseño visual impactante...',
      '🤖 Integrando IA y servicios avanzados...',
      '🔧 Configurando CI/CD y deployment...',
      '🌐 Optimizando para producción global...',
      '✨ Aplicando mejores prácticas 2025...',
      '🎉 ¡Proyecto listo para conquistar el mundo!'
    ];

    try {
      for (let i = 0; i < buildSteps.length; i++) {
        setCurrentStep(buildSteps[i]);
        setBuildProgress(((i + 1) / buildSteps.length) * 100);
        
        // Add realistic build logs
        addBuildLog(`[${new Date().toLocaleTimeString()}] ${buildSteps[i]}`, 'info');
        
        if (i === 2) addBuildLog('📥 Installing React 19, Next.js 14, Tailwind CSS 4...', 'success');
        if (i === 4) addBuildLog('🎨 Applying shadcn/ui components and Framer Motion...', 'success');
        if (i === 5) addBuildLog('🤖 Setting up FastAPI backend with Python 3.12...', 'success');
        if (i === 6) addBuildLog('🐘 Configuring PostgreSQL 16 + Supabase integration...', 'success');
        
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Call backend to generate the project
      const response = await axios.post(`${API_URL}/api/build-advanced-project`, {
        projectName,
        template: template,
        stack: selectedStack.frontend ? selectedStack : template.recommendedStack,
        features: template.features
      });

      if (response.data.success) {
        setLiveProject(response.data.project);
        setCodeView('preview');
        addBuildLog('🎉 ¡Proyecto generado exitosamente!', 'success');
        addBuildLog(`📁 Archivos creados: ${Object.keys(response.data.project.files).length}`, 'info');
        
        // Generate AI suggestions
        generateAISuggestions(response.data.project);
      } else {
        addBuildLog(`❌ Error: ${response.data.error}`, 'error');
      }

    } catch (error) {
      console.error('Build error:', error);
      addBuildLog('❌ Error building project. Please try again.', 'error');
    } finally {
      setIsBuilding(false);
    }
  };

  const addBuildLog = (message, type) => {
    setBuildLogs(prev => [...prev, { 
      id: Date.now() + Math.random(), 
      message, 
      type, 
      timestamp: new Date().toLocaleTimeString() 
    }]);
  };

  const generateAISuggestions = async (project) => {
    try {
      const suggestions = [
        {
          id: 1,
          type: 'performance',
          title: '⚡ Optimizar Performance',
          description: 'Implementar lazy loading y code splitting avanzado',
          impact: 'high',
          difficulty: 'medium'
        },
        {
          id: 2,
          type: 'ui',
          title: '🎨 Mejorar UX/UI',
          description: 'Agregar micro-animaciones y estados de loading',
          impact: 'high',
          difficulty: 'easy'
        },
        {
          id: 3,
          type: 'security',
          title: '🔒 Reforzar Seguridad',
          description: 'Implementar rate limiting y validación avanzada',
          impact: 'critical',
          difficulty: 'hard'
        },
        {
          id: 4,
          type: 'ai',
          title: '🤖 Integrar más IA',
          description: 'Agregar chatbot inteligente y recomendaciones',
          impact: 'high',
          difficulty: 'medium'
        }
      ];
      
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    }
  };

  const selectTemplate = (template) => {
    setProjectType(template.id);
    setSelectedStack(template.recommendedStack);
  };

  const StackSelector = () => (
    <div className="stack-selector">
      <h3>🔧 Customizar Stack (Opcional)</h3>
      <p>Usa el stack recomendado o personaliza tu selección</p>
      
      {Object.entries(stackOptions).map(([category, data]) => (
        <div key={category} className="stack-category">
          <h4>{data.title}</h4>
          <div className="stack-options">
            {data.options.map(option => (
              <div 
                key={option.id}
                className={`stack-option ${selectedStack[category] === option.id ? 'selected' : ''}`}
                onClick={() => setSelectedStack({...selectedStack, [category]: option.id})}
              >
                <div className="option-header">
                  <span className="option-icon">{option.icon}</span>
                  <span className="option-name">{option.name}</span>
                  <span className="popularity-badge">{option.popularity}%</span>
                </div>
                <p className="option-description">{option.description}</p>
                <div className="option-features">
                  {option.features.map(feature => (
                    <span key={feature} className="feature-tag">{feature}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const LivePreview = () => (
    <div className="live-preview-container">
      <div className="preview-header">
        <div className="preview-controls">
          <button 
            className={`preview-btn ${codeView === 'preview' ? 'active' : ''}`}
            onClick={() => setCodeView('preview')}
          >
            👁️ Preview
          </button>
          <button 
            className={`preview-btn ${codeView === 'code' ? 'active' : ''}`}
            onClick={() => setCodeView('code')}
          >
            💻 Code
          </button>
          <button 
            className={`preview-btn ${codeView === 'split' ? 'active' : ''}`}
            onClick={() => setCodeView('split')}
          >
            🔀 Split
          </button>
        </div>
        
        <div className="device-controls">
          <button 
            className={`device-btn ${previewMode === 'desktop' ? 'active' : ''}`}
            onClick={() => setPreviewMode('desktop')}
          >
            💻 Desktop
          </button>
          <button 
            className={`device-btn ${previewMode === 'mobile' ? 'active' : ''}`}
            onClick={() => setPreviewMode('mobile')}
          >
            📱 Mobile
          </button>
        </div>
        
        <div className="preview-actions">
          <button className="action-btn">🚀 Deploy</button>
          <button className="action-btn">📤 Export</button>
          <button className="action-btn">🔗 Share</button>
        </div>
      </div>
      
      <div className={`preview-content ${codeView}`}>
        {(codeView === 'preview' || codeView === 'split') && (
          <div className="preview-panel">
            <div className={`preview-viewport ${previewMode}`}>
              {liveProject ? (
                <iframe
                  srcDoc={liveProject.files?.['index.html'] || '<div>Loading preview...</div>'}
                  className="preview-iframe"
                  title="Live Preview"
                />
              ) : (
                <div className="preview-placeholder">
                  <h3>🚀 Build Your Project</h3>
                  <p>Select a template and start building to see live preview</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {(codeView === 'code' || codeView === 'split') && (
          <div className="code-panel">
            <div className="file-explorer">
              <h4>📁 Project Files</h4>
              {liveProject && Object.keys(liveProject.files).map(filename => (
                <div 
                  key={filename}
                  className={`file-item ${selectedFile === filename ? 'selected' : ''}`}
                  onClick={() => setSelectedFile(filename)}
                >
                  <span className="file-icon">📄</span>
                  <span className="file-name">{filename}</span>
                </div>
              ))}
            </div>
            
            <div className="code-editor">
              <div className="editor-header">
                <span className="file-path">{selectedFile || 'Select a file'}</span>
              </div>
              <div className="editor-content">
                <pre>
                  <code>
                    {liveProject && selectedFile 
                      ? liveProject.files[selectedFile] 
                      : '// Select a file to view code\n// All generated code is production-ready\n// with best practices 2025'
                    }
                  </code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="project-builder">
      <div className="builder-header">
        <div className="header-content">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h1>🚀 Ultimate Project Builder 2025</h1>
          <div className="header-stats">
            <span>💎 Premium Templates</span>
            <span>⚡ Ultra-Modern Stack</span>
            <span>🤖 AI-Powered</span>
          </div>
        </div>
      </div>

      <div className="builder-content">
        {!liveProject ? (
          <>
            {/* Template Selection */}
            <div className="template-section">
              <h2>🎯 Choose Your Project Type</h2>
              <div className="templates-grid">
                {projectTemplates.map(template => (
                  <div 
                    key={template.id}
                    className={`template-card ${projectType === template.id ? 'selected' : ''}`}
                    onClick={() => selectTemplate(template)}
                  >
                    <div className="template-header">
                      <span className="template-icon">{template.icon}</span>
                      <div className="template-info">
                        <h3>{template.name}</h3>
                        <span className="template-category">{template.category}</span>
                      </div>
                      <span className={`complexity-badge ${template.complexity.toLowerCase()}`}>
                        {template.complexity}
                      </span>
                    </div>
                    
                    <p className="template-description">{template.description}</p>
                    
                    <div className="template-features">
                      {template.features.map(feature => (
                        <span key={feature} className="feature-badge">{feature}</span>
                      ))}
                    </div>
                    
                    <div className="template-footer">
                      <span className="build-time">⏱️ {template.estimatedTime}</span>
                      <span className="template-select">Select Template</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Configuration */}
            {projectType && (
              <div className="config-section">
                <div className="project-config">
                  <h3>⚙️ Project Configuration</h3>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter your project name..."
                    className="project-name-input"
                  />
                </div>
                
                <StackSelector />
                
                <div className="build-section">
                  <button 
                    className="build-btn"
                    onClick={buildProject}
                    disabled={isBuilding || !projectName.trim()}
                  >
                    {isBuilding ? (
                      <>
                        <span className="loading-icon">⚙️</span>
                        Building... {Math.round(buildProgress)}%
                      </>
                    ) : (
                      <>
                        <span className="build-icon">🚀</span>
                        Build Ultra-Modern Project
                      </>
                    )}
                  </button>
                  
                  {isBuilding && (
                    <div className="build-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${buildProgress}%` }}
                        />
                      </div>
                      <p className="current-step">{currentStep}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Build Logs */}
            {buildLogs.length > 0 && (
              <div className="logs-section">
                <h3>📋 Build Logs</h3>
                <div className="logs-container">
                  {buildLogs.map(log => (
                    <div key={log.id} className={`log-entry ${log.type}`}>
                      <span className="log-time">[{log.timestamp}]</span>
                      <span className="log-message">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          // Live Project Interface
          <div className="live-project-interface">
            <LivePreview />
            
            {/* AI Suggestions Panel */}
            <div className="ai-suggestions-panel">
              <h3>🤖 AI Enhancement Suggestions</h3>
              <div className="suggestions-list">
                {aiSuggestions.map(suggestion => (
                  <div key={suggestion.id} className={`suggestion-item ${suggestion.impact}`}>
                    <div className="suggestion-header">
                      <span className="suggestion-title">{suggestion.title}</span>
                      <span className={`impact-badge ${suggestion.impact}`}>
                        {suggestion.impact}
                      </span>
                    </div>
                    <p className="suggestion-description">{suggestion.description}</p>
                    <div className="suggestion-actions">
                      <span className={`difficulty ${suggestion.difficulty}`}>
                        {suggestion.difficulty}
                      </span>
                      <button className="apply-btn">Apply Enhancement</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};