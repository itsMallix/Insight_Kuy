'use client';

import { useCallback, useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { parseExcelFile } from '@/utils/excelParser';
import { useExcelStore } from '@/hooks/useExcelStore';
import styles from './FileUploader.module.css';

export default function FileUploader() {
  const { addFile, files, fileOrder } = useExcelStore();
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = useCallback(
    async (fileList) => {
      setParsing(true);
      for (const file of fileList) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext)) continue;

        try {
          const buffer = await file.arrayBuffer();
          const parsed = parseExcelFile(buffer, file.name);
          addFile(parsed);
        } catch (err) {
          console.error('Error parsing file:', err);
        }
      }
      setParsing(false);
    },
    [addFile]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = '';
  };

  const hasFiles = fileOrder.length > 0;

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${hasFiles ? styles.compact : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        id="file-upload-dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          multiple
          onChange={handleInputChange}
          className={styles.hiddenInput}
          id="file-upload-input"
        />

        {parsing ? (
          <div className={styles.parsingState}>
            <div className={styles.spinner} />
            <p className={styles.parsingText}>Parsing file...</p>
          </div>
        ) : (
          <div className={styles.uploadContent}>
            <div className={styles.iconWrapper}>
              <Upload size={hasFiles ? 20 : 32} strokeWidth={3} />
            </div>
            {!hasFiles ? (
              <>
                <h3 className={styles.title}>Drop Excel files here</h3>
                <p className={styles.subtitle}>or click to browse — supports .xlsx, .xls, .csv</p>
              </>
            ) : (
              <span className={styles.compactText}>Drop more files or click to add</span>
            )}
          </div>
        )}
      </div>

      {hasFiles && (
        <div className={styles.fileList}>
          {fileOrder.map((fileId) => {
            const file = files[fileId];
            return (
              <FileCard key={fileId} file={file} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function FileCard({ file }) {
  const { removeFile, setActiveFile, activeFileId } = useExcelStore();
  const isActive = activeFileId === file.id;

  return (
    <div
      className={`${styles.fileCard} ${isActive ? styles.fileCardActive : ''}`}
      onClick={() => setActiveFile(file.id)}
      id={`file-card-${file.id}`}
    >
      <div className={styles.fileIcon}>
        <FileSpreadsheet size={20} strokeWidth={2.5} />
      </div>
      <div className={styles.fileInfo}>
        <span className={styles.fileName}>{file.name}</span>
        <span className={styles.fileMeta}>
          {file.sheetNames.length} sheets · {Object.values(file.sheets).reduce((t, s) => t + s.rowCount, 0)} rows
        </span>
      </div>
      {isActive && (
        <CheckCircle size={16} className={styles.activeIcon} />
      )}
      <button
        className={styles.removeBtn}
        onClick={(e) => {
          e.stopPropagation();
          removeFile(file.id);
        }}
        id={`remove-file-${file.id}`}
        title="Remove file"
      >
        <X size={14} strokeWidth={3} />
      </button>
    </div>
  );
}
