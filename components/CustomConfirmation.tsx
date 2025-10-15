"use client";
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface ConfirmationProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CustomConfirmation = ({ message, onConfirm, onCancel }: ConfirmationProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
      <p className="mb-4 text-gray-700">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600"
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

export const showConfirmation = (message: string, onConfirm: () => void) => {
  toast.custom((t) => (
    <CustomConfirmation
      message={message}
      onConfirm={() => {
        onConfirm();
        toast.dismiss(t.id);
      }}
      onCancel={() => toast.dismiss(t.id)}
    />
  ), {
    duration: Infinity, // Toast tidak akan hilang sendiri
  });
};