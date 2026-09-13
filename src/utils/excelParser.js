import * as XLSX from 'xlsx';

/**
 * Parse an Excel file buffer into structured JSON data
 * @param {ArrayBuffer} buffer - The file buffer
 * @param {string} fileName - Name of the file
 * @returns {Object} Parsed file data with sheets
 */
export function parseExcelFile(buffer, fileName) {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheets = {};

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

    // Detect column types
    const columnTypes = {};
    headers.forEach((header) => {
      const sampleValues = jsonData.slice(0, 20).map((row) => row[header]).filter((v) => v !== '');
      columnTypes[header] = detectColumnType(sampleValues);
    });

    // Generate summary statistics
    const summary = generateSummary(jsonData, headers, columnTypes);

    sheets[sheetName] = {
      headers,
      rows: jsonData,
      columnTypes,
      summary,
      rowCount: jsonData.length,
      colCount: headers.length,
    };
  });

  return {
    id: generateId(),
    name: fileName,
    uploadedAt: new Date().toISOString(),
    sheetNames: workbook.SheetNames,
    sheets,
  };
}

/**
 * Detect the type of a column based on sample values
 */
function detectColumnType(values) {
  if (values.length === 0) return 'string';

  let numCount = 0;
  let percentCount = 0;
  let dateCount = 0;

  values.forEach((v) => {
    const str = String(v).trim();
    if (!isNaN(Number(str)) && str !== '') {
      numCount++;
      if (Number(str) >= 0 && Number(str) <= 1) percentCount++;
    }
    if (!isNaN(Date.parse(str)) && str.includes('/') || str.includes('-')) {
      dateCount++;
    }
  });

  const total = values.length;
  if (numCount / total > 0.7) {
    if (percentCount / numCount > 0.8) return 'percentage';
    return 'number';
  }
  if (dateCount / total > 0.7) return 'date';
  return 'string';
}

/**
 * Generate summary statistics for a sheet
 */
function generateSummary(rows, headers, columnTypes) {
  const summary = {};

  headers.forEach((header) => {
    const type = columnTypes[header];

    if (type === 'number' || type === 'percentage') {
      const values = rows
        .map((r) => Number(r[header]))
        .filter((v) => !isNaN(v));

      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        summary[header] = {
          type,
          min: sorted[0],
          max: sorted[sorted.length - 1],
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          sum: values.reduce((a, b) => a + b, 0),
          count: values.length,
          median: sorted[Math.floor(sorted.length / 2)],
        };
      }
    } else {
      const uniqueValues = [...new Set(rows.map((r) => r[header]))];
      summary[header] = {
        type,
        uniqueCount: uniqueValues.length,
        topValues: getTopValues(rows, header, 5),
      };
    }
  });

  return summary;
}

/**
 * Get top N most frequent values for a column
 */
function getTopValues(rows, header, n) {
  const freq = {};
  rows.forEach((row) => {
    const val = String(row[header]);
    freq[val] = (freq[val] || 0) + 1;
  });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([value, count]) => ({ value, count }));
}

/**
 * Create a compact data context for AI prompts
 * Truncates large datasets to stay within token limits
 */
export function createDataContext(fileData, activeSheet) {
  const sheet = fileData.sheets[activeSheet];
  if (!sheet) return '';

  const sampleRows = sheet.rows.slice(0, 15);
  const summaryLines = Object.entries(sheet.summary)
    .map(([col, stats]) => {
      if (stats.type === 'number') {
        return `  - ${col}: min=${formatNum(stats.min)}, max=${formatNum(stats.max)}, avg=${formatNum(stats.avg)}, sum=${formatNum(stats.sum)}`;
      } else if (stats.type === 'percentage') {
        return `  - ${col}: min=${(stats.min * 100).toFixed(1)}%, max=${(stats.max * 100).toFixed(1)}%, avg=${(stats.avg * 100).toFixed(1)}%`;
      } else {
        return `  - ${col}: ${stats.uniqueCount} unique values, top: ${stats.topValues?.map((t) => t.value).join(', ')}`;
      }
    })
    .join('\n');

  return `File: ${fileData.name}
Sheet: ${activeSheet}
Columns: ${sheet.headers.join(', ')}
Total Rows: ${sheet.rowCount}

Summary Statistics:
${summaryLines}

Sample Data (first ${sampleRows.length} rows):
${JSON.stringify(sampleRows, null, 2)}`;
}

/**
 * Create a full context from ALL sheets for recommendation generation
 */
export function createFullDataContext(fileData) {
  const lines = [`File: ${fileData.name}`, `Sheets: ${fileData.sheetNames.join(', ')}`, ''];

  fileData.sheetNames.forEach((sheetName) => {
    const sheet = fileData.sheets[sheetName];
    lines.push(`=== Sheet: ${sheetName} (${sheet.rowCount} rows) ===`);
    lines.push(`Columns: ${sheet.headers.join(', ')}`);

    // Add summary
    Object.entries(sheet.summary).forEach(([col, stats]) => {
      if (stats.type === 'number') {
        lines.push(`  ${col}: min=${formatNum(stats.min)}, max=${formatNum(stats.max)}, avg=${formatNum(stats.avg)}, total=${formatNum(stats.sum)}`);
      } else if (stats.type === 'percentage') {
        lines.push(`  ${col}: min=${(stats.min * 100).toFixed(1)}%, max=${(stats.max * 100).toFixed(1)}%, avg=${(stats.avg * 100).toFixed(1)}%`);
      } else {
        lines.push(`  ${col}: ${stats.uniqueCount} unique values`);
      }
    });

    // Add top 10 rows
    const sample = sheet.rows.slice(0, 10);
    lines.push(`Top ${sample.length} rows: ${JSON.stringify(sample)}`);
    lines.push('');
  });

  return lines.join('\n');
}

function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
