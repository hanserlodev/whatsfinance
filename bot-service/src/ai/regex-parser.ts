import { getDb } from '../../../db';

export interface ParsedTransaction {
  type: 'gasto' | 'ingreso';
  amount: number;
  category: string;
  description?: string;
  isCorrection: boolean;
  confidence: 'alta' | 'media' | 'baja';
}

const PATTERNS = [
  { regex: /gast[eé]|gasto|pagu[eé]|pague/i, type: 'gasto' as const },
  { regex: /me\s+pagaron|ingres[óo]|ingreso|cobr[eé]|cobre|recib[ií]/i, type: 'ingreso' as const },
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Comida: ['almuerzo', 'comida', 'menú', 'cena', 'desayuno', 'restaurante', 'pizza', 'hamburguesa', 'supermercado', 'mercado'],
  Transporte: ['taxi', 'uber', 'bus', 'colectivo', 'combustible', 'gasolina', 'pasaje', 'micro'],
  Vivienda: ['alquiler', 'renta', 'agua', 'luz', 'electricidad', 'gas', 'internet', 'mantenimiento'],
  Salud: ['doctor', 'médico', 'medicina', 'farmacia', 'hospital', 'dentista', 'seguro'],
  Entretenimiento: ['cine', 'netflix', 'spotify', 'juego', 'concierto', 'streaming', 'suscripción'],
  Educación: ['curso', 'libro', 'universidad', 'colegio', 'clase', 'taller'],
  Ropa: ['ropa', 'zapatos', 'pantalón', 'camisa', 'vestido'],
  Sueldo: ['sueldo', 'salario', 'nomina', 'nómina', 'pago mensual'],
  Freelance: ['freelance', 'proyecto', 'trabajo', 'cliente', 'contrato'],
};

export function parseByRegex(text: string): ParsedTransaction | null {
  const lower = text.toLowerCase();
  const db = getDb();

  let detectedType: 'gasto' | 'ingreso' | null = null;
  for (const p of PATTERNS) {
    if (p.regex.test(lower)) {
      detectedType = p.type;
      break;
    }
  }

  if (!detectedType) return null;

  const amountMatch = text.match(/(\d+(?:[.,]\d+)?)/);
  if (!amountMatch) return null;
  const amount = parseFloat(amountMatch[1].replace(',', '.'));

  let category = 'Otros';
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      category = cat;
      break;
    }
  }

  const isCorrection = /^no\,?\s*(?:fue|era|es)/i.test(text.trim());

  const descMatch = text.match(/(?:en|de|por)\s+(.+)/i);
  const description = descMatch ? descMatch[1].trim() : undefined;

  return {
    type: detectedType,
    amount,
    category,
    description,
    isCorrection,
    confidence: 'alta',
  };
}