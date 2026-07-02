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
  isValid: boolean;
}

export function parseRawTask(text: string): ParsedFields {
  let type = '';
  let category = '';
  let description = '';
  let duration = '';

  // Match:
  // T:[value] up to next tag or comma or end
  // C:[value] up to next tag or comma or end
  // D:[value] up to next tag or comma or end
  // TM:[value] up to next tag or comma or end
  
  const regexT = /[Tt]:\s*([^,]*?)(?=\s*,?\s*[CcDd(TM)(tm)]:|$)/;
  const regexC = /[Cc]:\s*([^,]*?)(?=\s*,?\s*[TtDd(TM)(tm)]:|$)/;
  const regexD = /[Dd]:\s*([^,]*?)(?=\s*,?\s*[TtCc(TM)(tm)]:|$)/;
  const regexTM = /(?:[Tt][Mm]):\s*([^,]*?)(?=\s*,?\s*[TtCcDd]:|$)/;

  const matchT = text.match(regexT);
  const matchC = text.match(regexC);
  const matchD = text.match(regexD);
  const matchTM = text.match(regexTM);

  if (matchT) type = matchT[1].trim();
  if (matchC) category = matchC[1].trim();
  if (matchD) description = matchD[1].trim();
  if (matchTM) duration = matchTM[1].trim();

  // Simple validations: at least type or category or description
  const isValid = !!(type || category || description || duration);

  return {
    type,
    category,
    description,
    duration,
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
