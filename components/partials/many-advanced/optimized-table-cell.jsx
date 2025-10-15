import React from 'react';
import { TableCell } from "@/components/ui/table";
import { flexRender } from "@tanstack/react-table";

const OptimizedTableCell = React.memo(({ 
  cell, 
  styleCell, 
  columnId 
}) => {
  const cellContext = cell.getContext();
  
  return (
    <TableCell className={styleCell}>
      {cellContext.getValue() != null &&
        flexRender(
          cell.column.columnDef.cell,
          cellContext
        )}
      {(columnId === "select" ||
        columnId === "actions" ||
        columnId === "options") &&
        flexRender(
          cell.column.columnDef.cell,
          cellContext
        )}
    </TableCell>
  );
});

OptimizedTableCell.displayName = 'OptimizedTableCell';

export default OptimizedTableCell; 