'use client';

import { useMemo } from 'react';
import { useExcelStore } from '@/hooks/useExcelStore';
import FileUploader from '@/components/FileUploader';
import SheetTabs from '@/components/SheetTabs';
import DataTable from '@/components/DataTable';
import ChartPanel from '@/components/ChartPanel';
import StatsCard, { generateStatsFromSheet } from '@/components/StatsCard';
import styles from './DashboardContent.module.css';

export default function DashboardContent() {
  const { hasFiles, activeSheetData, sidebarCollapsed, chatOpen, activeFile, activeSheet } = useExcelStore();

  const stats = useMemo(() => {
    if (!activeSheetData) return [];
    return generateStatsFromSheet(activeSheetData, activeSheet);
  }, [activeSheetData, activeSheet]);

  return (
    <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${chatOpen ? 'chat-open' : ''}`}>
      {/* Page Header */}
      <div className="page-header">
        <h1>📊 Dashboard</h1>
        <p>Upload file Excel Google Analytics untuk mulai analisis</p>
      </div>

      {/* File Upload */}
      <FileUploader />

      {hasFiles && activeFile && (
        <>
          {/* Active File Info */}
          <div className={styles.activeFileBar}>
            <span className={styles.activeLabel}>📂 Active:</span>
            <span className={styles.activeFileName}>{activeFile.name}</span>
            <span className={styles.activeMeta}>
              {activeFile.sheetNames.length} sheets · {Object.values(activeFile.sheets).reduce((t, s) => t + s.rowCount, 0)} total rows
            </span>
          </div>

          {/* Sheet Tabs */}
          <SheetTabs />

          {/* Stats Cards */}
          {stats.length > 0 && (
            <div className="stats-grid">
              {stats.map((stat, i) => (
                <StatsCard key={`${activeSheet}-${i}`} {...stat} colorIndex={i} />
              ))}
            </div>
          )}

          {/* Content Grid: Table + Chart */}
          <div className="content-grid">
            <DataTable />
            <ChartPanel />
          </div>
        </>
      )}

      {/* Empty State */}
      {!hasFiles && (
        <div className={styles.emptyState}>
          <div className={styles.emptyCard}>
            <span className={styles.emptyEmoji}>📁</span>
            <h3>Belum ada file</h3>
            <p>Upload file Excel (.xlsx) dari Google Analytics untuk mulai menganalisis data kamu.</p>
            <div className={styles.emptyFeatures}>
              <div className={styles.featureItem}>
                <span className={styles.featureBadge}>📊</span>
                <span>Auto Charts</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureBadge}>🤖</span>
                <span>AI Chat</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureBadge}>🔄</span>
                <span>Compare</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureBadge}>💡</span>
                <span>Recommendations</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
