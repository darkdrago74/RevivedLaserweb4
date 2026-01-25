import React, { useState } from 'react';
import { Unlock, RefreshCw, ArrowDownToLine, TriangleAlert, Activity, Flame, Scan } from 'lucide-react';
import type { MachineStatus } from '../types';

interface MacroPanelProps {
    status: MachineStatus;
    hasGcode: boolean;
    onCommand: (cmd: string) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onProbe: (options: any) => void;
    onLaserTest: (power: number, duration: number) => void;
    onFrame: () => void;
}

const MacroPanel: React.FC<MacroPanelProps> = ({ status, hasGcode, onCommand, onProbe, onLaserTest, onFrame }) => {
    const [showProbe, setShowProbe] = useState(false);

    // Laser Test Settings
    const [testPower, setTestPower] = useState(1); // 1% default
    // const [duration, setDuration] = useState(0); // 0 = Toggle, >0 = ms (Unused for now)

    // Probe settings
    const [plateThickness, setPlateThickness] = useState(15.0);
    const [retract, setRetract] = useState(5.0);
    const [dist, setDist] = useState(-20.0);

    const handleProbeStart = () => {
        onProbe({
            axis: 'z',
            feedrate: 100, // Slow probe
            dist,
            plateThickness,
            retract
        });
        setShowProbe(false);
    };

    return (
        <div className="glass-panel p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Macros</h3>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => onCommand('$X')}
                    className="flex items-center gap-2 p-2 bg-red-900/30 hover:bg-red-900/50 text-red-200 rounded border border-red-800/50 transition-colors"
                    title="Unlock Alarm"
                >
                    <Unlock size={16} />
                    <span>Unlock</span>
                </button>

                <button
                    onClick={() => onCommand('$H')}
                    className="flex items-center gap-2 p-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-200 rounded border border-blue-800/50 transition-colors"
                >
                    <RefreshCw size={16} />
                    <span>Home All</span>
                </button>

                {/* Laser Tools */}
                <div className="col-span-2 bg-black/20 p-2 rounded border border-white/5 space-y-2 mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Laser Test</span>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                value={testPower}
                                onChange={e => setTestPower(Number(e.target.value))}
                                className="w-10 bg-black border border-gray-700 text-center rounded text-white"
                                min={0} max={100}
                            />
                            <span>%</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onLaserTest(testPower, 0)}
                            className="flex-1 flex items-center justify-center gap-2 p-2 bg-orange-900/30 hover:bg-orange-900/50 text-orange-200 rounded border border-orange-800/50"
                        >
                            <Flame size={16} />
                            <span>Fire</span>
                        </button>
                        <button
                            onClick={onFrame}
                            disabled={!hasGcode}
                            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded border transition-colors ${hasGcode ? 'bg-cyan-900/30 hover:bg-cyan-900/50 text-cyan-200 border-cyan-800/50' : 'bg-gray-800/30 text-gray-600 border-gray-800 opacity-50 cursor-not-allowed'}`}
                        >
                            <Scan size={16} />
                            <span>Frame</span>
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => setShowProbe(!showProbe)}
                    className="col-span-2 flex items-center justify-center gap-2 p-2 bg-purple-900/30 hover:bg-purple-900/50 text-purple-200 rounded border border-purple-800/50 transition-colors mt-2"
                >
                    <ArrowDownToLine size={16} />
                    <span>Z-Probe Wizard</span>
                </button>
            </div>

            {/* Probe Modal / Inline Form */}
            {showProbe && (
                <div className="bg-black/50 p-4 rounded border border-purple-500/30 space-y-3">
                    <p className="text-xs text-purple-300 flex items-center gap-1">
                        <TriangleAlert size={12} />
                        Ensure probe plate is connected!
                    </p>

                    {/* Hardware Check */}
                    <div className="bg-black/40 p-2 rounded text-xs flex justify-between items-center">
                        <span className="text-gray-400">Probe Signal:</span>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded ${status.ports?.includes('P') || status.ports?.includes('Z') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                            <Activity size={10} />
                            <span>{status.ports?.includes('P') || status.ports?.includes('Z') ? 'TRIGGERED' : 'OPEN'}</span>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-500 italic">
                        Tip: Touch plate to clip to verify 'TRIGGERED' before starting.
                        (Arduino V3: Z-Min, DLC32: Probe)
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <label className="block text-gray-500">Plate (mm)</label>
                            <input
                                type="number"
                                value={plateThickness}
                                onChange={(e) => setPlateThickness(Number(e.target.value))}
                                className="w-full bg-black/50 border border-gray-700 rounded p-1 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-500">Retract (mm)</label>
                            <input
                                type="number"
                                value={retract}
                                onChange={(e) => setRetract(Number(e.target.value))}
                                className="w-full bg-black/50 border border-gray-700 rounded p-1 text-white"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-gray-500">Max Dist (mm)</label>
                            <input
                                type="number"
                                value={dist}
                                onChange={(e) => setDist(Number(e.target.value))}
                                className="w-full bg-black/50 border border-gray-700 rounded p-1 text-white"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleProbeStart}
                        className="w-full py-2 bg-[var(--accent-color)] hover:bg-cyan-600 text-white rounded font-medium text-xs shadow-lg shadow-cyan-900/20"
                    >
                        Start Probe Sequence
                    </button>
                </div>
            )}
        </div>
    );
};

export default MacroPanel;
