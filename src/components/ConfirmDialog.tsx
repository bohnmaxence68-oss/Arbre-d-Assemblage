import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger',
}) => {
  if (!isOpen) return null;

  const colors = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-orange-500 hover:bg-orange-600 text-white',
    info: 'bg-slate-900 hover:bg-slate-800 text-white',
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
        >
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-full ${variant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {message}
            </p>
          </div>
          <div className="bg-slate-50 p-4 flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-6 py-2 rounded text-sm font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 ${colors[variant]}`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
