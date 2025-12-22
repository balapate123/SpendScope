import { useState, useCallback } from 'react';

// Simple event emitter for Add Transaction modal
type Listener = () => void;
const listeners: Listener[] = [];

export const addTransactionEmitter = {
    emit: () => {
        listeners.forEach(fn => fn());
    },
    subscribe: (fn: Listener) => {
        listeners.push(fn);
        return () => {
            const idx = listeners.indexOf(fn);
            if (idx > -1) listeners.splice(idx, 1);
        };
    },
};

// Hook to use in components
export const useAddTransactionModal = () => {
    const [visible, setVisible] = useState(false);

    const open = useCallback(() => setVisible(true), []);
    const close = useCallback(() => setVisible(false), []);

    return { visible, open, close };
};
