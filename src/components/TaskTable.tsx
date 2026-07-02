import { useState, useMemo } from 'react';
import { Task, TaskStatus } from '../types';
import { TYPES_MAP, CATEGORIES_MAP, STATUS_OPTIONS, formatDate, getTypeLabel, getCategoryLabel } from '../utils';
import { Search, Filter, Calendar, Grid, Layers, Trash2, Edit3, CheckCircle, Clock, AlertCircle, Sparkles, HelpCircle, Eye } from 'lucide-react';

interface TaskTableProps {
  tasks: Task[];
  onUpdateTask: (id: string, updatedData: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onEditClick: (task: Task) => void;
}

export default function TaskTable({ tasks, onUpdateTask, onDeleteTask, onEditClick }: TaskTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilterType, setDateFilterType] = useState<'all' | 'today' | 'specific'>('all');
  
  const [specificDate, setSpecificDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [groupByDate, setGroupByDate] = useState(false);
  const [showCodeHelp, setShowCodeHelp] = useState(false);

  // Helper to extract numeric hours from strings like "5 hrs", "2.5 h", "30 min", "2"
  const parseHours = (durationStr: string): number => {
    const trimmed = durationStr.toLowerCase().trim();
    const match = trimmed.match(/([\d.]+)/);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    if (isNaN(value)) return 0;

    if (trimmed.includes('min') || trimmed.includes('m')) {
      return value / 60;
    }
    return value;
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by text search (ID, description, type, category)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(t => {
        const fullType = TYPES_MAP[t.type] || '';
        const fullCat = CATEGORIES_MAP[t.category] || '';
        return (
          t.id.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term) ||
          t.type.toLowerCase().includes(term) ||
          t.category.toLowerCase().includes(term) ||
          fullType.toLowerCase().includes(term) ||
          fullCat.toLowerCase().includes(term)
        );
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }

    // Filter by date
    if (dateFilterType === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      result = result.filter(t => t.date === todayStr);
    } else if (dateFilterType === 'specific' && specificDate) {
      result = result.filter(t => t.date === specificDate);
    }

    // Sort chronologically by date descending, then timeCreated descending
    result.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.timeCreated.localeCompare(a.timeCreated);
    });

