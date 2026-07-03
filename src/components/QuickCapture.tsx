import React, { useState, useEffect, useRef } from 'react';
import { parseRawTask, TYPES_MAP, CATEGORIES_MAP } from '../utils';
import { Sparkles, Terminal, CornerDownLeft, HelpCircle, FileCheck, Keyboard, X } from 'lucide-react';

interface QuickCaptureProps {
  onSave: (rawText: string) => void;
  onClose?: () => void;
  userInitials: string;
}

export default function QuickCapture({ onSave, onClose, userInitials }: QuickCaptureProps) {
  const [inputText, setInputText] = useState('');
  const [showHelp, setShowHelp] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const parsed = parseRawTask(inputText);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    onSave(inputText);
    setInputText('');
  };

  // Check if fully parsed
  const isComplete = parsed.type && parsed.category && parsed.description && parsed.duration;

  // Render type description helper
  const matchedTypeLabel = TYPES_MAP[parsed.type] || '';
  const matchedCategoryLabel = CATEGORIES_MAP[parsed.category] || '';

  return (
    <div id="quick-capture-container" className="bg-[#16181D] rounded-xl border border-[#2A2D35] shadow-2xl p-6 relative max-w-2xl w-full mx-auto transition-all duration-300">
      <div className="flex items-center justify-between border-b border-[#2A2D35] pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
          <h2 className="text-sm font-semibold tracking-wide text-slate-100 flex items-center gap-1.5 font-display">
            <Terminal className="w-4 h-4 text-blue-400" />
            VENTANA DE CAPTURA RÁPIDA
          </h2>
          <span className="text-[10px] bg-[#0D0F12] text-slate-400 px-2 py-0.5 rounded border border-[#1E2024] font-mono">
            ID Temp: T-DDMMAAAA-{userInitials}##
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="p-1 hover:bg-[#1E2024] rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Ayuda de formato"
            id="btn-help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
              title="Cerrar (Esc)"
              id="btn-close-quick-capture"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              id="input-quick-capture"
              className="w-full bg-[#0B0C0E] border border-[#2A2D35] text-slate-100 placeholder-slate-500 font-mono text-sm rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block p-3.5 pr-10 focus:outline-none transition-all duration-150"
              placeholder="Ej: T:Op, C:DTec, D:Apoyo a usuario para carga masiva, TM:2 hrs"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
              <CornerDownLeft className="w-4 h-4" />
            </div>
          </div>
          
          {/* Always Visible Format Example */}
          <div className="mt-2 p-2.5 bg-[#0D0F12]/80 border border-[#2A2D35]/50 rounded-lg text-xs font-mono text-slate-300 flex flex-col gap-1 shadow-inner">
            <div className="flex items-center gap-1.5 text-blue-400 font-bold text-[10px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Ejemplo de Captura Completa (con Fecha):
            </div>
            <div className="text-slate-200 select-all break-all leading-relaxed bg-[#16181D] p-1.5 rounded border border-[#1E2024]/60 font-medium">
              f:19062026, t:com, c:dfunc, tm:1hr, d:apoyo revisión de evento de solo lift; productos sin planograma
            </div>
          </div>

          <p className="mt-1.5 text-xs text-slate-400 font-sans flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 text-slate-500" />
            Escribe en formato libre. Presiona <span className="font-mono bg-[#0D0F12] text-slate-300 px-1.5 py-0.5 border border-[#1E2024] rounded text-[10px] font-bold">Enter</span> para registrar y ocultar de inmediato.
          </p>
        </div>

        {/* Live Parsing Preview */}
        <div className="bg-[#0D0F12] rounded-lg p-3.5 border border-[#1E2024] space-y-2">
          <div className="flex items-center justify-between border-b border-[#2A2D35]/40 pb-1.5 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Analizador en tiempo real
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isComplete ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {isComplete ? 'Formato Completo' : 'Formato Incompleto'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs font-mono">
            <div className="p-2 bg-[#16181D] rounded border border-[#2A2D35]">
              <div className="text-slate-500 text-[10px] uppercase font-bold">Tipo (T:)</div>
              <div className={`mt-0.5 font-semibold ${parsed.type ? 'text-slate-200' : 'text-slate-600 italic'}`}>
                {parsed.type || 'Falta'}
              </div>
              {matchedTypeLabel && (
                <div className="text-[10px] text-blue-400 truncate mt-0.5">{matchedTypeLabel}</div>
              )}
            </div>

            <div className="p-2 bg-[#16181D] rounded border border-[#2A2D35]">
              <div className="text-slate-500 text-[10px] uppercase font-bold">Categoría (C:)</div>
              <div className={`mt-0.5 font-semibold ${parsed.category ? 'text-slate-200' : 'text-slate-600 italic'}`}>
                {parsed.category || 'Falta'}
              </div>
              {matchedCategoryLabel && (
                <div className="text-[10px] text-purple-400 truncate mt-0.5">{matchedCategoryLabel}</div>
              )}
            </div>

            <div className="p-2 bg-[#16181D] rounded border border-[#2A2D35]">
              <div className="text-slate-500 text-[10px] uppercase font-bold">Tiempo (TM:)</div>
              <div className={`mt-0.5 font-semibold ${parsed.duration ? 'text-slate-200' : 'text-slate-600 italic'}`}>
                {parsed.duration || 'Falta'}
              </div>
            </div>

            <div className="p-2 bg-[#16181D] rounded border border-[#2A2D35]">
              <div className="text-slate-500 text-[10px] uppercase font-bold">Fecha (F:)</div>
              <div className={`mt-0.5 font-semibold ${parsed.date ? 'text-slate-200' : 'text-slate-500 italic'}`}>
                {parsed.date || 'Hoy (Por defecto)'}
              </div>
              {parsed.rawDateStr && parsed.rawDateStr !== parsed.date && (
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{parsed.rawDateStr}</div>
              )}
            </div>

            <div className="p-2 bg-[#16181D] rounded border border-[#2A2D35] col-span-2 md:col-span-1">
              <div className="text-slate-500 text-[10px] uppercase font-bold">Descripción (D:)</div>
              <div className={`mt-0.5 font-semibold truncate ${parsed.description ? 'text-slate-200' : 'text-slate-600 italic'}`}>
                {parsed.description || 'Falta'}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Visual Help Section */}
        {showHelp && (
          <div className="bg-blue-500/5 rounded-lg p-4 border border-blue-500/15 text-xs text-slate-300 space-y-3 transition-all duration-300">
            <div className="font-semibold flex items-center gap-1.5 font-display text-blue-300">
              <FileCheck className="w-4 h-4 text-blue-400" /> Referencia rápida de Códigos de Captura
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-bold text-blue-300 border-b border-[#2A2D35] block pb-1 mb-1.5 uppercase tracking-wide text-[10px]">
                  Tipos Disponibles (T)
                </span>
                <div className="grid grid-cols-2 gap-y-1 gap-x-2 font-mono text-[11px]">
                  <div><span className="font-bold text-blue-400">Sys</span>: Sistemas</div>
                  <div><span className="font-bold text-blue-400">Com</span>: Comercial</div>
                  <div><span className="font-bold text-blue-400">Op</span>: Operaciones</div>
                  <div><span className="font-bold text-blue-400">MKT</span>: Marketing</div>
                  <div><span className="font-bold text-blue-400">Ab</span>: Abasto</div>
                  <div><span className="font-bold text-blue-400">Sop</span>: Soporte</div>
                </div>
              </div>
              
              <div>
                <span className="font-bold text-blue-300 border-b border-[#2A2D35] block pb-1 mb-1.5 uppercase tracking-wide text-[10px]">
                  Categorías Disponibles (C)
                </span>
                <div className="grid grid-cols-2 gap-y-1 gap-x-2 font-mono text-[11px]">
                  <div><span className="font-bold text-blue-400">B</span>: Bug</div>
                  <div><span className="font-bold text-blue-400">DTec</span>: Deuda Tec</div>
                  <div><span className="font-bold text-blue-400">SOp</span>: Sop Operativo</div>
                  <div><span className="font-bold text-blue-400">UInc</span>: Uso Incorrec</div>
                  <div><span className="font-bold text-blue-400">RNeg</span>: Req Negocio</div>
                  <div><span className="font-bold text-blue-400">DFunc</span>: Duda Func</div>
                  <div><span className="font-bold text-blue-400">Otr</span>: Otro</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
