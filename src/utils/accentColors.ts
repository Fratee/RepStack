import type { AccentColor } from '../types';
import { getBestContrastTextColor } from './contrast';

export interface AccentOption {
  id: AccentColor;
  label: string;
  nameEn: string;
  hex: string;
  secondaryHex: string;
  contrastTextColor: string; // e.g. '#ffffff' or '#020617'
}

export const ACCENT_COLORS: AccentOption[] = [
  {
    id: 'emerald',
    label: 'Smeraldo',
    nameEn: 'Emerald',
    hex: '#10b981',
    secondaryHex: '#14b8a6',
    contrastTextColor: getBestContrastTextColor('#10b981', '#14b8a6'),
  },
  {
    id: 'blue',
    label: 'Cobalto',
    nameEn: 'Blue',
    hex: '#3b82f6',
    secondaryHex: '#0ea5e9',
    contrastTextColor: getBestContrastTextColor('#3b82f6', '#0ea5e9'),
  },
  {
    id: 'cyan',
    label: 'Acqua',
    nameEn: 'Cyan',
    hex: '#06b6d4',
    secondaryHex: '#2dd4bf',
    contrastTextColor: getBestContrastTextColor('#06b6d4', '#2dd4bf'),
  },
  {
    id: 'purple',
    label: 'Viola',
    nameEn: 'Purple',
    hex: '#a855f7',
    secondaryHex: '#6366f1',
    contrastTextColor: getBestContrastTextColor('#a855f7', '#6366f1'),
  },
  {
    id: 'rose',
    label: 'Rosa',
    nameEn: 'Pink',
    hex: '#f472b6',
    secondaryHex: '#f9a8d4',
    contrastTextColor: getBestContrastTextColor('#f472b6', '#f9a8d4'),
  },
  {
    id: 'red',
    label: 'Rosso Corsa',
    nameEn: 'Red',
    hex: '#ef4444',
    secondaryHex: '#f43f5e',
    contrastTextColor: getBestContrastTextColor('#ef4444', '#f43f5e'),
  },
  {
    id: 'orange',
    label: 'Arancio',
    nameEn: 'Orange',
    hex: '#f97316',
    secondaryHex: '#f59e0b',
    contrastTextColor: getBestContrastTextColor('#f97316', '#f59e0b'),
  },
  {
    id: 'amber',
    label: 'Ambra & Oro',
    nameEn: 'Amber',
    hex: '#f59e0b',
    secondaryHex: '#eab308',
    contrastTextColor: getBestContrastTextColor('#f59e0b', '#eab308'),
  },
];

export function getAccentOption(id: AccentColor | string | undefined): AccentOption {
  return ACCENT_COLORS.find((c) => c.id === id) || ACCENT_COLORS[0];
}
