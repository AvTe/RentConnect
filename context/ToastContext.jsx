'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer } from '@/components/ui/Toast';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ message, type = 'info', duration = 4000, action = null }) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type, action }]);

        if (duration !== Infinity && !action) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = {
        success: (message, duration) => addToast({ message, type: 'success', duration }),
        error: (message, duration) => addToast({ message, type: 'error', duration }),
        info: (message, duration) => addToast({ message, type: 'info', duration }),
        warning: (message, duration) => addToast({ message, type: 'warning', duration }),
    };

    // Custom confirm dialog replacement
    const showConfirm = useCallback((message, onConfirm, onCancel) => {
        const id = addToast({
            message,
            type: 'confirm',
            duration: Infinity,
            action: {
                label: 'Confirm',
                onExecute: () => {
                    if (onConfirm) onConfirm();
                    removeToast(id);
                },
                onCancel: () => {
                    if (onCancel) onCancel();
                    removeToast(id);
                }
            }
        });
    }, [addToast, removeToast]);

    const showPrompt = useCallback((message, onConfirm, defaultValue = '') => {
        let value = defaultValue;
        const id = addToast({
            message,
            type: 'prompt',
            duration: Infinity,
            action: {
                label: 'Submit',
                onExecute: () => {
                    if (onConfirm) onConfirm(value);
                    removeToast(id);
                },
                onInputChange: (v) => { value = v; }
            }
        });
    }, [addToast, removeToast]);

    return (
        <ToastContext.Provider value={{ toast, showConfirm, showPrompt, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
