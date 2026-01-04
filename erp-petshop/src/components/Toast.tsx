import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const iconMap = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const colorMap = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconColorMap = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((type: ToastType, message: string) => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, type, message }]);

        // Auto remove after 4 seconds
        setTimeout(() => {
            removeToast(id);
        }, 4000);
    }, [removeToast]);

    const success = useCallback((message: string) => showToast('success', message), [showToast]);
    const error = useCallback((message: string) => showToast('error', message), [showToast]);
    const warning = useCallback((message: string) => showToast('warning', message), [showToast]);
    const info = useCallback((message: string) => showToast('info', message), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm">
                {toasts.map((toast) => {
                    const Icon = iconMap[toast.type];
                    return (
                        <div
                            key={toast.id}
                            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-slide-in ${colorMap[toast.type]}`}
                        >
                            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColorMap[toast.type]}`} />
                            <p className="text-sm font-medium flex-1">{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};
