import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-slate-900 border border-amber-700/50 rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl">
        <h3 className="text-amber-300 text-lg font-bold mb-3">{title}</h3>
        <p className="text-amber-100/80 text-sm mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-amber-700 text-amber-100 hover:bg-amber-600 text-sm font-bold"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};
