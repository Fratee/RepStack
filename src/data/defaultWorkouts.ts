import type { WorkoutDay, WorkoutSet } from '../types';

const createDefaultSets = (count: number, targetReps: string, defaultWeight = 0): WorkoutSet[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `set-${i + 1}-${Math.random().toString(36).substring(2, 8)}`,
    setNumber: i + 1,
    targetReps,
    actualReps: parseInt(targetReps, 10) || 10,
    weightKg: defaultWeight,
    completed: false,
  }));
};

export const DEFAULT_WORKOUTS: WorkoutDay[] = [
  {
    id: 'day1',
    title: 'Giorno 1',
    subtitle: 'Gambe, Dorso & Petto',
    exercises: [
      {
        id: 'ex-1-1',
        name: 'Squat multi power',
        category: 'legs',
        defaultRestSeconds: 120, // 2 minuti
        notes: '4 serie da 8 ripetizioni con 2 min di recupero',
        sets: createDefaultSets(4, '8', 40),
      },
      {
        id: 'ex-1-2',
        name: 'Leg curl sdraiato',
        category: 'legs',
        defaultRestSeconds: 120, // 1.5 / 2 minuti
        restOptions: [90, 120],
        notes: '4 serie da 10 ripetizioni con 1.5 o 2 min di riposo',
        sets: createDefaultSets(4, '10', 30),
      },
      {
        id: 'ex-1-3',
        name: 'Trazioni assistite',
        category: 'back',
        defaultRestSeconds: 120, // 2 minuti
        notes: '4 serie da 8 ripetizioni con 2 min di riposo',
        sets: createDefaultSets(4, '8', 25),
      },
      {
        id: 'ex-1-4',
        name: 'Spinte manubri',
        category: 'chest',
        defaultRestSeconds: 90, // 1.5 minuti
        notes: '4 serie da 10 ripetizioni con 1.5 min (90s) di riposo',
        sets: createDefaultSets(4, '10', 18),
      },
      {
        id: 'ex-1-5',
        name: 'Aperture petto manubri',
        category: 'chest',
        defaultRestSeconds: 90, // 1.5 minuti
        notes: '4 serie da 10 ripetizioni con 1.5 min (90s) di riposo',
        sets: createDefaultSets(4, '10', 12),
      },
      {
        id: 'ex-1-6',
        name: 'Addome',
        category: 'core',
        defaultRestSeconds: 60, // 1 minuto
        notes: 'Crunch / Leg raise / Plank - 4 serie con 1 min di recupero',
        sets: createDefaultSets(4, '15', 0),
      },
    ],
  },
  {
    id: 'day2',
    title: 'Giorno 2',
    subtitle: 'Petto, Spalle, Dorso, Femorali & Polpacci',
    exercises: [
      {
        id: 'ex-2-1',
        name: 'Spinte bilanciere panca piana',
        category: 'chest',
        defaultRestSeconds: 120, // 2 minuti
        notes: '4 serie da 8 ripetizioni con 2 min di riposo',
        sets: createDefaultSets(4, '8', 50),
      },
      {
        id: 'ex-2-2',
        name: 'Alzate laterali mono',
        category: 'shoulders',
        defaultRestSeconds: 60, // 1 minuto
        notes: '4 serie da 10 ripetizioni con 1 min di recupero per braccio',
        sets: createDefaultSets(4, '10', 8),
      },
      {
        id: 'ex-2-3',
        name: 'Row machine',
        category: 'back',
        defaultRestSeconds: 90, // 1.5 minuti
        notes: '4 serie da 10 ripetizioni con 1.5 min (90s) di riposo',
        sets: createDefaultSets(4, '10', 45),
      },
      {
        id: 'ex-2-4',
        name: 'Stacchi gambe semitese',
        category: 'legs',
        defaultRestSeconds: 120, // 2 minuti
        notes: '4 serie da 8 ripetizioni con 2 min di riposo',
        sets: createDefaultSets(4, '8', 50),
      },
      {
        id: 'ex-2-5',
        name: 'Leg Extension',
        category: 'legs',
        defaultRestSeconds: 90, // 1.5 minuti
        notes: '4 serie da 10 ripetizioni con 1.5 min (90s) di riposo',
        sets: createDefaultSets(4, '10', 35),
      },
      {
        id: 'ex-2-6',
        name: 'Polpacci',
        category: 'calves',
        defaultRestSeconds: 60, // 1 minuto
        notes: 'Calf raise in piedi o seduto - 4 serie con 1 min di recupero',
        sets: createDefaultSets(4, '15', 30),
      },
    ],
  },
];
