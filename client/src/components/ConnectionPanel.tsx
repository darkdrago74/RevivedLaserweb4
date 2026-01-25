import React, { useState } from 'react';
import { Settings, Link, Wifi } from 'lucide-react';
import type { MachineStatus } from '../types';

interface ConnectionPanelProps {
    status: MachineStatus;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onConnect: (type: 'grbl' | 'klipper', config: any) => void;
    onDisconnect: () => void;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({ status, onConnect, onDisconnect }) => {
    const [mode, setMode] = useState<'grbl' | 'klipper'>('grbl');
    const [port, setPort] = useState('/dev/ttyUSB0');
    const [baud, setBaud] = useState(115200);
    const [host, setHost] = useState('192.168.1.100');

    const isConnected = status.state !== 'Disconnected';

    const handleConnect = () => {
        if (mode === 'grbl') {
            onConnect('grbl', { port, baud });
        } else {
            onConnect('klipper', { host });
        }
    };

    return (
        <div className="glass-panel p-6 w-full max-w-sm">
            <div className="flex items-center gap-2 mb-4 text-accent">
                <Settings size={20} className="text-[var(--accent-color)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Connection</h2>
            </div>

            <div className="flex gap-2 mb-4 bg-[rgba(15,23,42,0.5)] p-1 rounded-lg">
                <button
                    className={`flex-1 py-1 text-sm rounded ${mode === 'grbl' ? 'bg-[var(--accent-color)] text-white' : 'text-[var(--text-secondary)] hover:text-white'}`}
                    onClick={() => setMode('grbl')}
                    disabled={isConnected}
                >
                    GRBL (Serial)
                </button>
                <button
                    className={`flex-1 py-1 text-sm rounded ${mode === 'klipper' ? 'bg-[var(--accent-color)] text-white' : 'text-[var(--text-secondary)] hover:text-white'}`}
                    onClick={() => setMode('klipper')}
                    disabled={isConnected}
                >
                    Klipper (Net)
                </button>
            </div>

            <div className="space-y-4">
                {mode === 'grbl' ? (
                    <>
                        <div>
                            <label className="label">Serial Port</label>
                            <div className="flex items-center gap-2 bg-[rgba(15,23,42,0.5)] rounded-md px-2 border border-[var(--border-color)]">
                                <Link size={16} className="text-[var(--text-secondary)]" />
                                <input
                                    type="text"
                                    value={port}
                                    onChange={(e) => setPort(e.target.value)}
                                    className="bg-transparent border-none text-[var(--text-primary)] w-full py-2 focus:outline-none"
                                    disabled={isConnected}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="label">Baud Rate</label>
                            <select
                                value={baud}
                                onChange={(e) => setBaud(Number(e.target.value))}
                                className="input-field"
                                disabled={isConnected}
                            >
                                <option value={115200}>115200</option>
                                <option value={250000}>250000</option>
                                <option value={9600}>9600</option>
                            </select>
                        </div>
                    </>
                ) : (
                    <div>
                        <label className="label">IP Address / Hostname</label>
                        <div className="flex items-center gap-2 bg-[rgba(15,23,42,0.5)] rounded-md px-2 border border-[var(--border-color)]">
                            <Wifi size={16} className="text-[var(--text-secondary)]" />
                            <input
                                type="text"
                                value={host}
                                onChange={(e) => setHost(e.target.value)}
                                className="bg-transparent border-none text-[var(--text-primary)] w-full py-2 focus:outline-none"
                                placeholder="192.168.1.x"
                                disabled={isConnected}
                            />
                        </div>
                    </div>
                )}

                <div className="pt-2">
                    {!isConnected ? (
                        <button className="btn-primary w-full shadow-lg shadow-[rgba(6,182,212,0.2)]" onClick={handleConnect}>
                            Connect Machine
                        </button>
                    ) : (
                        <button className="w-full py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 transition-colors" onClick={onDisconnect}>
                            Disconnect
                        </button>
                    )}
                </div>

                {isConnected && (
                    <div className="flex items-center justify-center gap-2 text-xs text-green-400 mt-2">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                        Connected
                    </div>
                )}
            </div>
        </div>
    );
};
