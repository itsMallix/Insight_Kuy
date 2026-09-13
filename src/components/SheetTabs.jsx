'use client';

import { useExcelStore } from '@/hooks/useExcelStore';
import styles from './SheetTabs.module.css';

export default function SheetTabs() {
  const { activeFile, activeSheet, setActiveSheet } = useExcelStore();

  if (!activeFile) return null;

  return (
    <div className={styles.tabBar} id="sheet-tabs">
      {activeFile.sheetNames.map((name) => {
        const sheet = activeFile.sheets[name];
        const isActive = activeSheet === name;
        return (
          <button
            key={name}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            onClick={() => setActiveSheet(name)}
            id={`sheet-tab-${name.replace(/\s+/g, '-')}`}
          >
            <span className={styles.tabName}>{name}</span>
            <span className={styles.tabBadge}>{sheet?.rowCount || 0}</span>
          </button>
        );
      })}
    </div>
  );
}
