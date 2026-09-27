'use client';

import { useState, useMemo } from 'react';
import { useExcelStore } from '@/hooks/useExcelStore';
import { createDataContext } from '@/utils/excelParser';
import ReactMarkdown from 'react-markdown';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  GitCompare, Sparkles, ArrowRight, Layers, FileSpreadsheet,
  AlertCircle, RefreshCw, BarChart2, CheckCircle2, Plus, Trash2, Calendar
} from 'lucide-react';
import styles from './CompareContent.module.css';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const SERIES_COLORS = ['#4361EE', '#FF006E', '#FFBE0B', '#06D6A0', '#8338EC', '#FB5607', '#00BBF9'];

/**
 * Helper to detect month from filename or sheetname
 */
function detectMonthLabel(fileName = '', sheetName = '', defaultIndex = 0) {
  const str = `${fileName} ${sheetName}`.toLowerCase();
  
  const monthMap = [
    { keys: ['jan', 'januari', 'january'], name: 'Januari' },
    { keys: ['feb', 'februari', 'february'], name: 'Februari' },
    { keys: ['mar', 'maret', 'march'], name: 'Maret' },
    { keys: ['apr', 'april'], name: 'April' },
    { keys: ['mei', 'may'], name: 'Mei' },
    { keys: ['jun', 'juni', 'june'], name: 'Juni' },
    { keys: ['jul', 'juli', 'july'], name: 'Juli' },
    { keys: ['agu', 'aug', 'agustus', 'august'], name: 'Agustus' },
    { keys: ['sep', 'september'], name: 'September' },
    { keys: ['okt', 'oct', 'oktober', 'october'], name: 'Oktober' },
    { keys: ['nov', 'november'], name: 'November' },
    { keys: ['des', 'dec', 'desember', 'december'], name: 'Desember' },
  ];

  for (const m of monthMap) {
    if (m.keys.some((k) => str.includes(k))) {
      return m.name;
    }
  }

  return MONTH_NAMES[defaultIndex % MONTH_NAMES.length] || `Dataset ${defaultIndex + 1}`;
}

