'use client';

import React from 'react';
import {
    CheckCircle,
    AlertCircle,
    Info,
    X,
    AlertTriangle,
    Loader2
} from 'lucide-react';

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

const ToastItem = ({ message, type, action, onClose }) => {
    const configs = {
        success: {
            icon: <CheckCircle className="w-5 h-5 text-green-500" />,
            bg: 'bg-green-50/90 border-green-200/50',
            text: 'text-green-900',
        },
        error: {
            icon: <AlertCircle className="w-5 h-5 text-red-500" />,
            bg: 'bg-red-50/90 border-red-200/50',
            text: 'text-red-900',
        },
        warning: {
            icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
            bg: 'bg-amber-50/90 border-amber-200/50',
            text: 'text-amber-900',
        },
        info: {
            icon: <Info className="w-5 h-5 text-blue-500" />,
            bg: 'bg-blue-50/90 border-blue-200/50',
            text: 'text-blue-900',
        },
        confirm: {
            icon: <AlertCircle className="w-5 h-5 text-purple-500" />,
            bg: 'bg-white shadow-2xl border-gray-100',
            text: 'text-gray-900',
        },
        prompt: {
            icon: <CheckCircle className="w-5 h-5 text-indigo-500" />,
            bg: 'bg-white shadow-2xl border-gray-100',
            text: 'text-gray-900',
        }
    };

    const config = configs[type] || configs.info;

    return (
        <div className={`
      pointer-events-auto
      flex items-start gap-4 p-4 rounded-2xl border-2 backdrop-blur-md
      min-w-[320px] max-w-[420px] shadow-lg animate-in slide-in-from-right-10 duration-300
      ${config.bg}
    `}>
            <div className="flex-shrink-0 mt-0.5">
                {config.icon}
            </div>

            <div className="flex-grow min-w-0">
                <p className={`text-sm font-semibold tracking-tight ${config.text}`}>
                    {message}
                </p>

                {type === 'prompt' && (
                    <input
                        type="text"
                        autoFocus
                        className="w-full mt-3 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                        placeholder="Type here..."
                        onChange={(e) => action.onInputChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') action.onExecute();
                        }}
                    />
                )}

                {action && (
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={action.onExecute}
                            className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-all shadow-sm active:scale-95"
                        >
                            {action.label || 'Confirm'}
                        </button>
                        <button
                            onClick={action.onCancel || onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-900 text-xs font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {!action && (
                <button
                    onClick={onClose}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};
