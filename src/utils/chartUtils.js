/**
 * Chart utility functions for Recharts with Neobrutalism colors
 */

// Neobrutalism color palette for charts
export const CHART_COLORS = [
  '#4361EE', // Primary Blue
  '#FF006E', // Hot Pink
  '#FFBE0B', // Bold Yellow
  '#06D6A0', // Lime Green
  '#FB5607', // Vivid Orange
  '#8338EC', // Bold Purple
  '#00BBF9', // Cyan
  '#EF233C', // Red
  '#3A86FF', // Sky Blue
  '#FF595E', // Coral
];

/**
 * Auto-suggest the best chart type for given data
 */
export function suggestChartType(headers, rows, columnTypes) {
  const numericCols = headers.filter((h) => columnTypes[h] === 'number' || columnTypes[h] === 'percentage');
  const stringCols = headers.filter((h) => columnTypes[h] === 'string');

  if (stringCols.length >= 1 && numericCols.length >= 1) {
    if (rows.length <= 8) return 'pie';
    if (rows.length <= 20) return 'bar';
    return 'bar';
  }

  if (numericCols.length >= 2) return 'line';
  return 'bar';
}

/**
 * Prepare chart data from sheet data
 */
export function prepareChartData(rows, labelColumn, valueColumns, maxItems = 10) {
  const slicedRows = rows.slice(0, maxItems);

  return slicedRows.map((row) => {
    const item = { name: truncateLabel(String(row[labelColumn]), 25) };
    valueColumns.forEach((col) => {
      item[col] = Number(row[col]) || 0;
    });
    return item;
  });
}

/**
 * Get the best label and value columns for a chart
 */
export function getDefaultChartConfig(headers, columnTypes) {
  const stringCols = headers.filter((h) => columnTypes[h] === 'string');
  const numericCols = headers.filter((h) => columnTypes[h] === 'number');

  const labelColumn = stringCols[0] || headers[0];
  // Pick first 2-3 numeric columns that seem most interesting
  const valueColumns = numericCols.slice(0, 3);

  return { labelColumn, valueColumns };
}

/**
 * Format number for chart tooltips
 */
export function formatChartValue(value) {
  if (typeof value !== 'number') return value;
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
  if (value % 1 !== 0) return value.toFixed(2);
  return value.toLocaleString();
}

function truncateLabel(label, maxLen) {
  if (label.length <= maxLen) return label;
  return label.substring(0, maxLen - 3) + '...';
}

/**
 * Custom Neobrutalism tooltip style for Recharts
 */
export const neoTooltipStyle = {
  backgroundColor: '#FFFFFF',
  border: '3px solid #000000',
  borderRadius: '8px',
  boxShadow: '4px 4px 0px #000000',
  padding: '12px',
  fontFamily: "'Inter', sans-serif",
  fontSize: '13px',
};
