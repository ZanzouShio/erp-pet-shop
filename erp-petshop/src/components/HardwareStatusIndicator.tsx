/**
 * Hardware Status Indicator
 * 
 * Shows connection status to the local hardware service.
 */

import { Wifi, WifiOff, Scan, Scale, DollarSign } from 'lucide-react';

interface HardwareStatusProps {
    connected: boolean;
    devices: string[];
}

export default function HardwareStatusIndicator({ connected, devices }: HardwareStatusProps) {
    return (
        <div className="relative">
            <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${connected
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                        : 'bg-gradient-to-r from-slate-600 to-slate-700 text-slate-300'
                    }`}
            >
                {connected ? (
                    <Wifi className="w-5 h-5" />
                ) : (
                    <WifiOff className="w-5 h-5" />
                )}
                <span className="font-medium">
                    {connected ? 'Hardware' : 'Sem Hardware'}
                </span>
                {connected && devices.length > 0 && (
                    <div className="flex items-center gap-1 ml-1 pl-2 border-l border-white/30">
                        {devices.includes('scanner') && (
                            <div title="Leitor de Barras" className="p-0.5">
                                <Scan className="w-4 h-4" />
                            </div>
                        )}
                        {devices.includes('scale') && (
                            <div title="Balança" className="p-0.5">
                                <Scale className="w-4 h-4" />
                            </div>
                        )}
                        {devices.includes('drawer') && (
                            <div title="Gaveta" className="p-0.5">
                                <DollarSign className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
