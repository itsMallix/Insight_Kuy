'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import styles from './StatsCard.module.css';

const COLORS = ['blue', 'pink', 'yellow', 'green', 'orange', 'purple'];

const METRIC_DICTIONARY = {
  'active user': {
    desc: 'Pengguna unik yang melakukan setidaknya 1 sesi interaktif dalam rentang waktu tertera.',
    formula: 'Total Unique User IDs',
  },
  'active users': {
    desc: 'Pengguna unik yang melakukan setidaknya 1 sesi interaktif dalam rentang waktu tertera.',
    formula: 'Total Unique User IDs',
  },
  'engaged session': {
    desc: 'Sesi yang berlangsung ≥ 10 detik, memiliki 2+ tayangan halaman, atau terjadi 1+ konversi.',
    formula: 'Count(sessions where duration >= 10s OR pageviews >= 2 OR conversions >= 1)',
  },
  'engaged sessions': {
    desc: 'Sesi yang berlangsung ≥ 10 detik, memiliki 2+ tayangan halaman, atau terjadi 1+ konversi.',
    formula: 'Count(sessions where duration >= 10s OR pageviews >= 2 OR conversions >= 1)',
  },
  'engagement rate': {
    desc: 'Rasio persentase sesi yang engaged terhadap seluruh sesi pengunjung.',
    formula: '(Engaged Sessions / Total Sessions) × 100%',
  },
  'bounce rate': {
    desc: 'Persentase sesi pengguna yang keluar tanpa interaksi lanjutan.',
    formula: '100% - Engagement Rate',
  },
  'new users': {
    desc: 'Pengguna yang baru pertama kali mengunjungi web atau menginstal aplikasi.',
    formula: 'Count(first_visit + first_open events)',
  },
  'new user': {
    desc: 'Pengguna yang baru pertama kali mengunjungi web atau menginstal aplikasi.',
    formula: 'Count(first_visit + first_open events)',
  },
  'event count': {
    desc: 'Jumlah total peristiwa/aksi (click, scroll, pageview, dsb) yang terjadi.',
    formula: 'Σ (All Events Triggered)',
  },
  'conversions': {
    desc: 'Jumlah aksi penting/pembelian yang ditandai sebagai indikator sukses bisnis.',
    formula: 'Σ (Key Action Events)',
  },
  'revenue': {
    desc: 'Total jumlah pendapatan keuangan dari transaksi pembelian.',
    formula: 'Σ (Quantity × Unit Price)',
  },
  'sessions': {
    desc: 'Total periode keaktifan beruntun pengguna pada website/aplikasi.',
    formula: 'Count(unique session_start events)',
  },
  'user engagement': {
    desc: 'Total durasi pengguna aktif berada di tampilan layar utama (foreground).',
    formula: 'Σ (Engagement Duration in seconds)',
  },
};

export default function StatsCard({
  title,
  tableName,
  rowCount,
  colCount,
  value,
  subtitle,
  trend,
  icon,
  colorIndex = 0,
  description,
  formula,
  headers = [],
  sampleRow = null,
  isTableSummary = false,
}) {
  const color = COLORS[colorIndex % COLORS.length];

  // Lookup dictionary if no description/formula passed
  const metricKey = title?.toLowerCase()?.trim();
  const dictInfo = METRIC_DICTIONARY[metricKey];
  
  const finalDesc = description || dictInfo?.desc || (isTableSummary ? `Rangkuman data tabel ${tableName || title}.` : `Metrik data ${title} dari laporan Excel.`);
  const finalFormula = formula || dictInfo?.formula || null;

  return (
    <div className={`${styles.card} ${styles[color]}`} id={`stat-${title?.replace(/\s+/g, '-')?.toLowerCase()}`}>
      {/* Header: Total Rows / Title + Icon */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.titleLabel}>
            {isTableSummary ? `Total Rows: ${tableName || title}` : title}
          </span>
        </div>
        <span className={styles.icon}>{icon || (isTableSummary ? '📊' : '📈')}</span>
      </div>

      {/* Main Stats Body: Rows & Columns count for table summary, or value for metric cards */}
      <div className={styles.mainStats}>
        {isTableSummary ? (
          <div className={styles.valueRow}>
            <span className={styles.value}>{rowCount !== undefined ? rowCount.toLocaleString() : value}</span>
            <span className={styles.neoBadge}>total rows</span>
          </div>
        ) : (
          <div className={styles.valueRow}>
            <span className={styles.value}>{value}</span>
            {subtitle && <span className={styles.neoBadge}>{subtitle}</span>}
          </div>
        )}
      </div>

      {/* Footer / Info Section */}
      <div className={styles.footerSection}>
        {/* Keterangan & Rumus */}
        <p className={styles.descriptionText}>
          {finalDesc}
        </p>

        {finalFormula && (
          <div className={styles.formulaBox}>
            <span className={styles.formulaBadge}>Rumus Perhitungan:</span>
            <code className={styles.formulaCode}>{finalFormula}</code>
          </div>
        )}

      </div>
    </div>
  );
}

/**
 * Generate stats cards from active sheet data
 */
export function generateStatsFromSheet(sheetData, sheetName) {
  if (!sheetData || !sheetData.summary) return [];
  const stats = [];
  const name = sheetName || 'Tabel Data';

  const { summary, rowCount, headers, colCount, rows } = sheetData;
  const sampleRow = rows && rows.length > 0 ? rows[0] : null;

  // 1. Table Info Card (Total rows, col count, headers, sample)
  stats.push({
    title: `Total Rows ${name}`,
    tableName: name,
    rowCount: rowCount,
    colCount: colCount || headers.length,
    headers: headers,
    sampleRow: sampleRow,
    icon: '📊',
    isTableSummary: true,
    description: `Tabel ${name} memuat seluruh dataset hasil ekspor Google Analytics dengan total ${rowCount.toLocaleString()} baris dan ${headers.length} kolom data.`,
  });

  // 2. Find numeric columns for metric cards
  const numericEntries = Object.entries(summary).filter(
    ([, s]) => s.type === 'number' || s.type === 'percentage'
  );

  numericEntries.slice(0, 3).forEach(([col, s]) => {
    const formatVal = (v) => {
      if (s.type === 'percentage') return (v * 100).toFixed(1) + '%';
      if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
      if (v >= 1000) return (v / 1000).toFixed(1) + 'K';
      if (Number.isInteger(v)) return v.toLocaleString();
      return v.toFixed(2);
    };

    const colLower = col.toLowerCase();
    const icon = colLower.includes('user') ? '👥' : colLower.includes('session') ? '⚡' : colLower.includes('revenue') || colLower.includes('price') ? '💰' : '📈';

    stats.push({
      title: col,
      value: formatVal(s.sum),
      subtitle: `Rata-rata: ${formatVal(s.avg)}`,
      icon,
      isTableSummary: false,
    });
  });

  return stats;
}

