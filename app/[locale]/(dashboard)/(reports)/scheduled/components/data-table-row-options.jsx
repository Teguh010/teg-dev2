"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Icon } from '@iconify/react';

const DataTableRowOptions = ({ row, onEdit, onDelete }) => {
  return (
    <div className="flex gap-1">
      <Button variant='ghost' className='h-8 w-8 p-0' onClick={() => onEdit(row.original)}>
        <Icon icon='mdi:pencil' className='text-sm' />
      </Button>
      <Button variant='ghost' className='h-8 w-8 p-0' onClick={() => onDelete(row.original.id)}>
        <Icon icon='mdi:delete' className='text-sm text-red-500' />
      </Button>
    </div>
  )
};

export default React.memo(DataTableRowOptions); 