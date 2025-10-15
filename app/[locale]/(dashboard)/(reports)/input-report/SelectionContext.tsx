import React, { createContext, useContext, useState, useCallback } from "react";

const SelectionContext = createContext({
  selectedRowIds: [],
  setSelectedRowIds: (_ids: any) => {},
});

export const SelectionProvider = ({ children }) => {
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const handleSelect = useCallback((ids) => {
    setSelectedRowIds(ids);
  }, []);

  return (
    <SelectionContext.Provider value={{ selectedRowIds, setSelectedRowIds: handleSelect }}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = () => useContext(SelectionContext);
