'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import styles from './StatsCard.module.css';

const COLORS = ['blue', 'pink', 'yellow', 'green', 'orange', 'purple'];

export default function StatsCard({ title, value, subtitle, trend, icon, colorIndex = 0 }) {
  const color = COLORS[colorIndex % COLORS.length];

  return (
    <div className={`${styles.card} ${styles[color]}`} id={`stat-${title?.replace(/\s+/g, '-')?.toLowerCase()}`}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      <div className={styles.value}>{value}</div>
      <div className={styles.footer}>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        {trend !== undefined && trend !== null && (
          <span className={`${styles.trend} ${trend > 0 ? styles.trendUp : trend < 0 ? styles.trendDown : ''}`}>
            {trend > 0 ? <TrendingUp size={14} strokeWidth={3} /> : trend < 0 ? <TrendingDown size={14} strokeWidth={3} /> : <Minus size={14} strokeWidth={3} />}
            {trend > 0 ? '+' : ''}{typeof trend === 'number' ? trend.toFixed(1) : trend}%
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Generate stats cards from sheet data
 */
export function generateStatsFromSheet(sheetData) {
  if (!sheetData || !sheetData.summary) return [];
  const stats = [];

  const { summary, rowCount, headers, columnTypes } = sheetData;

  // Total rows
  stats.push({
    title: 'Total Rows',
    value: rowCount.toLocaleString(),
    subtitle: `${headers.length} columns`,
    icon: '📊',
  });

  // Find the most interesting numeric columns
  const numericEntries = Object.entries(summary).filter(
    ([, s]) => s.type === 'number'
  );

  numericEntries.slice(0, 3).forEach(([col, s]) => {
    const formatVal = (v) => {
      if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
      if (v >= 1000) return (v / 1000).toFixed(1) + 'K';
      if (Number.isInteger(v)) return v.toLocaleString();
      return v.toFixed(2);
    };

    stats.push({
      title: col,
      value: formatVal(s.sum),
      subtitle: `avg: ${formatVal(s.avg)}`,
      icon: col.toLowerCase().includes('user') ? '👥' : col.toLowerCase().includes('event') ? '⚡' : '📈',
    });
  });

  return stats;
}