export default function CompareContent() {
  const { files, fileOrder, hasFiles, sidebarCollapsed, chatOpen } = useExcelStore();

  const fileList = useMemo(() => fileOrder.map((id) => files[id]), [fileOrder, files]);

  // Initial datasets: dataset 1 (Mei) and dataset 2 (Juni)
  const initialDatasets = useMemo(() => {
    if (!fileList.length) return [];
    
    const fileA = fileList[0];
    const sheetA = fileA?.sheetNames[0] || '';
    const labelA = detectMonthLabel(fileA?.name, sheetA, 4); // Default Mei

    const fileB = fileList.length > 1 ? fileList[1] : fileList[0];
    const sheetB = fileList.length > 1 ? fileB?.sheetNames[0] : (fileA?.sheetNames[1] || sheetA);
    const labelB = detectMonthLabel(fileB?.name, sheetB, 5); // Default Juni

    return [
      { id: 'ds_0', fileId: fileA?.id || '', sheet: sheetA, monthLabel: labelA },
      { id: 'ds_1', fileId: fileB?.id || '', sheet: sheetB, monthLabel: labelB },
    ];
  }, [fileList]);

  const [selectedDatasets, setSelectedDatasets] = useState(initialDatasets);
  const [customQuestion, setCustomQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState('');

  // Handle dataset change
  const handleDatasetChange = (index, field, value) => {
    setSelectedDatasets((prev) => {
      const next = [...prev];
      const target = { ...next[index], [field]: value };

      if (field === 'fileId') {
        const fileObj = files[value];
        if (fileObj) {
          target.sheet = fileObj.sheetNames[0];
          // Auto update month label if default
          target.monthLabel = detectMonthLabel(fileObj.name, target.sheet, index + 4);
        }
      }
      next[index] = target;
      return next;
    });
  };

  // Add dataset
  const addDataset = () => {
    if (selectedDatasets.length >= 6) return;
    const nextIdx = selectedDatasets.length;
    const defaultFile = fileList[nextIdx % fileList.length] || fileList[0];
    const defaultSheet = defaultFile?.sheetNames[0] || '';
    const defaultLabel = detectMonthLabel(defaultFile?.name, defaultSheet, nextIdx + 4);

    setSelectedDatasets((prev) => [
      ...prev,
      {
        id: `ds_${Date.now()}`,
        fileId: defaultFile?.id || '',
        sheet: defaultSheet,
        monthLabel: defaultLabel,
      },
    ]);
  };

  // Remove dataset
  const removeDataset = (index) => {
    if (selectedDatasets.length <= 2) return;
    setSelectedDatasets((prev) => prev.filter((_, i) => i !== index));
  };

  if (!hasFiles) {
    return (
      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${chatOpen ? 'chat-open' : ''} ${styles.container}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <GitCompare className={styles.titleIcon} /> Compare Datasets
          </h1>
          <p className={styles.subtitle}>Bandingkan data antar 2 atau lebih file Excel atau sheet</p>
        </div>
        <div className={styles.emptyState}>
          <FileSpreadsheet className={styles.emptyIcon} />
          <h3>Belum Ada Data Terunggah</h3>
          <p>Silakan unggah minimal 1 file Excel terlebih dahulu di halaman Dashboard untuk mulai membandingkan data.</p>
          <a href="/" className={styles.primaryBtn}>
            Ke Dashboard & Upload
          </a>
        </div>
      </main>
    );
  }

  // Active dataset data objects
  const resolvedDatasets = selectedDatasets.map((ds) => {
    const fileObj = files[ds.fileId] || fileList[0];
    const sheetName = ds.sheet || fileObj?.sheetNames[0];
    const sheetData = fileObj?.sheets[sheetName];
    return {
      ...ds,
      fileObj,
      sheetName,
      sheetData,
      label: ds.monthLabel || `Dataset ${ds.id}`,
    };
  });

  // Collect numeric metrics common or present in first dataset
  const firstSheetHeaders = resolvedDatasets[0]?.sheetData?.headers || [];
  const numericMetrics = firstSheetHeaders.filter(
    (h) =>
      resolvedDatasets[0]?.sheetData?.columnTypes[h] === 'number' ||
      resolvedDatasets[0]?.sheetData?.columnTypes[h] === 'percentage'
  );

  // Build metrics comparison data
  const comparisonStats = numericMetrics.map((metric) => {
    const values = resolvedDatasets.map((ds) => {
      const sum = ds.sheetData?.summary?.[metric]?.sum || 0;
      const avg = ds.sheetData?.summary?.[metric]?.avg || 0;
      return {
        label: ds.label,
        sum,
        avg,
      };
    });

    const firstSum = values[0]?.sum || 0;
    const lastSum = values[values.length - 1]?.sum || 0;
    const diff = lastSum - firstSum;
    const pctChange = firstSum !== 0 ? ((lastSum - firstSum) / Math.abs(firstSum)) * 100 : 0;

    return {
      metric,
      values,
      firstSum,
      lastSum,
      diff,
      pctChange,
    };
  });

  // Build chart comparison data using month labels
  const chartData = comparisonStats.map((item) => {
    const row = { name: item.metric };
    item.values.forEach((v) => {
      row[v.label] = Number(v.sum.toFixed(2));
    });
    return row;
  });

  // Handle AI Comparison analysis call
  const handleCompareAI = async () => {
    setLoadingAI(true);
    setAiError('');

    try {
      const contexts = resolvedDatasets.map((ds) =>
        createDataContext(ds.fileObj, ds.sheetName)
      );

      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasets: contexts,
          datasetA: contexts[0],
          datasetB: contexts[1],
          question: customQuestion.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses perbandingan');
      }

      setAiResponse(data.response);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${chatOpen ? 'chat-open' : ''} ${styles.container}`}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <GitCompare className={styles.titleIcon} /> Compare Datasets
          </h1>
          <p className={styles.subtitle}>
            Bandingkan 2 atau lebih dataset/bulan (contoh: Mei vs Juni) secara komparatif dengan angka selisih & persentase
          </p>
        </div>
      </div>

      {/* Dataset Selectors Grid (Supports 2 or more files/sheets) */}
      <section className={styles.section}>
        <div className={styles.selectorHeader}>
          <h2 className={styles.sectionTitle}>
            <Layers className={styles.secIcon} /> Dataset Selection ({selectedDatasets.length} Datasets)
          </h2>
          {selectedDatasets.length < 6 && (
            <button onClick={addDataset} className={styles.addDatasetBtn}>
              <Plus size={16} /> Tambah Dataset
            </button>
          )}
        </div>

        <div className={styles.multiSelectorGrid}>
          {selectedDatasets.map((ds, idx) => {
            const color = SERIES_COLORS[idx % SERIES_COLORS.length];
            const currentFile = files[ds.fileId] || fileList[0];
            const currentSheetData = currentFile?.sheets[ds.sheet];

            return (
              <div
                key={ds.id || idx}
                className={styles.selectorCard}
                style={{ borderTop: `6px solid ${color}` }}
              >
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardBadge} style={{ backgroundColor: color }}>
                    Dataset {String.fromCharCode(65 + idx)}
                  </div>
                  {selectedDatasets.length > 2 && (
                    <button
                      onClick={() => removeDataset(idx)}
                      className={styles.removeDatasetBtn}
                      title="Hapus dataset ini"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Month Label Input / Dropdown */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Calendar size={13} /> Label Bulan / Periode:
                  </label>
                  <div className={styles.monthInputWrapper}>
                    <select
                      value={MONTH_NAMES.includes(ds.monthLabel) ? ds.monthLabel : 'custom'}
                      onChange={(e) => {
                        if (e.target.value !== 'custom') {
                          handleDatasetChange(idx, 'monthLabel', e.target.value);
                        }
                      }}
                      className={styles.selectSm}
                    >
                      {MONTH_NAMES.map((m) => (
                        <option key={m} value={m}>
                          📅 {m}
                        </option>
                      ))}
                      <option value="custom">Custom...</option>
                    </select>
                    <input
                      type="text"
                      value={ds.monthLabel}
                      onChange={(e) => handleDatasetChange(idx, 'monthLabel', e.target.value)}
                      placeholder="e.g. Mei, Juni"
                      className={styles.inputMonth}
                    />
                  </div>
                </div>

                {/* File Select */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Pilih File:</label>
                  <select
                    value={ds.fileId}
                    onChange={(e) => handleDatasetChange(idx, 'fileId', e.target.value)}
                    className={styles.select}
                  >
                    {fileList.map((f) => (
                      <option key={f.id} value={f.id}>
                        📄 {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sheet Select */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Pilih Sheet:</label>
                  <select
                    value={ds.sheet}
                    onChange={(e) => handleDatasetChange(idx, 'sheet', e.target.value)}
                    className={styles.select}
                  >
                    {currentFile?.sheetNames.map((s) => (
                      <option key={s} value={s}>
                        📊 {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.datasetInfo}>
                  <span>Baris: <strong>{currentSheetData?.rowCount || 0}</strong></span>
                  <span>Kolom: <strong>{currentSheetData?.colCount || 0}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparison Metrics Grid (Card with Mei -> Juni values, % and selisih) */}
      {comparisonStats.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <BarChart2 className={styles.secIcon} /> Comparison Breakdown
          </h2>

          <div className={styles.statsGrid}>
            {comparisonStats.map((item) => (
              <div key={item.metric} className={styles.statCard}>
                {/* Metric Name */}
                <div className={styles.statHeader}>{item.metric}</div>

                <div className={styles.cardDivider} />

                {/* Month labels & Values: Mei -> Juni -> Juli */}
                <div className={styles.monthValuesGrid}>
                  {item.values.map((v, i) => (
                    <div key={i} className={styles.monthValueItem}>
                      <div className={styles.monthNameTag} style={{ color: SERIES_COLORS[i % SERIES_COLORS.length] }}>
                        {v.label}
                      </div>
                      <div className={styles.monthValueNum}>{formatNumber(v.sum)}</div>
                      {i < item.values.length - 1 && (
                        <ArrowRight className={styles.monthArrow} size={16} />
                      )}
                    </div>
                  ))}
                </div>

                <div className={styles.cardDivider} />

                {/* Footer: Presentase & Selisih */}
                <div className={styles.diffBar}>
                  <span
                    className={`${styles.badge} ${
                      item.pctChange >= 0 ? styles.positiveBadge : styles.negativeBadge
                    }`}
                  >
                    Presentase: {item.pctChange >= 0 ? '+' : ''}
                    {item.pctChange.toFixed(1)}%
                  </span>
                  <span className={styles.diffText}>
                    Selisih: {item.diff >= 0 ? '+' : ''}
                    {formatNumber(item.diff)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Visual Chart Comparison with Month Legends & Tooltips */}
      {chartData.length > 0 && (
        <section className={styles.section}>
          <div className={styles.chartBox}>
            <div className={styles.chartBoxHeader}>
              <h3 className={styles.chartTitle}>Visual Comparison ({selectedDatasets.map((d) => d.monthLabel).join(' vs ')})</h3>
              <p className={styles.chartSubtitle}>Grafik membandingkan total nilai metrik per bulan</p>
            </div>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                  <XAxis dataKey="name" stroke="#000" style={{ fontWeight: 'bold', fontSize: '0.85rem' }} />
                  <YAxis stroke="#000" tickFormatter={formatNumber} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFDF7',
                      border: '3px solid #000',
                      boxShadow: '4px 4px 0px #000',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                    }}
                    formatter={(value, name) => [formatNumber(value), name]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontWeight: 'bold' }} />
                  {selectedDatasets.map((ds, idx) => (
                    <Bar
                      key={ds.monthLabel || idx}
                      dataKey={ds.monthLabel}
                      name={ds.monthLabel}
                      fill={SERIES_COLORS[idx % SERIES_COLORS.length]}
                      stroke="#000"
                      strokeWidth={2}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* AI Comparison Analyst Section */}
      <section className={styles.section}>
        <div className={styles.aiBox}>
          <div className={styles.aiHeader}>
            <Sparkles className={styles.aiIcon} />
            <div>
              <h3>AI Comparison Analyst</h3>
              <p>Minta AI menganalisis tren pertumbuhan, pola perubahan antarbulan, dan rekomendasi strategis.</p>
            </div>
          </div>

          <div className={styles.promptInputGroup}>
            <input
              type="text"
              placeholder="Contoh: Mengapa active user di bulan Juni meningkat dibanding Mei?"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              className={styles.inputPrompt}
              onKeyDown={(e) => e.key === 'Enter' && handleCompareAI()}
            />
            <button
              onClick={handleCompareAI}
              disabled={loadingAI}
              className={styles.generateBtn}
            >
              {loadingAI ? (
                <>
                  <RefreshCw className={styles.spin} /> Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Minta Analisis AI
                </>
              )}
            </button>
          </div>

          {aiError && (
            <div className={styles.errorBox}>
              <AlertCircle size={18} /> {aiError}
            </div>
          )}

          {aiResponse && (
            <div className={styles.responseContainer}>
              <div className={styles.responseTitle}>
                <CheckCircle2 size={20} color="#06D6A0" /> Analisis AI Result:
              </div>
              <div className={styles.markdownBody}>
                <ReactMarkdown>{aiResponse}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function formatNumber(val) {
  if (val === undefined || val === null) return '0';
  if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + 'M';
  if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'K';
  if (Number.isInteger(val)) return val.toLocaleString();
  return val.toFixed(2);
}

