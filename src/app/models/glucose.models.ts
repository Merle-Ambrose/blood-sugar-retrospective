export const MMOL_TO_MGDL = 18.018;

export const UNIT_MGDL = 'mg/dL' as const;
export const UNIT_MMOL = 'mmol/L' as const;
export type GlucoseUnit = typeof UNIT_MGDL | typeof UNIT_MMOL;

export const A1C_FORMULA_SLOPE = 28.7;
export const A1C_FORMULA_INTERCEPT = 46.7;

export const CSV_RECORD_TYPE_HISTORIC = '0';
export const CSV_RECORD_TYPE_SCAN = '1';
export const CSV_HEADER_TIMESTAMP = 'device timestamp';
export const CSV_HEADER_RECORD_TYPE = 'record type';
export const CSV_HEADER_GLUCOSE_PRIMARY = 'historic glucose';
export const CSV_HEADER_GLUCOSE_FALLBACK = 'glucose';

export const MIN_READINGS_FOR_DETECTION = 10;

export const DAWN_PREDAWN_START_HOUR = 2;
export const DAWN_PREDAWN_END_HOUR = 4;
export const DAWN_PEAK_START_HOUR = 6;
export const DAWN_PEAK_END_HOUR = 9;
export const DAWN_MIN_RISE_MGDL = 30;
export const DAWN_MIN_PEAK_MGDL = 120;
export const DAWN_MIN_QUALIFYING_DAYS = 3;
export const DAWN_SEVERE_PEAK_MGDL = 180;
export const DAWN_MODERATE_PEAK_MGDL = 150;

export const SPIKE_MIN_RISE_MGDL = 50;
export const SPIKE_LOOKFORWARD_MINUTES = 120;
export const SPIKE_COOLDOWN_MS = 3 * 60 * 60 * 1000; // 3 hours
export const SPIKE_MIN_EVENTS = 5;
export const SPIKE_SEVERE_COUNT = 15;
export const SPIKE_MODERATE_COUNT = 8;

export const OVERNIGHT_END_HOUR = 6;
export const LOW_THRESHOLD_MGDL = 70;
export const HIGH_THRESHOLD_MGDL = 180;
export const OVERNIGHT_MIN_NIGHTS = 2;
export const LOW_SEVERE_MGDL = 54;
export const LOW_MODERATE_MGDL = 60;

export const RECORD_TYPE_HISTORIC = 'historic' as const;
export const RECORD_TYPE_SCAN = 'scan' as const;
export const RECORD_TYPE_STRIP = 'strip' as const;
export type RecordType = typeof RECORD_TYPE_HISTORIC | typeof RECORD_TYPE_SCAN | typeof RECORD_TYPE_STRIP;

export interface RawGlucoseReading {
  timestamp: Date;
  valueMgDl: number;
  recordType: RecordType;
}

export interface GlucoseSession {
  readings: RawGlucoseReading[];
  unit: GlucoseUnit;
  startDate: Date;
  endDate: Date;
  fileName: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface GlucoseStatistics {
  timeInRangePct: number;
  timeBelowRangePct: number;
  timeAboveRangePct: number;
  averageMgDl: number;
  estimatedA1C: number;
  gmi: number;
  standardDeviation: number;
  readingCount: number;
}

export const PATTERN_DAWN = 'dawn-phenomenon' as const;
export const PATTERN_POST_MEAL_SPIKE = 'post-meal-spike' as const;
export const PATTERN_OVERNIGHT_LOW = 'overnight-low' as const;

export const SEVERITY_MILD = 'mild' as const;
export const SEVERITY_MODERATE = 'moderate' as const;
export const SEVERITY_SEVERE = 'severe' as const;

export interface GlucosePattern {
  type: typeof PATTERN_DAWN | typeof PATTERN_POST_MEAL_SPIKE | typeof PATTERN_OVERNIGHT_LOW;
  severity: typeof SEVERITY_MILD | typeof SEVERITY_MODERATE | typeof SEVERITY_SEVERE;
  description: string;
  occurrences: number;
}

export const SEVERITY_ORDER: Record<GlucosePattern['severity'], number> = {
  [SEVERITY_SEVERE]: 0,
  [SEVERITY_MODERATE]: 1,
  [SEVERITY_MILD]: 2,
};

export interface Recommendation {
  id: string;
  patternType: GlucosePattern['type'];
  title: string;
  body: string;
  severity: GlucosePattern['severity'];
}

export interface ParseResult {
  session: GlucoseSession | null;
  errors: { row: number; message: string }[];
}

export interface ChartViewport {
  width: number;
  height: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
}

export interface ChartPoint {
  x: number;
  y: number;
  reading: RawGlucoseReading;
}

export interface SvgBand {
  y: number;
  height: number;
  label: string;
  cssClass: string;
}

export interface XTick {
  x: number;
  label: string;
}

export interface YTick {
  y: number;
  label: string;
  valueMgDl: number;
}
