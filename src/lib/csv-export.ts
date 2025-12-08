/**
 * CSV Export Utility
 * Provides functions to convert data to CSV format and trigger downloads
 */

/**
 * Converts an array of objects to CSV format
 * @param data - Array of objects to convert
 * @param headers - Optional custom headers mapping (key -> display name)
 * @returns CSV string
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  headers?: Record<string, string>
): string {
  if (data.length === 0) {
    return '';
  }

  // Get keys from first object
  const keys = Object.keys(data[0]);
  
  // Create header row
  const headerRow = keys
    .map(key => headers?.[key] || key)
    .map(escapeCSVField)
    .join(',');

  // Create data rows
  const dataRows = data.map(obj =>
    keys
      .map(key => {
        const value = obj[key];
        return escapeCSVField(formatCSVValue(value));
      })
      .join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Escapes CSV field values (handles commas, quotes, newlines)
 */
function escapeCSVField(field: string): string {
  if (field == null) {
    return '';
  }

  const stringField = String(field);
  
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }

  return stringField;
}

/**
 * Formats values for CSV export
 */
function formatCSVValue(value: any): string {
  if (value == null) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não';
  }

  if (value instanceof Date) {
    return value.toLocaleDateString('pt-BR');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Triggers a CSV file download
 * @param csvContent - CSV content string
 * @param filename - Name of the file to download
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Converts data to CSV and triggers download
 * @param data - Array of objects to export
 * @param filename - Name of the file to download
 * @param headers - Optional custom headers mapping
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: Record<string, string>
): void {
  const csvContent = convertToCSV(data, headers);
  downloadCSV(csvContent, filename);
}
