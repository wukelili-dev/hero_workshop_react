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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3f3527]/45">
      <div className="ink-panel ink-frame mx-4 w-full max-w-sm p-5">
        <h3 className="ink-title mb-3 text-lg">{title}</h3>
        <p className="mb-5 text-sm leading-relaxed text-[#6b6252]">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="ink-btn text-sm">
            取消
          </button>
          <button onClick={onConfirm} className="ink-btn-seal text-sm">
            确认
          </button>
        </div>
      </div>
    </div>
  );
};
