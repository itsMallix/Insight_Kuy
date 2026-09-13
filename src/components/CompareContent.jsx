'use client';

import { useState } from 'react';
import { useExcelStore } from '@/hooks/useExcelStore';
import { createDataContext } from '@/utils/excelParser';
import ReactMarkdown from 'react-markdown';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  GitCompare, Sparkles, ArrowRight, Layers, FileSpreadsheet,
  AlertCircle, RefreshCw, BarChart2, CheckCircle2
} from 'lucide-react';
import styles from './CompareContent.module.css';

export default function CompareContent() {
  const { files, fileOrder, hasFiles, sidebarCollapsed, chatOpen } = useExcelStore();

  const fileList = fileOrder.map((id) => files[id]);

  // State for dataset selection
  const [fileAId, setFileAId] = useState(fileList[0]?.id || '');
  const [sheetA, setSheetA] = useState(fileList[0]?.sheetNames[0] || '');
  
  // Default Dataset B to second sheet or second file
  const initialFileBId = fileList.length > 1 ? fileList[1]?.id : fileList[0]?.id || '';
  const initialSheetB = fileList.length > 1 
    ? fileList[1]?.sheetNames[0] 
    : fileList[0]?.sheetNames[1] || fileList[0]?.sheetNames[0] || '';

  const [fileBId, setFileBId] = useState(initialFileBId);
  const [sheetB, setSheetB] = useState(initialSheetB);

  const [customQuestion, setCustomQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState('');

  // Update sheet selection when file changes
  const handleFileAChange = (newId) => {
    setFileAId(newId);
    if (files[newId]) {
      setSheetA(files[newId].sheetNames[0]);
    }
  };

  const handleFileBChange = (newId) => {
    setFileBId(newId);
    if (files[newId]) {
      setSheetB(files[newId].sheetNames[0]);
    }
  };

  if (!hasFiles) {
    return (
      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${chatOpen ? 'chat-open' : ''} ${styles.container}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <GitCompare className={styles.titleIcon} /> Compare Datasets
          </h1>
          <p className={styles.subtitle}>Bandingkan data antar file Excel atau antar sheet</p>
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

  const selectedFileA = files[fileAId] || fileList[0];
  const selectedSheetAData = selectedFileA?.sheets[sheetA || selectedFileA?.sheetNames[0]];

  const selectedFileB = files[fileBId] || fileList[0];
  const selectedSheetBData = selectedFileB?.sheets[sheetB || selectedFileB?.sheetNames[0]];

  // Find common numeric metrics
  const headersA = selectedSheetAData?.headers || [];
  const headersB = selectedSheetBData?.headers || [];

  const numericColsA = headersA.filter(
    (h) => selectedSheetAData?.columnTypes[h] === 'number' || selectedSheetAData?.columnTypes[h] === 'percentage'
  );
  const numericColsB = headersB.filter(
    (h) => selectedSheetBData?.columnTypes[h] === 'number' || selectedSheetBData?.columnTypes[h] === 'percentage'
  );

  const commonNumericCols = numericColsA.filter((h) => numericColsB.includes(h));

  // Build comparison summary metrics
  const comparisonStats = commonNumericCols.map((metric) => {
    const sumA = selectedSheetAData?.summary[metric]?.sum || 0;
    const sumB = selectedSheetBData?.summary[metric]?.sum || 0;
    const avgA = selectedSheetAData?.summary[metric]?.avg || 0;
    const avgB = selectedSheetBData?.summary[metric]?.avg || 0;

    const sumDiff = sumB - sumA;
    const sumPctChange = sumA !== 0 ? ((sumB - sumA) / Math.abs(sumA)) * 100 : 0;

    return {
      metric,
      sumA,
      sumB,
      avgA,
      avgB,
      sumDiff,
      sumPctChange,
    };
  });

  // Build chart comparison data
  const chartData = comparisonStats.map((item) => ({
    name: item.metric,
    'Dataset A': Number(item.sumA.toFixed(2)),
    'Dataset B': Number(item.sumB.toFixed(2)),
  }));

  // Handle AI Comparison analysis call
  const handleCompareAI = async () => {
    if (!selectedFileA || !selectedFileB) return;
    
    setLoadingAI(true);
    setAiError('');

    try {
      const contextA = createDataContext(selectedFileA, sheetA || selectedFileA.sheetNames[0]);
      const contextB = createDataContext(selectedFileB, sheetB || selectedFileB.sheetNames[0]);

      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetA: contextA,
          datasetB: contextB,
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
            Bandingkan metrik & performa secara langsung antar file Excel atau antar sheet
          </p>
        </div>
      </div>

      {/* Dataset Selectors Grid */}
      <div className={styles.selectorGrid}>
        {/* Selector A */}
        <div className={`${styles.selectorCard} ${styles.cardA}`}>
          <div className={styles.cardBadge}>Dataset A</div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Pilih File:</label>
            <select
              value={fileAId}
              onChange={(e) => handleFileAChange(e.target.value)}
              className={styles.select}
            >
              {fileList.map((f) => (
                <option key={f.id} value={f.id}>
                  📄 {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Pilih Sheet:</label>
            <select
              value={sheetA}
              onChange={(e) => setSheetA(e.target.value)}
              className={styles.select}
            >
              {selectedFileA?.sheetNames.map((s) => (
                <option key={s} value={s}>
                  📊 {s}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.datasetInfo}>
            <span>Baris: <strong>{selectedSheetAData?.rowCount || 0}</strong></span>
            <span>Kolom: <strong>{selectedSheetAData?.colCount || 0}</strong></span>
          </div>
        </div>

        {/* VS Badge */}
        <div className={styles.vsBadge}>VS</div>

        {/* Selector B */}
        <div className={`${styles.selectorCard} ${styles.cardB}`}>
          <div className={styles.cardBadgeB}>Dataset B</div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Pilih File:</label>
            <select
              value={fileBId}
              onChange={(e) => handleFileBChange(e.target.value)}
              className={styles.select}
            >
              {fileList.map((f) => (
                <option key={f.id} value={f.id}>
                  📄 {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Pilih Sheet:</label>
            <select
              value={sheetB}
              onChange={(e) => setSheetB(e.target.value)}
              className={styles.select}
            >
              {selectedFileB?.sheetNames.map((s) => (
                <option key={s} value={s}>
                  📊 {s}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.datasetInfo}>
            <span>Baris: <strong>{selectedSheetBData?.rowCount || 0}</strong></span>
            <span>Kolom: <strong>{selectedSheetBData?.colCount || 0}</strong></span>
          </div>
        </div>
      </div>

      {/* Comparison Metrics Grid */}
      {comparisonStats.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <BarChart2 className={styles.secIcon} /> Comparison Breakdown
          </h2>
          <div className={styles.statsGrid}>
            {comparisonStats.map((item) => (
              <div key={item.metric} className={styles.statCard}>
                <div className={styles.statHeader}>{item.metric}</div>
                <div className={styles.statComparison}>
                  <div className={styles.statValBox}>
                    <span className={styles.valLabel}>Dataset A</span>
                    <span className={styles.valNumber}>{formatNumber(item.sumA)}</span>
                  </div>
                  <ArrowRight className={styles.arrowIcon} />
                  <div className={styles.statValBox}>
                    <span className={styles.valLabel}>Dataset B</span>
                    <span className={styles.valNumber}>{formatNumber(item.sumB)}</span>
                  </div>
                </div>
                <div className={styles.diffBar}>
                  <span
                    className={`${styles.badge} ${
                      item.sumPctChange >= 0 ? styles.positiveBadge : styles.negativeBadge
                    }`}
                  >
                    {item.sumPctChange >= 0 ? '+' : ''}
                    {item.sumPctChange.toFixed(1)}%
                  </span>
                  <span className={styles.diffText}>
                    Selisih: {item.sumDiff >= 0 ? '+' : ''}
                    {formatNumber(item.sumDiff)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Visual Chart Comparison */}
      {chartData.length > 0 && (
        <section className={styles.section}>
          <div className={styles.chartBox}>
            <h3 className={styles.chartTitle}>Visual Comparison (Total Values)</h3>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                  <XAxis dataKey="name" stroke="#000" style={{ fontWeight: 'bold' }} />
                  <YAxis stroke="#000" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFDF7',
                      border: '3px solid #000',
                      boxShadow: '4px 4px 0px #000',
                      borderRadius: '0px',
                      fontWeight: 'bold',
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="Dataset A" fill="#4361EE" stroke="#000" strokeWidth={2} />
                  <Bar dataKey="Dataset B" fill="#FF006E" stroke="#000" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* AI Comparison Query & Result Section */}
      <section className={styles.section}>
        <div className={styles.aiBox}>
          <div className={styles.aiHeader}>
            <Sparkles className={styles.aiIcon} />
            <div>
              <h3>AI Comparison Analyst</h3>
              <p>Minta AI menganalisis perbedaan mendalam, tren, dan rekomendasi dari perbandingan ini.</p>
            </div>
          </div>

          <div className={styles.promptInputGroup}>
            <input
              type="text"
              placeholder="Contoh: Mana dataset yang memiliki engagement rate lebih baik dan kenapa?"
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
