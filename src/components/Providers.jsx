'use client';

import { ExcelProvider } from '@/hooks/useExcelStore';
import Sidebar from '@/components/Sidebar';
import AIChatPanel from '@/components/AIChatPanel';

export default function Providers({ children }) {
  return (
    <ExcelProvider>
      <div className="app-layout">
        <Sidebar />
        {children}
        <AIChatPanel />
      </div>
    </ExcelProvider>
  );
}
