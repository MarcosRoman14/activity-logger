import React, { useState, useEffect } from 'react';
import { AppConfig } from '../types';
import { Save, Folder, User, Sliders, RefreshCw, AlertCircle, CheckCircle2, Cloud, CloudOff, HelpCircle, ExternalLink } from 'lucide-react';
import { isFirebaseConfigured } from '../firebase';

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

  const firebaseActive = isFirebaseConfigured();

  return (
    <div id="configuration-panel" className="bg-[#16181D] rounded-xl border border-[#2A2D35] shadow-sm p-6 max-w-xl mx-auto">
      <div className="flex items-center space-x-2 border-b border-[#2A2D35] pb-3 mb-5">
        <Sliders className="w-5 h-5 text-blue-400" />
        <h2 className="text-base font-bold tracking-tight text-slate-100 font-display">
          CONFIGURACIÓN DE LA APLICACIÓN
        </h2>
      </div>

      {/* Tarjeta Informativa de Firebase */}
      <div className="mb-6 p-4 rounded-xl border bg-slate-950/60 transition-all">
        <div className="flex items-start gap-3">
          {firebaseActive ? (
            <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
              <Cloud className="w-5 h-5 text-emerald-400" />
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30">
              <CloudOff className="w-5 h-5 text-amber-400" />
            </div>
          )}
          
          <div className="flex-1 space-y-1">
            <h3 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
              Estatus del Almacenamiento: 
              {firebaseActive ? (
                <span className="text-emerald-400">Firebase Cloud Conectado</span>
              ) : (
                <span className="text-amber-400">Servidor Local (Modo Fallback)</span>
              )}
            </h3>
            
            {firebaseActive ? (
              <div className="text-xs text-slate-400 space-y-2 leading-relaxed pt-1.5">
                <p>
                  ¡La conexión directa del navegador a tu base de datos <span className="text-slate-100 font-semibold font-mono">activity-logger-c7822</span> en la nube está activa! Los datos se sincronizan directamente sin intermediarios de costo.
                </p>
                <div className="p-3 bg-[#111317] border border-[#2A2D35] rounded-lg space-y-1.5">
                  <span className="font-bold text-slate-200 block text-[11px] flex items-center gap-1 text-emerald-400">
                    <HelpCircle className="w-3.5 h-3.5" /> ¿Por qué mi consola de Firebase está vacía?
                  </span>
                  <ul className="list-decimal pl-4 space-y-1 text-slate-400 text-[11px]">
                    <li>
                      <span className="font-bold text-slate-300">Debes crear la base de datos Firestore:</span> Ve a tu <a href="https://console.firebase.google.com/project/activity-logger-c7822/firestore" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-0.5 font-bold">Consola de Firebase <ExternalLink className="w-3 h-3 inline" /></a>, haz clic en <strong>Firestore Database</strong> y luego en <strong>Crear base de datos</strong>. Configúrala en "Modo de prueba".
                    </li>
                    <li>
                      <span className="font-bold text-slate-300">Agrega tu primer registro:</span> Firestore no muestra colecciones que estén totalmente vacías. Agrega una actividad usando el botón <strong>"Nueva Captura Rápida"</strong> de arriba (o con el atajo de teclado). Al instante verás crearse la colección <code className="bg-slate-900 px-1 py-0.5 rounded text-rose-400 font-mono text-[10px]">tasks</code>.
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 space-y-2 leading-relaxed pt-1.5">
                <p>
                  Toda tu información se guarda de forma segura y local en <code className="bg-slate-900 px-1 py-0.5 rounded text-blue-400 font-mono text-[10px]">activities.json</code> dentro de este contenedor.
                </p>
                <div className="p-3 bg-[#111317] border border-amber-500/20 rounded-lg space-y-1.5">
                  <span className="font-bold text-slate-200 block text-[11px] text-amber-400">
                    Sigue estos pasos para conectar Firebase en la nube (100% Gratis):
                  </span>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Ingresa en el menú <strong>Settings (Configuración)</strong> de Google AI Studio (arriba a la derecha) e introduce estas variables de entorno en el panel secreto:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-400 text-[11px] font-mono">
                    <li><strong className="text-slate-300 font-sans">VITE_FIREBASE_API_KEY</strong>: (Tu API Key real)</li>
                    <li><strong className="text-slate-300 font-sans">VITE_FIREBASE_AUTH_DOMAIN</strong>: <span className="opacity-70">activity-logger-c7822.firebaseapp.com</span></li>
                    <li><strong className="text-slate-300 font-sans">VITE_FIREBASE_PROJECT_ID</strong>: <span className="opacity-70">activity-logger-c7822</span></li>
                    <li><strong className="text-slate-300 font-sans">VITE_FIREBASE_STORAGE_BUCKET</strong>: <span className="opacity-70">activity-logger-c7822.firebasestorage.app</span></li>
                    <li><strong className="text-slate-300 font-sans">VITE_FIREBASE_MESSAGING_SENDER_ID</strong>: <span className="opacity-70">524745483405</span></li>
                    <li><strong className="text-slate-300 font-sans">VITE_FIREBASE_APP_ID</strong>: <span className="opacity-70">1:524745483405:web:...</span></li>
                  </ul>
                  <p className="text-[10px] text-slate-500 pt-1">
                    *Al guardarlas, la app sincronizará tu historial existente a la nube de Firebase de forma automática.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
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
