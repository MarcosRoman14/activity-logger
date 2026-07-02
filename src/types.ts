export type TaskStatus = 'Reportado' | 'En proceso Análisis' | 'En proceso DEV' | 'Cerrado';

export interface Task {
  id: string;          // T-DDMMAAAA-II##
  date: string;        // YYYY-MM-DD
  timeCreated: string; // HH:MM:SS or full timestamp
  status: TaskStatus;
  type: string;        // e.g. 'Sys', 'Com', etc.
  category: string;    // e.g. 'B', 'DTec', etc.
  description: string;
  duration: string;    // e.g. '2 hrs'
  rawText?: string;    // original captured line
}

export interface AppConfig {
  userInitials: string;
  dataDir: string;
  exportDir: string;
  hotkey: string; // e.g. 'Alt+T'
}

export interface DailySummary {
  date: string;
  count: number;
  totalDurationText: string;
}
