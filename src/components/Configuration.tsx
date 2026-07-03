import React, { useState, useEffect } from 'react';
import { AppConfig } from '../types';
import { Save, Folder, User, Sliders, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ConfigurationProps {
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => Promise<void>;
}

export default function Configuration({ config, onSaveConfig }: ConfigurationProps) {
  const [initials, setInitials] = useState(() => localStorage.getItem('activity_logger_initials') || config.userInitials);
  const [dataDir, setDataDir] = useState(config.dataDir);
  const [exportDir, setExportDir] = useState(config.exportDir);
  const [hotkey, setHotkey] = useState(config.hotkey);
  
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setInitials(localStorage.getItem('activity_logger_initials') || config.userInitials);
    setDataDir(config.dataDir);
    setExportDir(config.exportDir);
    setHotkey(config.hotkey);
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    if (!initials.trim()) {
      setStatusMessage({ text: 'Las iniciales no pueden estar vacías', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      await onSaveConfig({
        userInitials: initials.trim().toUpperCase(),
        dataDir: dataDir.trim(),
        exportDir: exportDir.trim(),
        hotkey: hotkey.trim(),
      });
      setStatusMessage({ text: 'Configuración guardada correctamente en config.json', type: 'success' });
    } catch (error) {
      console.error(error);
      setStatusMessage({ text: 'Error al intentar guardar la configuración', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="configuration-panel" className="bg-[#16181D] rounded-xl border border-[#2A2D35] shadow-sm p-6 max-w-xl mx-auto">
      <div className="flex items-center space-x-2 border-b border-[#2A2D35] pb-3 mb-5">
        <Sliders className="w-5 h-5 text-blue-400" />
        <h2 className="text-base font-bold tracking-tight text-slate-100 font-display">
          CONFIGURACIÓN DE LA APLICACIÓN
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {statusMessage && (
          <div className={`p-3.5 rounded-lg flex items-start gap-2.5 text-xs ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-medium">{statusMessage.text}</p>
            </div>
          </div>
        )}

        {/* User Initials */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-500" /> Iniciales del Usuario
          </label>
          <input
            type="text"
            id="config-initials"
            className="w-full bg-[#0B0C0E] border border-[#2A2D35] text-slate-100 font-mono text-sm rounded-lg focus:ring-1 focus:ring-blue-500 block p-2.5 focus:outline-none uppercase"
            maxLength={4}
            value={initials}
            onChange={(e) => setInitials(e.target.value)}
            placeholder="Ej: MR"
            required
          />
          <p className="mt-1 text-[10px] text-slate-500">
            Se utilizan para generar el consecutivo automático de tareas (ej: T-DDMMAAAA-MR01). Máximo 4 caracteres.
          </p>
        </div>

        {/* Local storage directory */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5 text-slate-500" /> Carpeta de Almacenamiento Local (JSON)
          </label>
          <input
            type="text"
            id="config-data-dir"
            className="w-full bg-[#0B0C0E] border border-[#2A2D35] text-slate-100 font-mono text-sm rounded-lg focus:ring-1 focus:ring-blue-500 block p-2.5 focus:outline-none"
            value={dataDir}
            onChange={(e) => setDataDir(e.target.value)}
            placeholder="Ej: ./data"
            required
          />
          <p className="mt-1 text-[10px] text-slate-500">
            Carpeta del sistema de archivos donde se guardará el archivo <span className="font-bold">activities.json</span>.
          </p>
        </div>

        {/* Export directory */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5 text-slate-500" /> Carpeta por defecto para Exportaciones (.txt)
          </label>
          <input
            type="text"
            id="config-export-dir"
            className="w-full bg-[#0B0C0E] border border-[#2A2D35] text-slate-100 font-mono text-sm rounded-lg focus:ring-1 focus:ring-blue-500 block p-2.5 focus:outline-none"
            value={exportDir}
            onChange={(e) => setExportDir(e.target.value)}
            placeholder="Ej: ./exports"
            required
          />
          <p className="mt-1 text-[10px] text-slate-500">
            Carpeta donde se colocarán los reportes planos generados.
          </p>
        </div>

        {/* Keyboard shortcut config */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
            Atajo de Teclado de Captura Rápida
          </label>
          <select
            id="config-hotkey"
            className="w-full bg-[#0B0C0E] border border-[#2A2D35] text-slate-200 text-sm rounded-lg focus:ring-1 focus:ring-blue-500 block p-2.5 focus:outline-none cursor-pointer"
            value={hotkey}
            onChange={(e) => setHotkey(e.target.value)}
          >
            <option value="Alt+T" className="bg-[#16181D] text-slate-100">Alt + T (Por defecto)</option>
            <option value="Ctrl+Space" className="bg-[#16181D] text-slate-100">Ctrl + Espacio</option>
            <option value="Ctrl+Shift+T" className="bg-[#16181D] text-slate-100">Ctrl + Shift + T</option>
            <option value="Alt+Q" className="bg-[#16181D] text-slate-100">Alt + Q</option>
          </select>
          <p className="mt-1 text-[10px] text-slate-500">
            Abre inmediatamente la ventana de captura rápida dentro de la aplicación.
          </p>
        </div>

        <div className="pt-3 border-t border-[#2A2D35] flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
            id="btn-save-config"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Guardar Configuración
          </button>
        </div>
      </form>
    </div>
  );
}
