import type { AccentColor } from '../types';

export interface AccentOption {
  id: AccentColor;
  label: string;
  nameEn: string;
  hex: string;
  secondaryHex: string;
}

export const ACCENT_COLORS: AccentOption[] = [
  { id: 'emerald', label: 'Smeraldo', nameEn: 'Emerald', hex: '#10b981', secondaryHex: '#14b8a6' },
  { id: 'blue', label: 'Cobalto', nameEn: 'Blue', hex: '#3b82f6', secondaryHex: '#0ea5e9' },
  { id: 'cyan', label: 'Acqua', nameEn: 'Cyan', hex: '#06b6d4', secondaryHex: '#2dd4bf' },
  { id: 'purple', label: 'Viola', nameEn: 'Purple', hex: '#a855f7', secondaryHex: '#6366f1' },
  { id: 'rose', label: 'Rosa Neon', nameEn: 'Rose', hex: '#f43f5e', secondaryHex: '#ec4899' },
  { id: 'red', label: 'Rosso Corsa', nameEn: 'Red', hex: '#ef4444', secondaryHex: '#f43f5e' },
  { id: 'orange', label: 'Arancio', nameEn: 'Orange', hex: '#f97316', secondaryHex: '#f59e0b' },
  { id: 'amber', label: 'Ambra & Oro', nameEn: 'Amber', hex: '#f59e0b', secondaryHex: '#eab308' },
];
