'use client';

import { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { BarChart3, LineChartIcon, PieChartIcon, AreaChartIcon } from 'lucide-react';
import { useExcelStore } from '@/hooks/useExcelStore';
import {
  CHART_COLORS, suggestChartType, prepareChartData,
  getDefaultChartConfig, neoTooltipStyle, formatChartValue,
} from '@/utils/chartUtils';
import styles from './ChartPanel.module.css';

const CHART_TYPES = [
  { key: 'bar', icon: <BarChart3 size={16} strokeWidth={2.5} />, label: 'Bar' },
  { key: 'line', icon: <LineChartIcon size={16} strokeWidth={2.5} />, label: 'Line' },
  { key: 'pie', icon: <PieChartIcon size={16} strokeWidth={2.5} />, label: 'Pie' },
  { key: 'area', icon: <AreaChartIcon size={16} strokeWidth={2.5} />, label: 'Area' },
];

export default function ChartPanel() {
  const { activeSheetData } = useExcelStore();
  const [chartType, setChartType] = useState(null);
  const [selectedValueCol, setSelectedValueCol] = useState(null);

  const config = useMemo(() => {
    if (!activeSheetData) return null;
    return getDefaultChartConfig(activeSheetData.headers, activeSheetData.columnTypes);
  }, [activeSheetData]);

  const suggestedType = useMemo(() => {
    if (!activeSheetData) return 'bar';
    return suggestChartType(activeSheetData.headers, activeSheetData.rows, activeSheetData.columnTypes);
  }, [activeSheetData]);

  const currentType = chartType || suggestedType;

  const numericCols = useMemo(() => {
    if (!activeSheetData) return [];
    return activeSheetData.headers.filter(
      (h) => activeSheetData.columnTypes[h] === 'number' || activeSheetData.columnTypes[h] === 'percentage'
    );
  }, [activeSheetData]);

  const chartData = useMemo(() => {
    if (!activeSheetData || !config) return [];
    const valueCols = selectedValueCol ? [selectedValueCol] : config.valueColumns.slice(0, 2);
    return prepareChartData(activeSheetData.rows, config.labelColumn, valueCols, 10);
  }, [activeSheetData, config, selectedValueCol]);

  const valueCols = selectedValueCol ? [selectedValueCol] : (config?.valueColumns?.slice(0, 2) || []);

  if (!activeSheetData) {
    return (
      <div className={`neo-card-static ${styles.empty}`}>
        <p>Upload a file to see charts</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={neoTooltipStyle}>
        <p style={{ fontWeight: 700, marginBottom: 4, fontFamily: "'Space Grotesk', sans-serif" }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color, fontSize: '0.85rem' }}>
            {entry.name}: <strong>{formatChartValue(entry.value)}</strong>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="neo-card-static" id="chart-panel">
      <div className={styles.header}>
        <h3 className={styles.title}>📈 Chart</h3>
        <div className={styles.controls}>
          <select
            className={`neo-select ${styles.colSelect}`}
            value={selectedValueCol || ''}
            onChange={(e) => setSelectedValueCol(e.target.value || null)}
          >
            <option value="">Auto</option>
            {numericCols.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className={styles.chartTypeToggle}>
            {CHART_TYPES.map((t) => (
              <button
                key={t.key}
                className={`${styles.typeBtn} ${currentType === t.key ? styles.typeBtnActive : ''}`}
                onClick={() => setChartType(t.key)}
                title={t.label}
              >
                {t.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={300}>
          {currentType === 'bar' ? (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "'Inter', sans-serif" }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={formatChartValue} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {valueCols.map((col, i) => (
                <Bar key={col} dataKey={col} fill={CHART_COLORS[i]} stroke="#000" strokeWidth={2} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          ) : currentType === 'line' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={formatChartValue} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {valueCols.map((col, i) => (
                <Line key={col} type="monotone" dataKey={col} stroke={CHART_COLORS[i]} strokeWidth={3} dot={{ stroke: '#000', strokeWidth: 2, r: 5, fill: CHART_COLORS[i] }} />
              ))}
            </LineChart>
          ) : currentType === 'pie' ? (
            <PieChart>
              <Pie
                data={chartData}
                dataKey={valueCols[0] || 'value'}
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                stroke="#000"
                strokeWidth={2}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={{ stroke: '#000', strokeWidth: 1 }}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={formatChartValue} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {valueCols.map((col, i) => (
                <Area key={col} type="monotone" dataKey={col} fill={CHART_COLORS[i]} fillOpacity={0.3} stroke={CHART_COLORS[i]} strokeWidth={2} />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
