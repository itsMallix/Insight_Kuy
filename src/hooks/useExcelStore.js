'use client';

import { createContext, useContext, useReducer, useCallback } from 'react';

const ExcelContext = createContext(null);

const initialState = {
  files: {},
  fileOrder: [],
  activeFileId: null,
  activeSheet: null,
  chatHistory: [],
  chatOpen: false,
  sidebarCollapsed: false,
  recommendations: null,
  recommendationsLoading: false,
  compareConfig: {
    fileA: null,
    sheetA: null,
    fileB: null,
    sheetB: null,
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_FILE': {
      const file = action.payload;
      const newFiles = { ...state.files, [file.id]: file };
      const newOrder = [...state.fileOrder, file.id];
      return {
        ...state,
        files: newFiles,
        fileOrder: newOrder,
        activeFileId: state.activeFileId || file.id,
        activeSheet: state.activeSheet || file.sheetNames[0],
      };
    }
    case 'REMOVE_FILE': {
      const fileId = action.payload;
      const newFiles = { ...state.files };
      delete newFiles[fileId];
      const newOrder = state.fileOrder.filter((id) => id !== fileId);
      let newActiveFile = state.activeFileId;
      let newActiveSheet = state.activeSheet;
      if (state.activeFileId === fileId) {
        newActiveFile = newOrder[0] || null;
        newActiveSheet = newActiveFile ? newFiles[newActiveFile]?.sheetNames[0] : null;
      }
      return {
        ...state,
        files: newFiles,
        fileOrder: newOrder,
        activeFileId: newActiveFile,
        activeSheet: newActiveSheet,
      };
    }
    case 'SET_ACTIVE_FILE':
      return {
        ...state,
        activeFileId: action.payload.fileId,
        activeSheet: action.payload.sheet || state.files[action.payload.fileId]?.sheetNames[0],
      };
    case 'SET_ACTIVE_SHEET':
      return { ...state, activeSheet: action.payload };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatHistory: [...state.chatHistory, action.payload] };
    case 'UPDATE_LAST_CHAT_MESSAGE':
      return {
        ...state,
        chatHistory: state.chatHistory.map((msg, i) =>
          i === state.chatHistory.length - 1 ? { ...msg, ...action.payload } : msg
        ),
      };
    case 'CLEAR_CHAT':
      return { ...state, chatHistory: [] };
    case 'TOGGLE_CHAT':
      return { ...state, chatOpen: !state.chatOpen };
    case 'SET_CHAT_OPEN':
      return { ...state, chatOpen: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'SET_RECOMMENDATIONS':
      return { ...state, recommendations: action.payload, recommendationsLoading: false };
    case 'SET_RECOMMENDATIONS_LOADING':
      return { ...state, recommendationsLoading: action.payload };
    case 'SET_COMPARE_CONFIG':
      return { ...state, compareConfig: { ...state.compareConfig, ...action.payload } };
    default:
      return state;
  }
}

export function ExcelProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addFile = useCallback((fileData) => {
    dispatch({ type: 'ADD_FILE', payload: fileData });
  }, []);

  const removeFile = useCallback((fileId) => {
    dispatch({ type: 'REMOVE_FILE', payload: fileId });
  }, []);

  const setActiveFile = useCallback((fileId, sheet) => {
    dispatch({ type: 'SET_ACTIVE_FILE', payload: { fileId, sheet } });
  }, []);

  const setActiveSheet = useCallback((sheet) => {
    dispatch({ type: 'SET_ACTIVE_SHEET', payload: sheet });
  }, []);

  const addChatMessage = useCallback((message) => {
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: message });
  }, []);

  const updateLastChatMessage = useCallback((update) => {
    dispatch({ type: 'UPDATE_LAST_CHAT_MESSAGE', payload: update });
  }, []);

  const clearChat = useCallback(() => {
    dispatch({ type: 'CLEAR_CHAT' });
  }, []);

  const toggleChat = useCallback(() => {
    dispatch({ type: 'TOGGLE_CHAT' });
  }, []);

  const setChatOpen = useCallback((open) => {
    dispatch({ type: 'SET_CHAT_OPEN', payload: open });
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const setRecommendations = useCallback((recs) => {
    dispatch({ type: 'SET_RECOMMENDATIONS', payload: recs });
  }, []);

  const setRecommendationsLoading = useCallback((loading) => {
    dispatch({ type: 'SET_RECOMMENDATIONS_LOADING', payload: loading });
  }, []);

  const setCompareConfig = useCallback((config) => {
    dispatch({ type: 'SET_COMPARE_CONFIG', payload: config });
  }, []);

  // Computed values
  const activeFile = state.activeFileId ? state.files[state.activeFileId] : null;
  const activeSheetData = activeFile?.sheets?.[state.activeSheet] || null;
  const hasFiles = state.fileOrder.length > 0;

  const value = {
    ...state,
    activeFile,
    activeSheetData,
    hasFiles,
    addFile,
    removeFile,
    setActiveFile,
    setActiveSheet,
    addChatMessage,
    updateLastChatMessage,
    clearChat,
    toggleChat,
    setChatOpen,
    toggleSidebar,
    setRecommendations,
    setRecommendationsLoading,
    setCompareConfig,
  };

  return <ExcelContext.Provider value={value}>{children}</ExcelContext.Provider>;
}

export function useExcelStore() {
  const context = useContext(ExcelContext);
  if (!context) {
    throw new Error('useExcelStore must be used within an ExcelProvider');
  }
  return context;
}
