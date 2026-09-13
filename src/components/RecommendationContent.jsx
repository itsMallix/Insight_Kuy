'use client';

import { useState } from 'react';
import { Lightbulb, Zap, Download, Loader2, Target, FileText, Wrench, TrendingUp, MapPin, AlertTriangle } from 'lucide-react';
import { useExcelStore } from '@/hooks/useExcelStore';
import { createFullDataContext } from '@/utils/excelParser';
import FileUploader from '@/components/FileUploader';
import styles from './RecommendationContent.module.css';

const CATEGORY_CONFIG = {
  audience: { icon: <Target size={20} strokeWidth={2.5} />, label: 'Audience Targeting', color: 'blue', emoji: '🎯' },
  content: { icon: <FileText size={20} strokeWidth={2.5} />, label: 'Content Optimization', color: 'pink', emoji: '📄' },
  technical: { icon: <Wrench size={20} strokeWidth={2.5} />, label: 'Technical', color: 'purple', emoji: '🔧' },
  growth: { icon: <TrendingUp size={20} strokeWidth={2.5} />, label: 'Growth Opportunities', color: 'green', emoji: '📈' },
  regional: { icon: <MapPin size={20} strokeWidth={2.5} />, label: 'Regional Strategy', color: 'orange', emoji: '📍' },
  attention: { icon: <AlertTriangle size={20} strokeWidth={2.5} />, label: 'Attention Needed', color: 'yellow', emoji: '⚠️' },
};

const PRIORITY_CONFIG = {
  high: { label: 'HIGH', className: 'priorityHigh' },
  medium: { label: 'MEDIUM', className: 'priorityMedium' },
  low: { label: 'LOW', className: 'priorityLow' },
};

