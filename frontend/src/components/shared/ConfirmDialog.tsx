import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] rounded-[4px] shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="flex justify-between items-start p-5 border-b border-[#E0E0E0] dark:border-[#2D2D39] bg-[#F7F7F7] dark:bg-[#161616]">
          <div className="flex items-center space-x-3">
            {isDestructive ? (
              <div className="w-8 h-8 rounded-full bg-[#DA1E28]/10 flex items-center justify-center">
                <AlertTriangle size={16} className="text-[#DA1E28]" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#0F62FE]/10 flex items-center justify-center">
                <AlertTriangle size={16} className="text-[#0F62FE]" />
              </div>
            )}
            <h3 className="font-sans font-bold text-lg text-[#161616] dark:text-white">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-[#757575] hover:text-[#161616] dark:text-[#8D8D8D] dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="font-sans text-sm text-[#525252] dark:text-[#A8A8A8] leading-relaxed">
            {message}
          </p>
        </div>
        
        <div className="p-5 border-t border-[#E0E0E0] dark:border-[#2D2D39] bg-[#F7F7F7] dark:bg-[#161616] flex justify-end space-x-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 font-sans font-semibold text-sm text-[#525252] dark:text-[#A8A8A8] hover:text-[#161616] dark:hover:text-white transition-colors"
          >
            {cancelLabel}
          </button>
          <button 
            onClick={onConfirm}
            className={`px-4 py-2 font-sans font-semibold text-sm text-white rounded-[4px] transition-colors shadow-sm ${
              isDestructive 
                ? 'bg-[#DA1E28] hover:bg-[#BA1B23]' 
                : 'bg-[#0F62FE] hover:bg-[#0353E9]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
