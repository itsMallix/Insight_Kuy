'use client';

import { useState, useMemo } from 'react';
import { useExcelStore } from '@/hooks/useExcelStore';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './DataTable.module.css';

const ROWS_PER_PAGE = 15;

export default function DataTable() {
  const { activeSheetData, activeSheet } = useExcelStore();
  const [sortConfig, setSortConfig] = useState({ key: null, dir: 'asc' });
  const [page, setPage] = useState(0);

  const sortedRows = useMemo(() => {
    if (!activeSheetData?.rows) return [];
    let rows = [...activeSheetData.rows];

    if (sortConfig.key) {
      rows.sort((a, b) => {
        const va = a[sortConfig.key];
        const vb = b[sortConfig.key];
        const na = Number(va);
        const nb = Number(vb);

        if (!isNaN(na) && !isNaN(nb)) {
          return sortConfig.dir === 'asc' ? na - nb : nb - na;
        }
        const sa = String(va).toLowerCase();
        const sb = String(vb).toLowerCase();
        if (sa < sb) return sortConfig.dir === 'asc' ? -1 : 1;
        if (sa > sb) return sortConfig.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [activeSheetData, sortConfig]);

  // Reset page when sheet changes
  useMemo(() => setPage(0), [activeSheet]);

  if (!activeSheetData) {
    return (
      <div className={`neo-card-static ${styles.empty}`}>
        <p>Upload a file to see data here</p>
      </div>
    );
  }

  const { headers } = activeSheetData;
  const totalPages = Math.ceil(sortedRows.length / ROWS_PER_PAGE);
  const visibleRows = sortedRows.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const formatCell = (value, header) => {
    if (value === '' || value === null || value === undefined) return '—';
    const type = activeSheetData.columnTypes?.[header];
    if (type === 'percentage') return (Number(value) * 100).toFixed(1) + '%';
    if (type === 'number') {
      const n = Number(value);
      if (Number.isInteger(n)) return n.toLocaleString();
      return n.toFixed(2);
    }
    return String(value);
  };

  return (
    <div className={`neo-card-static ${styles.tableCard}`} id="data-table">
      <div className={styles.tableHeader}>
        <h3 className={styles.tableTitle}>📋 Data Table</h3>
        <span className={styles.rowCount}>{sortedRows.length} rows</span>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  onClick={() => handleSort(h)}
                  className={`${styles.th} ${sortConfig.key === h ? styles.thSorted : ''}`}
                >
                  <span>{h}</span>
                  <ArrowUpDown size={12} strokeWidth={2.5} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => (
              <tr key={i} className={styles.tr}>
                {headers.map((h) => (
                  <td key={h} className={styles.td}>
                    {formatCell(row[h], h)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={`neo-btn neo-btn-sm ${styles.pageBtn}`}
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className={styles.pageInfo}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            className={`neo-btn neo-btn-sm ${styles.pageBtn}`}
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
