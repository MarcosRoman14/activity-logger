import React, { useState, useEffect } from 'react';
import { Task, AppConfig, TaskStatus } from './types';
import QuickCapture from './components/QuickCapture';
import TaskTable from './components/TaskTable';
import ExportPanel from './components/ExportPanel';
import Configuration from './components/Configuration';
import { parseRawTask } from './utils';
import { 
  Terminal, 
  Settings, 
  FolderLock, 
  FileText, 
  Layers, 
  FileCheck, 
  ExternalLink,
  ChevronRight,
  Plus,
  RefreshCw,
  FolderOpen,
  Keyboard,
  Minimize2,
  Square,
  X,
  FileCode,
  AlertTriangle
} from 'lucide-react';

export default function App() {
  // State for active view
  const [activeTab, setActiveTab] = useState<'log' | 'export' | 'config' | 'backup'>('log');

  // Application settings
  const [config, setConfig] = useState<AppConfig>({
    userInitials: 'MR',
    dataDir: './data',
    exportDir: './exports',
    hotkey: 'Alt+T',
  });

  // Task lists
  const [tasks, setTasks] = useState<Task[]>([]);
  const [backupInfo, setBackupInfo] = useState<{
    dataDir: string;
    exportDir: string;
    resolvedDataDir: string;
    resolvedExportDir: string;
    dataFiles: string[];
    exportFiles: string[];
  } | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Quick capture float overlay visibility
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);

  // Edit Task modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Fetch configuration, tasks, and file backups
  const loadAllData = async () => {
    setLoading(true);
    setGlobalError(null);
    try {
      // Load configuration
      const configRes = await fetch('/api/config');
      if (!configRes.ok) throw new Error('Error al cargar la configuración');
      const configData = await configRes.json();
      setConfig(configData);

      // Load tasks
      const tasksRes = await fetch('/api/tasks');
      if (!tasksRes.ok) throw new Error('Error al cargar las actividades');
      const tasksData = await tasksRes.json();
      setTasks(tasksData);

      // Load backup info
      const backupRes = await fetch('/api/backup');
      if (backupRes.ok) {
        const backupData = await backupRes.json();
        setBackupInfo(backupData);
      }
    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || 'Error de conexión con el servidor local');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Save new configuration to backend
  const handleSaveConfig = async (newConfig: AppConfig) => {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig),
    });
    if (!res.ok) throw new Error('Error al guardar la configuración');
    const data = await res.json();
    setConfig(data.config);
    // Refresh files list as directories might have changed
    const backupRes = await fetch('/api/backup');
    if (backupRes.ok) {
      setBackupInfo(await backupRes.json());
    }
  };

  // Create a new task (by raw line capture)
  const handleCreateTask = async (rawText: string) => {
    const parsed = parseRawTask(rawText);
    if (!parsed.isValid) return;

    // Default to today's date (YYYY-MM-DD)
    const todayStr = new Date().toISOString().split('T')[0];

    const payload = {
      date: todayStr,
      status: 'Reportado',
      type: parsed.type || 'Sys',
      category: parsed.category || 'Otr',
      description: parsed.description || rawText,
      duration: parsed.duration || '1 hr',
      rawText: rawText,
    };

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Error al registrar la actividad');
      const data = await res.json();
      
      // Update local task list
      setTasks(prev => [...prev, data.task]);
      setIsQuickCaptureOpen(false); // Hide window as per prompt

      // Refresh backup list
      const backupRes = await fetch('/api/backup');
      if (backupRes.ok) {
        setBackupInfo(await backupRes.json());
      }
    } catch (e) {
      alert('Error: No se pudo guardar la actividad');
      console.error(e);
    }
  };

  // Update a task (edit or change status)
  const handleUpdateTask = async (id: string, updatedFields: Partial<Task>) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      if (!res.ok) throw new Error('Error al actualizar');
      const data = await res.json();

      setTasks(prev => prev.map(t => t.id === id ? data.task : t));
    } catch (e) {
      console.error(e);
      alert('Error al actualizar la actividad');
    }
  };

  // Delete a task
  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar');
      setTasks(prev => prev.filter(t => t.id !== id));
      
      // Refresh backup list
      const backupRes = await fetch('/api/backup');
      if (backupRes.ok) {
        setBackupInfo(await backupRes.json());
      }
    } catch (e) {
      console.error(e);
      alert('Error al eliminar la actividad');
    }
  };

  // Handle Exporting trigger
  const handleExportTasks = async (exportParams: {
    type: 'all' | 'day' | 'range';
    specificDate?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exportParams),
    });
    if (!res.ok) throw new Error('Error en exportación');
    const data = await res.json();
    
    // Refresh backup list
    const backupRes = await fetch('/api/backup');
    if (backupRes.ok) {
      setBackupInfo(await backupRes.json());
    }
    return data;
  };

  // Keybind listeners (Alt+T or Ctrl+Space etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Normalize hotkey checks
      const key = e.key.toLowerCase();
      const isAlt = e.altKey;
      const isCtrl = e.ctrlKey;
      const isShift = e.shiftKey;

      if (config.hotkey === 'Alt+T' && isAlt && key === 't') {
        e.preventDefault();
        setIsQuickCaptureOpen(prev => !prev);
      } else if (config.hotkey === 'Ctrl+Space' && isCtrl && e.code === 'Space') {
        e.preventDefault();
        setIsQuickCaptureOpen(prev => !prev);
      } else if (config.hotkey === 'Ctrl+Shift+T' && isCtrl && isShift && key === 't') {
        e.preventDefault();
        setIsQuickCaptureOpen(prev => !prev);
      } else if (config.hotkey === 'Alt+Q' && isAlt && key === 'q') {
        e.preventDefault();
        setIsQuickCaptureOpen(prev => !prev);
      }

      // Allow Escape key to close quick capture or edit modal
      if (e.key === 'Escape') {
        setIsQuickCaptureOpen(false);
        setEditingTask(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.hotkey]);

  // Execute actual modal edit updates
  const submitEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    await handleUpdateTask(editingTask.id, {
      type: editingTask.type,
      category: editingTask.category,
      duration: editingTask.duration,
      description: editingTask.description,
      status: editingTask.status,
      date: editingTask.date,
    });
    setEditingTask(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col p-2 sm:p-4 font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Simulation Window Container */}
      <div className="max-w-7xl w-full mx-auto bg-slate-50 rounded-xl border border-slate-300/80 shadow-2xl flex flex-col overflow-hidden flex-1 min-h-[85vh]">
        
        {/* Mock Windows Frame Titlebar */}
        <div className="bg-slate-800 text-slate-300 px-4 py-2 flex items-center justify-between select-none border-b border-slate-900">
          <div className="flex items-center space-x-2.5">
            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center border border-blue-500 shadow-inner">
              <Terminal className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-bold font-mono tracking-wider text-slate-100 flex items-center gap-1.5">
              ACTIVITY LOGGER v1.0.4 — WINDOWS DESKTOP SUITE [OFFLINE]
              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] px-1.5 py-0.2 rounded uppercase font-bold tracking-normal">
                Almacenamiento Local JSON Activo
              </span>
            </span>
          </div>

          {/* Titlebar Window Buttons */}
          <div className="flex items-center space-x-1.5">
            <div className="text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-400 font-mono px-2 py-0.5 rounded cursor-help" title="Atajo de captura activa">
              Atajo: <span className="font-bold text-white">{config.hotkey}</span>
            </div>
            <span className="text-slate-600 text-xs">|</span>
            <button className="w-6 h-6 hover:bg-slate-700 flex items-center justify-center rounded text-slate-400 hover:text-slate-200 transition-colors">
              <Minimize2 className="w-3 h-3" />
            </button>
            <button className="w-6 h-6 hover:bg-slate-700 flex items-center justify-center rounded text-slate-400 hover:text-slate-200 transition-colors">
              <Square className="w-2.5 h-2.5" />
            </button>
            <button 
              onClick={() => { if(confirm('¿Deseas simular el cierre de la aplicación de escritorio?')) window.close(); }}
              className="w-6 h-6 hover:bg-rose-600 hover:text-white flex items-center justify-center rounded text-slate-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Top Notification / Shortcut Reminder Bar */}
        <div className="bg-blue-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between flex-wrap gap-2 shadow-inner">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-blue-100 animate-pulse" />
            <span>
              Captura rápida disponible: Presiona <kbd className="bg-blue-800 text-white font-mono px-1.5 py-0.5 rounded text-[11px] border border-blue-500 shadow-xs font-bold">{config.hotkey}</kbd> para abrir el diálogo flotante en cualquier momento.
            </span>
          </div>
          <button
            onClick={() => setIsQuickCaptureOpen(true)}
            className="bg-white text-blue-700 px-3 py-1 rounded-md text-[11px] font-bold shadow-sm hover:bg-slate-100 transition-all flex items-center gap-1 cursor-pointer"
            id="btn-trigger-capture-modal"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva Captura Rápida
          </button>
        </div>

        {/* Main Workspace Frame */}
        <div className="flex flex-col md:flex-row flex-1">
          
          {/* Windows Left Action Sidebar */}
          <div className="w-full md:w-56 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Profile info */}
              <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block font-bold">Usuario Configurado</span>
                <span className="text-sm font-bold text-slate-100 font-display mt-0.5 block">Iniciales: {config.userInitials}</span>
                <span className="text-[10px] text-slate-400 block mt-1">Consectivo de hoy:</span>
                <span className="font-mono text-xs text-blue-400 font-semibold mt-0.5 block">
                  T-{(new Date().toISOString().split('T')[0]).split('-').reverse().join('')}-{config.userInitials}01
                </span>
              </div>

              {/* Navigation Tabs */}
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block mb-2 font-bold">Módulos</span>
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab('log')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      activeTab === 'log' 
                        ? 'bg-blue-600 text-white font-bold shadow-md' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                    id="tab-btn-log"
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="w-4 h-4" /> Actividades Diarias
                    </span>
                    <ChevronRight className="w-3 h-3 opacity-60" />
                  </button>

                  <button
                    onClick={() => setActiveTab('export')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      activeTab === 'export' 
                        ? 'bg-blue-600 text-white font-bold shadow-md' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                    id="tab-btn-export"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Exportar Reportes
                    </span>
                    <ChevronRight className="w-3 h-3 opacity-60" />
                  </button>

                  <button
                    onClick={() => setActiveTab('backup')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      activeTab === 'backup' 
                        ? 'bg-blue-600 text-white font-bold shadow-md' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                    id="tab-btn-backup"
                  >
                    <span className="flex items-center gap-2">
                      <FolderLock className="w-4 h-4" /> Respaldar Datos
                    </span>
                    <ChevronRight className="w-3 h-3 opacity-60" />
                  </button>

                  <button
                    onClick={() => setActiveTab('config')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      activeTab === 'config' 
                        ? 'bg-blue-600 text-white font-bold shadow-md' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                    id="tab-btn-config"
                  >
                    <span className="flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Configuración
                    </span>
                    <ChevronRight className="w-3 h-3 opacity-60" />
                  </button>
                </nav>
              </div>
            </div>

            {/* Storage Diagnostic Card in sidebar */}
            <div className="mt-8 border-t border-slate-800 pt-4 text-[11px] text-slate-500 font-mono space-y-1.5">
              <span className="font-bold text-slate-400 uppercase tracking-wide text-[9px] block">Diagnóstico de Almacenamiento</span>
              <div className="flex items-center justify-between">
                <span>Total cargado:</span>
                <span className="text-slate-300 font-bold">{tasks.length} filas</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Ruta local:</span>
                <span className="text-slate-300 truncate max-w-[100px]" title={config.dataDir}>{config.dataDir}</span>
              </div>
            </div>
          </div>

          {/* Right Main Panel Container */}
          <main className="flex-1 p-4 sm:p-6 bg-slate-50 overflow-y-auto">
            {globalError && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-4 text-xs text-rose-800 flex gap-2.5 items-start">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Error de sincronización con almacenamiento</h4>
                  <p className="mt-1">{globalError}</p>
                  <button 
                    onClick={loadAllData}
                    className="mt-2 text-[10px] bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded font-bold cursor-pointer"
                  >
                    Reintentar conexión
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                <span>Consultando almacenamiento local...</span>
              </div>
            ) : (
              <>
                {activeTab === 'log' && (
                  <div className="space-y-6">
                    {/* Render Quick capture dock directly at top of log for easy accessibility too */}
                    <div className="bg-blue-50/20 border border-blue-100 rounded-xl p-4">
                      <div className="max-w-2xl mx-auto">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center font-mono">
                          Captura Rápida Integrada (T:Tipo, C:Categoría, D:Descripción, TM:Tiempo)
                        </span>
                        <QuickCapture 
                          onSave={handleCreateTask} 
                          userInitials={config.userInitials}
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-200/80 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 font-display">
                          Listado de Actividades
                        </h3>
                        <span className="text-xs text-slate-400">
                          Total registradas: <span className="font-bold text-slate-700 font-mono">{tasks.length}</span>
                        </span>
                      </div>
                      <TaskTable 
                        tasks={tasks}
                        onUpdateTask={handleUpdateTask}
                        onDeleteTask={handleDeleteTask}
                        onEditClick={(task) => setEditingTask(task)}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'export' && (
                  <ExportPanel onExport={handleExportTasks} />
                )}

                {activeTab === 'config' && (
                  <Configuration 
                    config={config} 
                    onSaveConfig={handleSaveConfig} 
                  />
                )}

                {activeTab === 'backup' && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto space-y-6">
                    <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                      <FolderLock className="w-5 h-5 text-emerald-600" />
                      <h2 className="text-base font-bold tracking-tight text-slate-800 font-display">
                        SISTEMA DE RESPALDO DIRECTO
                      </h2>
                    </div>

                    <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                      <p>
                        Esta aplicación está diseñada de acuerdo con los estándares de <span className="font-bold">cero bases de datos complejas</span>. Toda la información se guarda de manera transparente en archivos de formato JSON plano.
                      </p>
                      <p className="font-semibold text-slate-800">
                        Para respaldar la totalidad de tu información, simplemente copia la carpeta de almacenamiento de tus archivos JSON locales en tu sistema.
                      </p>
                    </div>

                    {backupInfo && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4 font-mono text-xs">
                        <div>
                          <div className="text-slate-400 uppercase font-bold text-[10px]">Carpeta de Almacenamiento JSON</div>
                          <div className="mt-1 text-slate-800 font-semibold select-all break-all">{backupInfo.resolvedDataDir}</div>
                          <div className="mt-2 text-[11px] text-slate-500">
                            Archivos encontrados:
                            {backupInfo.dataFiles.length > 0 ? (
                              <ul className="list-disc pl-4 mt-1 space-y-0.5 font-bold">
                                {backupInfo.dataFiles.map(file => (
                                  <li key={file} className="text-emerald-700">{file}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="italic block mt-1">La carpeta está vacía. Registra una tarea para generar el archivo.</span>
                            )}
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-3">
                          <div className="text-slate-400 uppercase font-bold text-[10px]">Carpeta de Reportes Generados (.txt)</div>
                          <div className="mt-1 text-slate-800 font-semibold select-all break-all">{backupInfo.resolvedExportDir}</div>
                          <div className="mt-2 text-[11px] text-slate-500">
                            Reportes en disco:
                            {backupInfo.exportFiles.length > 0 ? (
                              <ul className="list-disc pl-4 mt-1 space-y-0.5">
                                {backupInfo.exportFiles.map(file => (
                                  <li key={file} className="text-slate-700">{file}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="italic block mt-1">No se han generado reportes planos todavía.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </main>
        </div>

        {/* Footer info bar */}
        <div className="bg-slate-800 border-t border-slate-900 px-4 py-2 text-[11px] font-mono text-slate-400 flex items-center justify-between flex-wrap gap-2">
          <div>
            <span>Estatus General: </span>
            <span className="text-emerald-400 font-bold animate-pulse">● LOCAL ONLINE</span>
          </div>
          <div>
            <span>Desarrollador: </span>
            <span className="text-slate-200 font-bold">Senior Windows Suite Engineer</span>
          </div>
        </div>
      </div>

      {/* FLOATING QUICK CAPTURE MODAL OVERLAY (TRIGGERS ON ALT+T) */}
      {isQuickCaptureOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-xl shadow-2xl rounded-xl border border-slate-300">
            <QuickCapture 
              onSave={handleCreateTask}
              onClose={() => setIsQuickCaptureOpen(false)}
              userInitials={config.userInitials}
            />
          </div>
        </div>
      )}

      {/* EDIT TASK DIALOG MODAL */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl p-6 max-w-md w-full relative">
            <button
              onClick={() => setEditingTask(null)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
              <FileCode className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-display">
                Editar Actividad
              </h3>
            </div>

            <form onSubmit={submitEditTask} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <span className="text-slate-400 font-bold block">ID</span>
                  <span className="font-bold text-slate-800 block mt-0.5">{editingTask.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Hora de Registro</span>
                  <span className="text-slate-800 block mt-0.5">{editingTask.timeCreated}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  Fecha de la Actividad
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  value={editingTask.date}
                  onChange={(e) => setEditingTask(prev => prev ? { ...prev, date: e.target.value } : null)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                    Tipo
                  </label>
                  <select
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingTask.type}
                    onChange={(e) => setEditingTask(prev => prev ? { ...prev, type: e.target.value } : null)}
                  >
                    <option value="Sys">Sys (Sistemas)</option>
                    <option value="Com">Com (Comercial)</option>
                    <option value="Op">Op (Operaciones)</option>
                    <option value="MKT">MKT (Marketing)</option>
                    <option value="Ab">Ab (Abasto)</option>
                    <option value="Sop">Sop (Soporte)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                    Categoría
                  </label>
                  <select
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingTask.category}
                    onChange={(e) => setEditingTask(prev => prev ? { ...prev, category: e.target.value } : null)}
                  >
                    <option value="B">B (Bug)</option>
                    <option value="DTec">DTec (Deuda Técnica)</option>
                    <option value="SOp">SOp (Soporte Operativo)</option>
                    <option value="UInc">UInc (Uso Incorrecto)</option>
                    <option value="RNeg">RNeg (Requerimiento de Negocio)</option>
                    <option value="DFunc">DFunc (Duda Funcional)</option>
                    <option value="Otr">Otr (Otro)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                    Tiempo
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    value={editingTask.duration}
                    onChange={(e) => setEditingTask(prev => prev ? { ...prev, duration: e.target.value } : null)}
                    placeholder="Ej: 5 hrs o 2 hrs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                    Estatus
                  </label>
                  <select
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingTask.status}
                    onChange={(e) => setEditingTask(prev => prev ? { ...prev, status: e.target.value as TaskStatus } : null)}
                  >
                    <option value="Reportado">Reportado</option>
                    <option value="En proceso Análisis">En proceso Análisis</option>
                    <option value="En proceso DEV">En proceso DEV</option>
                    <option value="Cerrado">Cerrado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  Descripción
                </label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white min-h-[80px]"
                  value={editingTask.description}
                  onChange={(e) => setEditingTask(prev => prev ? { ...prev, description: e.target.value } : null)}
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
