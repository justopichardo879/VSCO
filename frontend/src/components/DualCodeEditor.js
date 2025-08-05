import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import SplitPane from 'react-split-pane';
import * as Babel from '@babel/standalone';
import axios from 'axios';
import './DualCodeEditor.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// 🔥 DUAL CODE EDITOR - TIEMPO REAL
export const DualCodeEditor = ({ 
  initialCode = '',
  framework = 'react',
  onCodeChange = () => {},
  onError = () => {},
  theme = 'dark',
  language = 'typescript',
  projectId = null, // Para cargar proyectos existentes
  onBack = null, // Función para volver atrás
  generationData = null, // NEW: Datos para generación en tiempo real
  onGenerationComplete = () => {} // NEW: Callback cuando se completa la generación
}) => {
  // Estados principales
  const [code, setCode] = useState(initialCode);
  const [compiledCode, setCompiledCode] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [errors, setErrors] = useState([]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(theme);
  
  // Estados para manejo de proyectos
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estados para generación en tiempo real
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedContent, setGeneratedContent] = useState('');
  
  // Referencias
  const editorRef = useRef(null);
  const previewRef = useRef(null);
  const compileTimeoutRef = useRef(null);
  const generationIntervalRef = useRef(null);

  // Templates iniciales para diferentes frameworks
  const templates = {
    react: `import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">🚀 Mi Aplicación React</h1>
        <p className="subtitle">Editor en tiempo real</p>
        
        <div className="counter-section">
          <button 
            className="btn btn-primary"
            onClick={() => setCount(count - 1)}
          >
            -
          </button>
          <span className="counter">{count}</span>
          <button 
            className="btn btn-primary"
            onClick={() => setCount(count + 1)}
          >
            +
          </button>
        </div>

        <div className="features">
          <div className="feature-card">
            <h3>⚡ Tiempo Real</h3>
            <p>Edita el código y ve los cambios instantáneamente</p>
          </div>
          <div className="feature-card">
            <h3>🎨 Moderna</h3>
            <p>Interfaz limpia y profesional</p>
          </div>
          <div className="feature-card">
            <h3>📱 Responsive</h3>
            <p>Se adapta a cualquier dispositivo</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;`,
    
    nextjs: `import React, { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [message, setMessage] = useState('¡Hola Next.js 14!');

  return (
    <>
      <Head>
        <title>Mi App Next.js</title>
      </Head>
      <main className="container">
        <h1 className="title">{message}</h1>
        <button 
          className="btn"
          onClick={() => setMessage('¡Código actualizado en tiempo real!')}
        >
          Cambiar Mensaje
        </button>
      </main>
    </>
  );
}`,

    html: `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mi Aplicación Web</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            background: white;
            padding: 2rem;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
        }
        
        .title {
            color: #333;
            margin-bottom: 1rem;
            font-size: 2rem;
        }
        
        .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 10px;
            cursor: pointer;
            font-size: 1rem;
            transition: transform 0.2s;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">🎨 Editor en Tiempo Real</h1>
        <p>Modifica este código y ve los cambios instantáneamente</p>
        <br>
        <button class="btn" onclick="changeColor()">Cambiar Color</button>
    </div>
    
    <script>
        function changeColor() {
            const colors = ['#667eea', '#f093fb', '#f5576c', '#4facfe', '#43e97b'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            document.body.style.background = \`linear-gradient(135deg, \${randomColor} 0%, #764ba2 100%)\`;
        }
    </script>
</body>
</html>`
  };

  // CSS base para React/Next.js
  const baseCSS = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.container {
  background: white;
  padding: 3rem;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.1);
  max-width: 800px;
  width: 100%;
  text-align: center;
}

.title {
  font-size: 3rem;
  color: #333;
  margin-bottom: 1rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #666;
  font-size: 1.2rem;
  margin-bottom: 2rem;
}

.counter-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin: 2rem 0;
}

