/**
 * Hardware Service Client Hook
 * 
 * React hook to connect to the local hardware service.
 * Provides barcode scanning, scale reading, and drawer control.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface HardwareStatus {
    connected: boolean;
    devices: string[];
}

interface HardwareHook {
    status: HardwareStatus;
    lastBarcode: string | null;
    lastWeight: number | null;
    openDrawer: () => void;
    readWeight: () => void;
    simulateBarcode: (barcode: string) => void;
}

// Configurable via environment or default to localhost
const HARDWARE_WS_URL = import.meta.env.VITE_HARDWARE_WS_URL || 'ws://localhost:3002';
const HARDWARE_API_KEY = import.meta.env.VITE_HARDWARE_API_KEY || '';

export function useHardware(): HardwareHook {
    const [status, setStatus] = useState<HardwareStatus>({ connected: false, devices: [] });
    const [lastBarcode, setLastBarcode] = useState<string | null>(null);
    const [lastWeight, setLastWeight] = useState<number | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        try {
            // Build URL with API key if configured
            const wsUrl = HARDWARE_API_KEY
                ? `${HARDWARE_WS_URL}?key=${HARDWARE_API_KEY}`
                : HARDWARE_WS_URL;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('🔌 Connected to hardware service');
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);

                    switch (msg.type) {
                        case 'connected':
                            setStatus({ connected: true, devices: msg.devices || [] });
                            break;
                        case 'barcode':
                            setLastBarcode(msg.data);
                            break;
                        case 'weight':
                            setLastWeight(msg.data);
                            break;
                        case 'drawerOpened':
                            console.log('💵 Drawer opened');
                            break;
                        case 'error':
                            console.error('Hardware error:', msg.message);
                            break;
                    }
                } catch (e) {
                    console.error('Failed to parse hardware message:', e);
                }
            };

            ws.onclose = () => {
                console.log('🔌 Disconnected from hardware service');
                setStatus({ connected: false, devices: [] });

                // Auto-reconnect after 5 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('🔄 Reconnecting to hardware service...');
                    connect();
                }, 5000);
            };

            ws.onerror = (err) => {
                console.log('Hardware service not available (this is normal if running without hardware)');
            };

            wsRef.current = ws;
        } catch (e) {
            console.log('Could not connect to hardware service');
        }
    }, []);

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    const sendCommand = useCallback((action: string, data?: object) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ action, ...data }));
        }
    }, []);

    const openDrawer = useCallback(() => {
        sendCommand('openDrawer');
    }, [sendCommand]);

    const readWeight = useCallback(() => {
        sendCommand('readWeight');
    }, [sendCommand]);

    const simulateBarcode = useCallback((barcode: string) => {
        sendCommand('simulateBarcode', { barcode });
    }, [sendCommand]);

    return {
        status,
        lastBarcode,
        lastWeight,
        openDrawer,
        readWeight,
        simulateBarcode
    };
}