export default function RecommendationContent() {
  const { hasFiles, activeFile, recommendations, setRecommendations, recommendationsLoading, setRecommendationsLoading, sidebarCollapsed, chatOpen } = useExcelStore();
  const [error, setError] = useState(null);

  const generateRecommendations = async () => {
    if (!activeFile) return;

    setRecommendationsLoading(true);
    setError(null);

    try {
      const dataContext = createFullDataContext(activeFile);
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allSheetsData: dataContext }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setRecommendationsLoading(false);
        return;
      }

      setRecommendations(data.recommendations);
    } catch (err) {
      setError('Gagal generate rekomendasi. Pastikan API key sudah diset.');
      setRecommendationsLoading(false);
    }
  };

  const exportRecommendations = () => {
    if (!recommendations) return;

    let markdown = `# InsightKuy - AI Recommendations\n\n`;
    markdown += `**File:** ${activeFile?.name}\n`;
    markdown += `**Generated:** ${new Date().toLocaleString('id-ID')}\n\n---\n\n`;

    const grouped = {};
    recommendations.forEach((rec) => {
      const priority = rec.priority || 'medium';
      if (!grouped[priority]) grouped[priority] = [];
      grouped[priority].push(rec);
    });

    ['high', 'medium', 'low'].forEach((priority) => {
      if (!grouped[priority]) return;
      markdown += `## 🔴 ${priority.toUpperCase()} PRIORITY\n\n`;
      grouped[priority].forEach((rec) => {
        const cat = CATEGORY_CONFIG[rec.category] || CATEGORY_CONFIG.growth;
        markdown += `### ${cat.emoji} ${rec.title}\n\n`;
        markdown += `**Category:** ${cat.label}\n\n`;
        markdown += `**Insight:** ${rec.insight}\n\n`;
        markdown += `**Recommendation:** ${rec.recommendation}\n\n`;
        markdown += `**Expected Impact:** ${rec.expectedImpact}\n\n`;
        markdown += `**Action Steps:**\n`;
        rec.actionSteps?.forEach((step, i) => {
          markdown += `${i + 1}. ${step}\n`;
        });
        markdown += '\n---\n\n';
      });
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insightkuy-recommendations-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group recommendations by priority
  const grouped = {};
  if (recommendations) {
    recommendations.forEach((rec) => {
      const priority = rec.priority || 'medium';
      if (!grouped[priority]) grouped[priority] = [];
      grouped[priority].push(rec);
    });
  }

  return (
    <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${chatOpen ? 'chat-open' : ''}`}>
      <div className="page-header">
        <h1>💡 AI Recommendations</h1>
        <p>Dapatkan saran actionable untuk meningkatkan performa platform kamu</p>
      </div>

      {!hasFiles && <FileUploader />}

      {hasFiles && (
        <>
          {/* Action Bar */}
          <div className={styles.actionBar}>
            <div className={styles.actionInfo}>
              <span>📂 {activeFile?.name}</span>
              <span className={styles.dot}>·</span>
              <span>{activeFile?.sheetNames.length} sheets analyzed</span>
            </div>
            <div className={styles.actionButtons}>
              <button
                className="neo-btn neo-btn-primary neo-btn-lg"
                onClick={generateRecommendations}
                disabled={recommendationsLoading}
                id="generate-recommendations"
              >
                {recommendationsLoading ? (
                  <>
                    <Loader2 size={18} className={styles.spinning} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap size={18} strokeWidth={2.5} />
                    Generate Recommendations
                  </>
                )}
              </button>
              {recommendations && (
                <button className="neo-btn neo-btn-green" onClick={exportRecommendations} id="export-recommendations">
                  <Download size={16} strokeWidth={2.5} />
                  Export
                </button>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className={styles.errorCard}>
              <p>❌ {error}</p>
            </div>
          )}

          {/* Recommendations */}
          {recommendations && (
            <div className={styles.recoList}>
              {['high', 'medium', 'low'].map((priority) => {
                if (!grouped[priority]) return null;
                const pConfig = PRIORITY_CONFIG[priority];
                return (
                  <div key={priority} className={styles.priorityGroup}>
                    <h2 className={`${styles.priorityTitle} ${styles[pConfig.className]}`}>
                      {priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢'} {pConfig.label} PRIORITY
                    </h2>
                    <div className={styles.recoCards}>
                      {grouped[priority].map((rec, i) => (
                        <RecommendationCard key={i} rec={rec} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!recommendations && !recommendationsLoading && (
            <div className={styles.emptyState}>
              <div className={styles.emptyCard}>
                <Lightbulb size={48} strokeWidth={2} />
                <h3>Belum ada rekomendasi</h3>
                <p>Klik tombol &quot;Generate Recommendations&quot; untuk mendapatkan saran AI berdasarkan data Google Analytics kamu.</p>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function RecommendationCard({ rec }) {
  const [expanded, setExpanded] = useState(false);
  const catConfig = CATEGORY_CONFIG[rec.category] || CATEGORY_CONFIG.growth;

  return (
    <div className={`${styles.recoCard} ${styles[`card_${catConfig.color}`]}`} onClick={() => setExpanded(!expanded)}>
      <div className={styles.recoHeader}>
        <div className={styles.recoCategoryBadge}>
          {catConfig.emoji} {catConfig.label}
        </div>
        <span className={`${styles.recoPriority} ${styles[`priority_${rec.priority}`]}`}>
          {rec.priority?.toUpperCase()}
        </span>
      </div>
      <h3 className={styles.recoTitle}>{rec.title}</h3>
      <p className={styles.recoInsight}><strong>💡 Insight:</strong> {rec.insight}</p>
      <p className={styles.recoAction}><strong>🎯 Rekomendasi:</strong> {rec.recommendation}</p>

      {rec.expectedImpact && (
        <div className={styles.impactBadge}>
          <Zap size={14} /> Expected Impact: {rec.expectedImpact}
        </div>
      )}

      {expanded && rec.actionSteps && (
        <div className={styles.actionSteps}>
          <h4>📋 Action Steps:</h4>
          <ol>
            {rec.actionSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      <button className={styles.expandBtn}>
        {expanded ? 'Tutup ▲' : 'Lihat Action Steps ▼'}
      </button>
    </div>
  );
}
