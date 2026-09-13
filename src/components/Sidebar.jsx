'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart3, GitCompare, Lightbulb, FileSpreadsheet, 
  PanelLeftClose, PanelLeftOpen, Sparkles, Menu, X, MessageSquare 
} from 'lucide-react';
import { useExcelStore } from '@/hooks/useExcelStore';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { href: '/', icon: <BarChart3 size={20} strokeWidth={2.5} />, label: 'Dashboard' },
  { href: '/compare', icon: <GitCompare size={20} strokeWidth={2.5} />, label: 'Compare' },
  { href: '/recommendations', icon: <Lightbulb size={20} strokeWidth={2.5} />, label: 'Recommendations' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { files, fileOrder, activeFileId, setActiveFile, sidebarCollapsed, toggleSidebar, toggleChat } = useExcelStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Top Navigation Header */}
      <header className={styles.mobileHeader}>
        <div className={styles.mobileHeaderLeft}>
          <button 
            className={styles.mobileMenuBtn} 
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className={styles.mobileLogo}>
            <span className={styles.logoIconSm}>
              <Sparkles size={18} strokeWidth={2.5} />
            </span>
            <span className={styles.logoTextSm}>InsightKuy</span>
          </div>
        </div>

        <button className={styles.mobileChatBtn} onClick={toggleChat} aria-label="Toggle AI Chat">
          <MessageSquare size={20} />
          <span>AI Chat</span>
        </button>
      </header>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div className={styles.backdrop} onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar Drawer */}
      <aside 
        className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`} 
        id="sidebar"
      >
        {/* Sidebar Header / Logo */}
        <div className={styles.logo}>
          {!sidebarCollapsed ? (
            <div className={styles.logoContent}>
              <span className={styles.logoIcon}>
                <Sparkles size={22} strokeWidth={2.5} />
              </span>
              <span className={styles.logoText}>InsightKuy</span>
            </div>
          ) : (
            <span className={styles.logoIconCollapsed}>
              <Sparkles size={20} strokeWidth={2.5} />
            </span>
          )}

          <button 
            className={styles.collapseBtn} 
            onClick={toggleSidebar} 
            id="sidebar-toggle"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                id={`nav-${item.label.toLowerCase()}`}
                title={sidebarCollapsed ? item.label : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {!sidebarCollapsed && <span className={styles.navLabel}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* AI Chat Button */}
        <div className={styles.chatSection}>
          <button 
            className={styles.chatToggleBtn} 
            onClick={() => {
              toggleChat();
              setMobileOpen(false);
            }} 
            id="ai-chat-toggle"
            title={sidebarCollapsed ? "AI Chat Assistant" : undefined}
          >
            <span className={styles.chatIcon}>🤖</span>
            {!sidebarCollapsed && <span className={styles.navLabel}>AI Chat Assistant</span>}
          </button>
        </div>

        {/* Files Section */}
        {!sidebarCollapsed && fileOrder.length > 0 && (
          <div className={styles.fileSection}>
            <h4 className={styles.fileSectionTitle}>
              <FileSpreadsheet size={15} strokeWidth={2.5} />
              Terunggah ({fileOrder.length})
            </h4>
            <div className={styles.fileList}>
              {fileOrder.map((fileId) => {
                const file = files[fileId];
                const isActive = activeFileId === fileId;
                return (
                  <button
                    key={fileId}
                    className={`${styles.fileItem} ${isActive ? styles.fileItemActive : ''}`}
                    onClick={() => {
                      setActiveFile(fileId);
                      setMobileOpen(false);
                    }}
                    title={file.name}
                  >
                    <span className={styles.fileDot} />
                    <span className={styles.fileName}>{file.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
