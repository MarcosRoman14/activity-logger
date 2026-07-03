import { useState, useEffect } from 'react';
import { Download, FileText, Calendar, Copy, Check, FileCheck, Info } from 'lucide-react';

interface ExportPanelProps {
  onExport: (exportParams: {
    type: 'all' | 'day' | 'range';
    specificDate?: string;
    startDate?: string;
    endDate?: string;
    userInitials?: string;
  }) => Promise<{
    filename: string;
    filePath: string;
    content: string;
    count: number;
  }>;
}

export default function ExportPanel({ onExport }: ExportPanelProps) {
  const [exportType, setExportType] = useState<'all' | 'day' | 'range'>('day');
  const [userInitials, setUserInitials] = useState(() => localStorage.getItem('activity_logger_initials') || '');
  
  // Set default specificDate to today
  const [specificDate, setSpecificDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
  });
  
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() - 7);
    return today.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(false);
  const [exportedResult, setExportedResult] = useState<{
    filename: string;
    filePath: string;
    content: string;
    count: number;
  } | null>(null);
  
  const [copied, setCopied] = useState(false);

  const handleExport = async () => {
    setLoading(false);
    setExportedResult(null);
    setCopied(false);

    try {
      const res = await onExport({
        type: exportType,
        specificDate,
        startDate,
        endDate,
      });
      setExportedResult(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = () => {
    if (!exportedResult) return;
    navigator.clipboard.writeText(exportedResult.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Trigger browser download of the exact plain text
  const handleDownload = () => {
    if (!exportedResult) return;
    const blob = new Blob([exportedResult.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportedResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="export-panel-container" className="bg-[#16181D] rounded-xl border border-[#2A2D35] shadow-sm p-6">
      <div className="flex items-center space-x-2 border-b border-[#2A2D35] pb-3 mb-5">
        <FileText className="w-5 h-5 text-blue-400" />
        <h2 className="text-base font-bold tracking-tight text-slate-100 font-display">
          EXPORTAR ACTIVIDADES (REPORTES PLANOS)
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings column */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Rango de exportación
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="day"
                  checked={exportType === 'day'}
                  onChange={() => setExportType('day')}
                  className="text-blue-500 focus:ring-blue-500 focus:ring-offset-[#16181D] bg-[#0B0C0E] border-[#2A2D35]"
                />
                <span>Un día específico</span>
              </label>
              
              <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="range"
                  checked={exportType === 'range'}
                  onChange={() => setExportType('range')}
                  className="text-blue-500 focus:ring-blue-500 focus:ring-offset-[#16181D] bg-[#0B0C0E] border-[#2A2D35]"
                />
                <span>Rango de fechas</span>
              </label>

              <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="all"
                  checked={exportType === 'all'}
                  onChange={() => setExportType('all')}
                  className="text-blue-500 focus:ring-blue-500 focus:ring-offset-[#16181D] bg-[#0B0C0E] border-[#2A2D35]"
                />
                <span>Exportar todo</span>
              </label>
            </div>
          </div>

          {exportType === 'day' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Seleccionar Día
              </label>
              <input
                type="date"
                id="export-specific-date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="w-full bg-[#0B0C0E] border border-[#2A2D35] text-slate-200 font-mono text-sm rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {exportType === 'range' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  id="export-start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#0B0C0E] border border-[#2A2D35] text-slate-200 font-mono text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  id="export-end-date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#0B0C0E] border border-[#2A2D35] text-slate-200 font-mono text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              Filtrar por Iniciales
            </label>
            <input
              type="text"
              id="export-user-initials"
              value={userInitials}
              onChange={(e) => setUserInitials(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="Ej: MR"
              className="w-full bg-[#0B0C0E] border border-[#2A2D35] text-slate-200 font-mono text-sm rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              Deja vacío para exportar todas o ingresa iniciales para filtrar. Carga por defecto las guardadas localmente.
            </p>
          </div>

          <div className="pt-3">
            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              id="btn-export-submit"
            >
              <FileCheck className="w-4 h-4" />
              Generar Exportación
            </button>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3 text-xs text-slate-400 flex gap-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p>
              El archivo plano se guardará localmente en la carpeta de exportaciones configurada en el servidor y también podrás descargarlo en tu navegador.
            </p>
          </div>
        </div>

        {/* Output Preview column */}
        <div className="lg:col-span-2 flex flex-col h-full min-h-[300px]">
          <div className="flex items-center justify-between bg-[#1E2127] px-4 py-2 rounded-t-lg border border-[#2A2D35] border-b-0">
            <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
              {exportedResult ? `Vista previa (${exportedResult.count} actividades)` : 'Vista previa de la salida'}
            </span>
            {exportedResult && exportedResult.count > 0 && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleCopy}
                  className="p-1 text-slate-300 hover:bg-[#1E2024] rounded transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  title="Copiar al portapapeles"
                  id="btn-copy-export"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
                <span className="text-[#2A2D35]">|</span>
                <button
                  onClick={handleDownload}
                  className="p-1 text-slate-300 hover:bg-[#1E2024] rounded transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  title="Descargar archivo plano (.txt)"
                  id="btn-download-export"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#0B0C0E] text-slate-300 font-mono text-xs p-4 rounded-b-lg border border-[#2A2D35] overflow-y-auto flex-1 max-h-[350px]">
            {exportedResult ? (
              exportedResult.count > 0 ? (
                <pre className="whitespace-pre-wrap selection:bg-[#1E2024] font-mono text-[11px] leading-relaxed">
                  {exportedResult.content}
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 italic py-12">
                  <span>No se encontraron actividades registradas para los criterios seleccionados.</span>
                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 italic py-12">
                <span>Haz clic en "Generar Exportación" para visualizar el reporte formateado aquí...</span>
              </div>
            )}
          </div>
          
          {exportedResult && exportedResult.count > 0 && (
            <div className="mt-1.5 text-[10px] text-slate-500 italic flex items-center gap-1">
              <span>Guardado en servidor como: </span>
              <span className="font-mono bg-[#0D0F12] text-slate-400 px-1.5 py-0.5 rounded border border-[#2A2D35] select-all">
                {exportedResult.filePath}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