    return result;
  }, [tasks, searchTerm, statusFilter, dateFilterType, specificDate]);

  // Grouped Tasks
  const groupedTasks = useMemo(() => {
    const groups: Record<string, { tasks: Task[]; totalHours: number }> = {};
    
    filteredTasks.forEach(t => {
      const dateStr = t.date;
      if (!groups[dateStr]) {
        groups[dateStr] = { tasks: [], totalHours: 0 };
      }
      groups[dateStr].tasks.push(t);
      groups[dateStr].totalHours += parseHours(t.duration);
    });

    return groups;
  }, [filteredTasks]);

  // Calculations for global summary cards
  const stats = useMemo(() => {
    const total = filteredTasks.length;
    let totalHours = 0;
    const statusCounts: Record<TaskStatus, number> = {
      'Reportado': 0,
      'En proceso Análisis': 0,
      'En proceso DEV': 0,
      'Cerrado': 0,
    };

    filteredTasks.forEach(t => {
      totalHours += parseHours(t.duration);
      if (statusCounts[t.status] !== undefined) {
        statusCounts[t.status]++;
      }
    });

    return {
      total,
      totalHours: Number(totalHours.toFixed(1)),
      statusCounts,
    };
  }, [filteredTasks]);

  const handleStatusChange = (id: string, newStatus: TaskStatus) => {
    onUpdateTask(id, { status: newStatus });
  };

  const getStatusBadgeClass = (status: TaskStatus) => {
    switch (status) {
      case 'Reportado':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'En proceso Análisis':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'En proceso DEV':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'Cerrado':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      default:
        return 'bg-[#0D0F12] text-slate-400 border border-[#2A2D35]';
    }
  };

  return (
    <div id="tasks-table-module" className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#16181D] border border-[#2A2D35] p-3.5 rounded-lg shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Actividades</span>
            <div className="text-xl font-bold text-slate-100 font-display mt-0.5">{stats.total}</div>
          </div>
          <div className="w-9 h-9 bg-[#0D0F12] rounded-lg flex items-center justify-center border border-[#1E2024] text-slate-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#16181D] border border-[#2A2D35] p-3.5 rounded-lg shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Total Horas</span>
            <div className="text-xl font-bold text-slate-100 font-display mt-0.5">{stats.totalHours} hrs</div>
          </div>
          <div className="w-9 h-9 bg-[#0D0F12] rounded-lg flex items-center justify-center border border-[#1E2024] text-slate-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#16181D] border border-[#2A2D35] p-3.5 rounded-lg shadow-sm flex items-center justify-between col-span-1">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">En Desarrollo</span>
            <div className="text-xl font-bold text-purple-400 font-display mt-0.5">{stats.statusCounts['En proceso DEV']}</div>
          </div>
          <div className="w-9 h-9 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/20 text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#16181D] border border-[#2A2D35] p-3.5 rounded-lg shadow-sm flex items-center justify-between col-span-1">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Cerradas</span>
            <div className="text-xl font-bold text-emerald-400 font-display mt-0.5">{stats.statusCounts['Cerrado']}</div>
          </div>
          <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20 text-emerald-400">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and control panel */}
      <div className="bg-[#16181D] border border-[#2A2D35] rounded-lg shadow-sm p-4 space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Text Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="search-input"
              className="w-full pl-9 pr-4 py-1.5 bg-[#0B0C0E] border border-[#2A2D35] text-slate-100 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Buscar por descripción, ID, tipo, categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Group by Date Toggle */}
            <button
              onClick={() => setGroupByDate(!groupByDate)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                groupByDate 
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-xs' 
                  : 'bg-[#0D0F12] hover:bg-[#1E2024] text-slate-300 border-[#2A2D35]'
              }`}
              id="btn-toggle-group-by-date"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Agrupar por Fecha</span>
            </button>

            {/* Code Help Toggle */}
            <button
              onClick={() => setShowCodeHelp(!showCodeHelp)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                showCodeHelp
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-xs'
                  : 'bg-[#0D0F12] hover:bg-[#1E2024] text-slate-300 border-[#2A2D35]'
              }`}
              id="btn-toggle-code-help"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Códigos Ayuda</span>
            </button>
          </div>
        </div>

        {/* Extended Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-[#2A2D35]">
          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Estado
            </label>
            <select
              id="filter-status"
              className="w-full bg-[#0B0C0E] border border-[#2A2D35] text-slate-200 text-xs rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all" className="bg-[#16181D]">Todos los Estados</option>
              {STATUS_OPTIONS.map(o => (
                <option key={o} value={o} className="bg-[#16181D]">{o}</option>
              ))}
            </select>
          </div>

          {/* Date Range Type Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Filtrado de Fechas
            </label>
            <div className="flex gap-1.5">
              <button
                onClick={() => setDateFilterType('all')}
                className={`flex-1 py-1 px-2 text-[10px] font-semibold border rounded transition-colors cursor-pointer ${
                  dateFilterType === 'all' ? 'bg-blue-600 text-white border-blue-500' : 'bg-[#0D0F12] hover:bg-[#1E2024] text-slate-400 border-[#2A2D35]'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setDateFilterType('today')}
                className={`flex-1 py-1 px-2 text-[10px] font-semibold border rounded transition-colors cursor-pointer ${
                  dateFilterType === 'today' ? 'bg-blue-600 text-white border-blue-500' : 'bg-[#0D0F12] hover:bg-[#1E2024] text-slate-400 border-[#2A2D35]'
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setDateFilterType('specific')}
                className={`flex-1 py-1 px-2 text-[10px] font-semibold border rounded transition-colors cursor-pointer ${
                  dateFilterType === 'specific' ? 'bg-blue-600 text-white border-blue-500' : 'bg-[#0D0F12] hover:bg-[#1E2024] text-slate-400 border-[#2A2D35]'
                }`}
              >
                Elegir Día
              </button>
            </div>
          </div>

          {/* Specific Date input */}
          {dateFilterType === 'specific' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Elegir Día Específico
              </label>
              <input
                type="date"
                id="filter-specific-date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="w-full bg-[#0B0C0E] border border-[#2A2D35] text-slate-200 text-xs rounded-lg p-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Codes Help Panel */}
        {showCodeHelp && (
          <div className="bg-[#0D0F12] border border-[#2A2D35]/50 rounded-lg p-3.5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <h4 className="font-bold text-slate-400 border-b border-[#2A2D35] pb-1 mb-1.5 uppercase text-[10px]">Tipos (T:)</h4>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                {Object.entries(TYPES_MAP).map(([code, label]) => (
                  <div key={code}><span className="font-bold text-blue-400">{code}</span>: <span className="text-slate-400">{label}</span></div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-slate-400 border-b border-[#2A2D35] pb-1 mb-1.5 uppercase text-[10px]">Categorías (C:)</h4>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                {Object.entries(CATEGORIES_MAP).map(([code, label]) => (
                  <div key={code}><span className="font-bold text-purple-400">{code}</span>: <span className="text-slate-400">{label}</span></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task List / Table Rendering */}
      {filteredTasks.length === 0 ? (
        <div className="bg-[#16181D] border border-[#2A2D35] rounded-lg p-12 text-center shadow-xs">
          <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-300 font-display">No se encontraron actividades</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Ajusta los filtros o escribe una actividad en la ventana de captura rápida superior para registrarla.
          </p>
        </div>
      ) : groupByDate ? (
        // RENDER GROUPED BY DATE
        <div className="space-y-4">
          {Object.entries(groupedTasks).map(([dateStr, group]) => {
            const typedGroup = group as { tasks: Task[]; totalHours: number };
            return (
              <div key={dateStr} className="bg-[#16181D] border border-[#2A2D35] rounded-lg shadow-xs overflow-hidden">
                {/* Collapsible/Group Header */}
                <div className="bg-[#1E2127] border-b border-[#2A2D35] px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-400">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="font-bold font-display text-slate-200 text-sm">{formatDate(dateStr)}</span>
                    <span className="text-xs text-slate-500 font-normal">({dateStr})</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="bg-[#0D0F12] px-2 py-0.5 rounded font-mono text-slate-400 border border-[#2A2D35]">
                      {typedGroup.tasks.length} {typedGroup.tasks.length === 1 ? 'Actividad' : 'Actividades'}
                    </span>
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-bold">
                      Total: {Number(typedGroup.totalHours.toFixed(1))} hrs
                    </span>
                  </div>
                </div>

                {/* Tasks within group */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#1E2127] text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-[#2A2D35]">
                      <tr>
                        <th className="px-4 py-2 w-32 font-mono">ID</th>
                        <th className="px-4 py-2 w-20">Hora</th>
                        <th className="px-4 py-2 w-36">Estado</th>
                        <th className="px-4 py-2 w-28">Tipo</th>
                        <th className="px-4 py-2 w-32">Categoría</th>
                        <th className="px-4 py-2 w-20">Tiempo</th>
                        <th className="px-4 py-2">Descripción</th>
                        <th className="px-4 py-2 w-20 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2D35]/40 bg-[#16181D]">
                      {typedGroup.tasks.map(task => (
                      <tr key={task.id} className="hover:bg-blue-500/5 transition-colors border-b border-[#1E2024]/40">
                        <td className="px-4 py-2.5 font-mono font-bold text-blue-400 select-all">{task.id}</td>
                        <td className="px-4 py-2.5 text-slate-500 font-mono">{task.timeCreated}</td>
                        <td className="px-4 py-2.5">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                            className={`px-2 py-0.5 text-[11px] font-semibold border rounded-md cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500/40 ${getStatusBadgeClass(task.status)}`}
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s} className="bg-[#16181D] text-slate-200">{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono" title={getTypeLabel(task.type)}>
                            {task.type}
                          </span>
                          <span className="text-slate-500 ml-1 block md:inline text-[10px] truncate max-w-[70px]">{getTypeLabel(task.type)}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono" title={getCategoryLabel(task.category)}>
                            {task.category}
                          </span>
                          <span className="text-slate-500 ml-1 block md:inline text-[10px] truncate max-w-[80px]">{getCategoryLabel(task.category)}</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono font-semibold text-slate-300">{task.duration}</td>
                        <td className="px-4 py-2.5 text-slate-300 font-sans break-all">{task.description}</td>
                        <td className="px-4 py-2.5 text-right flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => onEditClick(task)}
                            className="p-1 hover:bg-[#1E2024] text-slate-400 hover:text-slate-200 rounded transition-colors cursor-pointer"
                            title="Editar actividad"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('¿Seguro que deseas eliminar esta actividad de forma permanente?')) {
                                onDeleteTask(task.id);
                              }
                            }}
                            className="p-1 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                            title="Eliminar actividad"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ); })}
        </div>
      ) : (
        // RENDER STANDARD TABLE
        <div className="bg-[#16181D] border border-[#2A2D35] rounded-lg shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#1E2127] text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-[#2A2D35]">
                <tr>
                  <th className="px-4 py-3 w-32 font-mono">ID</th>
                  <th className="px-4 py-3 w-24">Fecha</th>
                  <th className="px-4 py-3 w-20">Hora</th>
                  <th className="px-4 py-3 w-36">Estado</th>
                  <th className="px-4 py-3 w-28">Tipo</th>
                  <th className="px-4 py-3 w-32">Categoría</th>
                  <th className="px-4 py-3 w-20">Tiempo</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3 w-20 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2D35]/40 bg-[#16181D]">
                {filteredTasks.map(task => (
                  <tr key={task.id} className="hover:bg-blue-500/5 transition-colors border-b border-[#1E2024]/40">
                    <td className="px-4 py-2.5 font-mono font-bold text-blue-400 select-all">{task.id}</td>
                    <td className="px-4 py-2.5 text-slate-400 font-mono font-semibold">{formatDate(task.date)}</td>
                    <td className="px-4 py-2.5 text-slate-500 font-mono">{task.timeCreated}</td>
                    <td className="px-4 py-2.5">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                        className={`px-2 py-0.5 text-[11px] font-semibold border rounded-md cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500/40 ${getStatusBadgeClass(task.status)}`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s} className="bg-[#16181D] text-slate-200">{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono" title={getTypeLabel(task.type)}>
                        {task.type}
                      </span>
                      <span className="text-slate-500 ml-1 block md:inline text-[10px] truncate max-w-[70px]">{getTypeLabel(task.type)}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono" title={getCategoryLabel(task.category)}>
                        {task.category}
                      </span>
                      <span className="text-slate-500 ml-1 block md:inline text-[10px] truncate max-w-[80px]">{getCategoryLabel(task.category)}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono font-semibold text-slate-300">{task.duration}</td>
                    <td className="px-4 py-2.5 text-slate-300 font-sans break-all">{task.description}</td>
                    <td className="px-4 py-2.5 text-right flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => onEditClick(task)}
                        className="p-1 hover:bg-[#1E2024] text-slate-400 hover:text-slate-200 rounded transition-colors cursor-pointer"
                        title="Editar actividad"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Seguro que deseas eliminar esta actividad de forma permanente?')) {
                            onDeleteTask(task.id);
                          }
                        }}
                        className="p-1 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                        title="Eliminar actividad"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
