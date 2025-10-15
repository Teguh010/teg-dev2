import { useCallback, useMemo } from 'react';

export const useTablePerformance = (dataList, styleRowList, styleColumnList) => {
  // Memoize style calculations
  const styleCache = useMemo(() => {
    const cache = new Map();
    
    // Pre-calculate row styles
    const rowStyleCache = new Map();
    dataList.forEach((item, index) => {
      const matchedItem = styleRowList.find((styleItem) => {
        return Object.keys(item).some((key) => key === styleItem.title);
      });
      
      if (matchedItem) {
        const value = item[matchedItem.title];
        rowStyleCache.set(index, matchedItem.value(value));
      }
    });
    
    // Pre-calculate column styles
    const columnStyleCache = new Map();
    styleColumnList.forEach((styleItem) => {
      columnStyleCache.set(styleItem.title, styleItem.value);
    });
    
    cache.set('row', rowStyleCache);
    cache.set('column', columnStyleCache);
    
    return cache;
  }, [dataList, styleRowList, styleColumnList]);

  // Optimized style getter
  const getRowStyle = useCallback((rowIndex) => {
    return styleCache.get('row').get(rowIndex) || '';
  }, [styleCache]);

  const getColumnStyle = useCallback((columnId, value, rowData) => {
    const styleFunction = styleCache.get('column').get(columnId);
    if (styleFunction) {
      // Check if the function accepts rowData parameter
      if (styleFunction.length > 1) {
        return styleFunction(value, rowData);
      }
      return styleFunction(value);
    }
    return '';
  }, [styleCache]);

  // Debounced row selection handler
  const debouncedRowSelection = useCallback((callback, delay = 100) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback(...args), delay);
    };
  }, []);

  return {
    getRowStyle,
    getColumnStyle,
    debouncedRowSelection,
    styleCache
  };
}; 