// Mapping of Types
export const TYPES_MAP: Record<string, string> = {
  Sys: 'Sistemas',
  Com: 'Comercial',
  Op: 'Operaciones',
  MKT: 'Marketing',
  Ab: 'Abasto',
  Sop: 'Soporte',
};

// Mapping of Categories
export const CATEGORIES_MAP: Record<string, string> = {
  B: 'Bug',
  DTec: 'Deuda Técnica',
  SOp: 'Soporte Operativo',
  UInc: 'Uso Incorrecto',
  RNeg: 'Requerimiento de Negocio',
  DFunc: 'Duda Funcional',
  Otr: 'Otro',
};

// Available status values
export const STATUS_OPTIONS = [
  'Reportado',
  'En proceso Análisis',
  'En proceso DEV',
  'Cerrado',
] as const;

// Helper to parse a single raw input line
export interface ParsedFields {
  type: string;
  category: string;
  description: string;
  duration: string;
  date?: string;
  rawDateStr?: string;
  isValid: boolean;
}

export function parseDateStringToYYYYMMDD(str: string): string | null {
  if (!str) return null;
  const trimmed = str.trim();
  
  // Try YYYY-MM-DD
  const yyyymmdd = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (yyyymmdd) {
    const y = yyyymmdd[1];
    const m = yyyymmdd[2].padStart(2, '0');
    const d = yyyymmdd[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyy) {
    const d = ddmmyyyy[1].padStart(2, '0');
    const m = ddmmyyyy[2].padStart(2, '0');
    const y = ddmmyyyy[3];
    return `${y}-${m}-${d}`;
  }

  // Try DDMMAAAA (8 digits)
  const ddmmaaaa = trimmed.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (ddmmaaaa) {
    const d = ddmmaaaa[1];
    const m = ddmmaaaa[2];
    const y = ddmmaaaa[3];
    return `${y}-${m}-${d}`;
  }

  return null;
}

export function parseRawTask(text: string): ParsedFields {
  let type = '';
  let category = '';
  let description = '';
  let duration = '';
  let date = '';
  let rawDateStr = '';

  const tagRegex = /(?:^|[\s,]+)(t|c|d|tm|f|fecha):/gi;
  let match;
  const tags: { tag: string; start: number; valueStart: number }[] = [];

  while ((match = tagRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const tagName = match[1].toLowerCase();
    const start = match.index;
    const valueStart = start + fullMatch.length;
    tags.push({ tag: tagName, start, valueStart });
  }

  // Sort tags by start index
  tags.sort((a, b) => a.start - b.start);

  for (let i = 0; i < tags.length; i++) {
    const current = tags[i];
    const next = tags[i + 1];
    const end = next ? next.start : text.length;
    let val = text.substring(current.valueStart, end).trim();
    
    // Clean trailing commas, semicolons, and spaces
    val = val.replace(/^[,\s;]+|[,\s;]+$/g, '');

    switch (current.tag) {
      case 't':
        type = val;
        break;
      case 'c':
        category = val;
        break;
      case 'd':
        description = val;
        break;
      case 'tm':
        duration = val;
        break;
      case 'f':
      case 'fecha':
        rawDateStr = val;
        break;
    }
  }

  // If date was not parsed from F:, try fallback at start of string (e.g. DD/MM/YYYY or YYYY-MM-DD)
  if (!rawDateStr) {
    const startMatch = text.trim().match(/^\[?(\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{8})\]?/);
    if (startMatch) {
      rawDateStr = startMatch[1].trim();
    }
  }

  if (rawDateStr) {
    const formatted = parseDateStringToYYYYMMDD(rawDateStr);
    if (formatted) {
      date = formatted;
    }
  }

  // Simple validations: at least type or category or description
  const isValid = !!(type || category || description || duration);

  return {
    type,
    category,
    description,
    duration,
    date: date || undefined,
    rawDateStr: rawDateStr || undefined,
    isValid,
  };
}

// Convert YYYY-MM-DD to DD/MM/YYYY for Spanish local feel
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Map short code to full readable label
export function getTypeLabel(code: string): string {
  return TYPES_MAP[code] || code || 'Sin Tipo';
}

export function getCategoryLabel(code: string): string {
  return CATEGORIES_MAP[code] || code || 'Sin Categoría';
}
