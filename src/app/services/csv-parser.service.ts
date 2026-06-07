import { Injectable } from '@angular/core';
import * as Papa from 'papaparse';
import { CSV_HEADER_GLUCOSE_FALLBACK, CSV_HEADER_GLUCOSE_PRIMARY, CSV_HEADER_RECORD_TYPE, CSV_HEADER_TIMESTAMP, CSV_RECORD_TYPE_HISTORIC, CSV_RECORD_TYPE_SCAN, GlucoseSession, GlucoseUnit, MMOL_TO_MGDL, ParseResult, RawGlucoseReading, RECORD_TYPE_HISTORIC, RECORD_TYPE_SCAN, RecordType, UNIT_MGDL, UNIT_MMOL } from '../models/glucose.models';
import { parseTimestamp } from '../utils/date-utils';

// Used this libary for CSV parsing:
// https://www.npmjs.com/package/papaparse
// https://www.papaparse.com/docs#config

/** Parses FreeStyle Libre CSV exports into structured {@link GlucoseSession} objects. */
@Injectable({ providedIn: 'root' })
export class CsvParserService {

  /**
   * Parses a FreeStyle Libre CSV file and returns all valid glucose readings plus a list
   * of any rows that could not be parsed. Returns `session: null` if the file structure
   * is unrecognisable or contains no valid readings.
   */
  async parseFile(file: File): Promise<ParseResult> {
    const errors: { row: number; message: string }[] = [];

    // Promise here instead of an observable because it's OK for "one shot"
    // async work, just need to make sure to update the signal for re-render
    const rows: string[][] = await new Promise((resolve, reject) => {
      Papa.parse<string[]>(file, {
        skipEmptyLines: true,
        complete: result => resolve(result.data),
        error: err => reject(err),
      });
    });

    // Find the header row by looking for "Device Timestamp"
    const headerRowIdx = rows.findIndex(row =>
      row.some(cell => cell.toLowerCase().includes(CSV_HEADER_TIMESTAMP))
    );

    if (headerRowIdx === -1) {
      return { session: null, errors: [{ row: 0, message: 'Could not find header row with "Device Timestamp" column.' }] };
    }

    // Find the column indices of timestamps bg was taken,
    // the type of bg record it was, and the bg number
    const headers = rows[headerRowIdx].map(h => h.trim());
    const colTimestamp = headers.findIndex(h =>
      h.toLowerCase().includes(CSV_HEADER_TIMESTAMP)
    );
    const colRecordType = headers.findIndex(h =>
      h.toLowerCase().includes(CSV_HEADER_RECORD_TYPE)
    );
    const glucoseColIdx = headers.findIndex(h =>
      h.toLowerCase().includes(CSV_HEADER_GLUCOSE_PRIMARY) || h.toLowerCase().includes(CSV_HEADER_GLUCOSE_FALLBACK)
    );

    if (colTimestamp === -1 || colRecordType === -1 || glucoseColIdx === -1) {
      return { session: null, errors: [{ row: headerRowIdx, message: 'Required columns not found (Device Timestamp, Record Type, Historic Glucose).' }] };
    }

    const unit: GlucoseUnit = headers[glucoseColIdx].includes(UNIT_MMOL) ? UNIT_MMOL : UNIT_MGDL;
    const readings: RawGlucoseReading[] = [];

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const cells = rows[i];
      const recordTypeRaw = cells[colRecordType]?.trim();

      // Only process Record Type 0 (historic) and 1 (scan)
      if (recordTypeRaw !== CSV_RECORD_TYPE_HISTORIC && recordTypeRaw !== CSV_RECORD_TYPE_SCAN) continue;

      const glucoseRaw = cells[glucoseColIdx]?.trim();
      if (!glucoseRaw) continue;

      const glucoseVal = parseFloat(glucoseRaw);
      if (isNaN(glucoseVal)) {
        errors.push({ row: i, message: `Non-numeric glucose value: "${glucoseRaw}"` });
        continue;
      }

      const timestampRaw = cells[colTimestamp]?.trim();
      const timestamp = parseTimestamp(timestampRaw);
      if (!timestamp) {
        errors.push({ row: i, message: `Unparseable timestamp: "${timestampRaw}"` });
        continue;
      }

      const valueMgDl = unit === UNIT_MMOL ? glucoseVal * MMOL_TO_MGDL : glucoseVal;
      const recordType: RecordType = recordTypeRaw === CSV_RECORD_TYPE_SCAN ? RECORD_TYPE_SCAN : RECORD_TYPE_HISTORIC;

      readings.push({ timestamp, valueMgDl, recordType });
    }

    if (readings.length === 0) {
      return { session: null, errors: [...errors, { row: -1, message: 'No glucose readings found in file.' }] };
    }

    readings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const session: GlucoseSession = {
      readings,
      unit,
      startDate: readings[0].timestamp,
      endDate: readings[readings.length - 1].timestamp,
      fileName: file.name,
    };

    return { session, errors };
  }
}