.counter {
  font-size: 3rem;
  font-weight: bold;
  color: #667eea;
  min-width: 100px;
}

.btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.btn-primary {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.feature-card {
  background: #f8f9ff;
  padding: 2rem;
  border-radius: 15px;
  border: 2px solid #e5e7f0;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.feature-card h3 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .container {
    padding: 2rem;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .counter-section {
    flex-direction: column;
    gap: 1rem;
  }
  
  .features {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}`;

  // Inicializar código, cargar proyectos y manejar generación en tiempo real
  useEffect(() => {
    loadProjects();
    
    if (generationData) {
      // Iniciar generación en tiempo real
      startRealTimeGeneration(generationData);
    } else if (projectId) {
      loadProject(projectId);
    } else if (!initialCode) {
      const template = templates[framework] || templates.react;
      setCode(template);
    }
    
    // Cleanup al desmontar componente
    return () => {
      if (generationIntervalRef.current) {
        clearInterval(generationIntervalRef.current);
      }
    };
  }, [framework, initialCode, projectId, generationData]);

  // Función para cargar proyectos desde la API
  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/projects`);
      if (response.data && response.data.projects) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      console.error('Error cargando proyectos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar un proyecto específico
  const loadProject = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/projects/${id}`);
      if (response.data && response.data.success) {
        const project = response.data.project;
        setCurrentProject(project);
        
        // Extraer código HTML del proyecto
        let htmlContent = '';
        if (project.files && Array.isArray(project.files)) {
          const htmlFile = project.files.find(file => 
            file.filename && file.filename.toLowerCase().includes('html')
          );
          if (htmlFile && htmlFile.content) {
            htmlContent = htmlFile.content;
          }
        } else if (project.files && typeof project.files === 'object') {
          htmlContent = project.files['index.html'] || project.files['main.html'] || '';
        }
        
        if (htmlContent) {
          setCode(htmlContent);
          setCurrentTheme('light'); // HTML se ve mejor en tema claro
        } else {
          // Si no hay HTML, usar template por defecto
          const template = templates[framework] || templates.react;
          setCode(template);
        }
      }
    } catch (error) {
      console.error('Error cargando proyecto:', error);
      setErrors(['Error cargando proyecto: ' + error.message]);
    } finally {
      setLoading(false);
    }
  };

  // Función para guardar proyecto
  const saveProject = async () => {
    if (!currentProject) {
      // Crear nuevo proyecto
      return await createNewProject();
    }

    try {
      setSaving(true);
      
      // Actualizar el proyecto existente
      const updatedFiles = currentProject.files.map(file => {
        if (file.filename && file.filename.toLowerCase().includes('html')) {
          return { ...file, content: code };
        }
        return file;
      });

      // Si no había archivo HTML, crear uno
      if (!updatedFiles.some(f => f.filename && f.filename.toLowerCase().includes('html'))) {
        updatedFiles.push({
          filename: 'index.html',
          content: code
        });
      }

      const response = await axios.put(`${API_URL}/api/projects/${currentProject.id}`, {
        name: currentProject.name,
        description: currentProject.description,
        files: updatedFiles
      });

      if (response.data.success) {
        alert('✅ Proyecto guardado exitosamente');
        await loadProjects(); // Recargar lista de proyectos
      }
    } catch (error) {
      console.error('Error guardando proyecto:', error);
      alert('❌ Error guardando proyecto: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Función para crear nuevo proyecto
  const createNewProject = async () => {
    const projectName = prompt('Nombre del nuevo proyecto:');
    if (!projectName) return;

    try {
      setSaving(true);
      
      const response = await axios.post(`${API_URL}/api/generate-website`, {
        prompt: `Crear proyecto personalizado: ${projectName}`,
        website_type: 'landing',
        provider: 'openai',
        files: [{
          filename: 'index.html',
          content: code
        }],
        name: projectName,
        description: 'Proyecto creado desde el editor de código'
      });

      if (response.data.success) {
        setCurrentProject(response.data);
        alert('✅ Nuevo proyecto creado exitosamente');
        await loadProjects();
      }
    } catch (error) {
      console.error('Error creando proyecto:', error);
      alert('❌ Error creando proyecto: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Compilar código en tiempo real
  const compileCode = useCallback(async (sourceCode) => {
    if (!sourceCode.trim()) return;
    
    setIsCompiling(true);
    setErrors([]);

    try {
      if (framework === 'html') {
        // Para HTML puro, usar directamente
        setPreviewContent(sourceCode);
        setCompiledCode(sourceCode);
      } else {
        // Para React/Next.js, compilar con Babel
        const result = Babel.transform(sourceCode, {
          presets: [
            ['@babel/preset-react', { runtime: 'automatic' }],
            '@babel/preset-typescript'
          ],
          filename: 'App.tsx'
        });

        setCompiledCode(result.code);
        
        // Crear HTML completo para preview
        const fullHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview en Tiempo Real</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <style>
        ${baseCSS}
    </style>
</head>
<body>
    <div id="root"></div>
    <script>
        try {
            ${result.code}
            
            // Renderizar la aplicación
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(React.createElement(App));
        } catch (error) {
            document.body.innerHTML = \`
                <div style="padding: 2rem; color: red; font-family: monospace;">
                    <h2>❌ Error en el código:</h2>
                    <pre>\${error.message}</pre>
                </div>
            \`;
        }
    </script>
</body>
</html>`;
        
        setPreviewContent(fullHTML);
      }
    } catch (error) {
      console.error('Compilation error:', error);
      setErrors([error.message]);
      onError(error);
      
      // Mostrar error en preview
      const errorHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error de Compilación</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a;
            color: #ff6b6b;
            padding: 2rem;
            margin: 0;
        }
        .error-container {
            background: #2d1b1b;
            border: 2px solid #ff6b6b;
            border-radius: 10px;
            padding: 2rem;
        }
        .error-title {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .error-message {
            background: #1a1a1a;
            padding: 1rem;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            overflow: auto;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-title">
            <span>❌</span>
            Error de Compilación
        </div>
        <div class="error-message">${error.message}</div>
    </div>
</body>
</html>`;
      
      setPreviewContent(errorHTML);
    } finally {
      setIsCompiling(false);
    }
  }, [framework, onError]);

  // Manejar cambios en el código con debounce
  const handleCodeChange = useCallback((value) => {
    setCode(value);
    onCodeChange(value);

    // Debounce la compilación para evitar sobrecarga
    if (compileTimeoutRef.current) {
      clearTimeout(compileTimeoutRef.current);
    }
    
    compileTimeoutRef.current = setTimeout(() => {
      compileCode(value);
    }, 300);
  }, [compileCode, onCodeChange]);

  // Configurar editor cuando esté listo
  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    
    // Configurar Monaco Editor
    monaco.editor.defineTheme('customDark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1a1a1a',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editor.selectionBackground': '#264f78',
        'editor.selectionHighlightBackground': '#364559',
      }
    });
    
    monaco.editor.setTheme(currentTheme === 'dark' ? 'customDark' : 'light');
    
    // Autocompletado y shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Ctrl+S para formatear código
      editor.getAction('editor.action.formatDocument').run();
    });

    // Compilar código inicial
    if (code) {
      compileCode(code);
    }
  }, [currentTheme, code, compileCode]);

  return (
    <div className={`dual-code-editor ${currentTheme}`}>
      {/* Header con controles */}
      <div className="editor-header">
        <div className="editor-title">
          <div className="title-left">
            {onBack && (
              <button className="back-button" onClick={onBack}>
                <span className="icon">←</span>
                Volver
              </button>
            )}
            <span className="icon">⚡</span>
            <h3>Editor de Código en Tiempo Real</h3>
            {isCompiling && <span className="compiling-indicator">🔄 Compilando...</span>}
            {currentProject && (
              <span className="current-project">
                📄 {currentProject.name || 'Proyecto sin nombre'}
              </span>
            )}
          </div>
        </div>
        
        <div className="editor-controls">
          {/* Selector de proyecto */}
          <select 
            value={currentProject?.id || ''} 
            onChange={(e) => {
              if (e.target.value) {
                loadProject(e.target.value);
              } else {
                // Crear nuevo proyecto
                setCurrentProject(null);
                const template = templates[framework] || templates.react;
                setCode(template);
              }
            }}
            className="project-selector"
            disabled={loading}
          >
            <option value="">➕ Nuevo Proyecto</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                📄 {project.name || `Proyecto ${project.id.slice(-4)}`}
              </option>
            ))}
          </select>
          
          <select 
            value={framework} 
            onChange={(e) => {
              const newFramework = e.target.value;
              if (!currentProject) {
                setCode(templates[newFramework]);
              }
            }}
            className="framework-selector"
          >
            <option value="react">⚛️ React</option>
            <option value="nextjs">▲ Next.js</option>
            <option value="html">🌐 HTML/CSS/JS</option>
          </select>
          
          <button
            onClick={() => setCurrentTheme(currentTheme === 'dark' ? 'light' : 'dark')}
            className="theme-toggle"
          >
            {currentTheme === 'dark' ? '☀️' : '🌙'}
          </button>
          
          <button 
            onClick={saveProject}
            disabled={saving || loading}
            className="save-btn"
          >
            {saving ? '💾 Guardando...' : '💾 Guardar'}
          </button>
          
          <button 
            onClick={() => {
              navigator.clipboard.writeText(code);
              alert('¡Código copiado al portapapeles!');
            }}
            className="copy-btn"
          >
            📋 Copiar
          </button>
          
          <button 
            onClick={() => {
              const blob = new Blob([code], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${currentProject?.name || 'app'}.${framework === 'html' ? 'html' : 'js'}`;
              a.click();
            }}
            className="download-btn"
          >
            💾 Descargar
          </button>
        </div>
      </div>

      {/* Error display */}
      {errors.length > 0 && (
        <div className="error-banner">
          <span className="error-icon">❌</span>
          <span>Error de compilación: {errors[0]}</span>
        </div>
      )}

      {/* Split Panes */}
      <SplitPane 
        split="vertical" 
        defaultSize="50%" 
        minSize={300}
        className="split-pane-custom"
      >
        {/* Panel Izquierdo - Editor */}
        <div className="code-panel">
          <div className="panel-header">
            <span className="panel-title">📝 Código</span>
            <span className="language-badge">{language.toUpperCase()}</span>
          </div>
          
          <Editor
            height="calc(100vh - 140px)"
            language={framework === 'html' ? 'html' : 'typescript'}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            theme={currentTheme === 'dark' ? 'vs-dark' : 'light'}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              suggest: {
                enabled: true,
                showKeywords: true,
                showSnippets: true,
              },
              quickSuggestions: {
                other: true,
                comments: false,
                strings: false
              },
              bracketPairColorization: { enabled: true },
              guides: {
                indentation: true,
                bracketPairs: true
              }
            }}
          />
        </div>

        {/* Panel Derecho - Preview */}
        <div className="preview-panel">
          <div className="panel-header">
            <span className="panel-title">👁️ Vista Previa</span>
            <div className="preview-controls">
              <button 
                onClick={() => previewRef.current?.reload()}
                className="refresh-btn"
                title="Refrescar"
              >
                🔄
              </button>
              <button 
                onClick={() => {
                  if (previewRef.current?.requestFullscreen) {
                    previewRef.current.requestFullscreen();
                  }
                }}
                className="fullscreen-btn"
                title="Pantalla completa"
              >
                🔳
              </button>
            </div>
          </div>
          
          <iframe
            ref={previewRef}
            srcDoc={previewContent}
            className="preview-iframe"
            title="Vista previa en tiempo real"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      </SplitPane>
    </div>
  );
};

export default DualCodeEditor;