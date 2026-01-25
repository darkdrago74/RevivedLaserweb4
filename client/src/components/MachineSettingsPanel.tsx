import { useState, useEffect } from 'react';
import { Save, Upload, Download, RefreshCw, LayoutTemplate, Box, ArrowLeftRight, Eye } from 'lucide-react';

interface AxisSettings {
    visible: boolean;
    min: number;
    max: number;
    direction: number;
    reversed: boolean;
}

interface WorkbenchSettings {
    width: number;
    height: number;
    depth: number;
    origin: 'bottom-left' | 'top-left' | 'center';
    showWorkbench: boolean;
}

interface MachineSettings {
    workbench: WorkbenchSettings;
    axes: {
        x: AxisSettings;
        y: AxisSettings;
        z: AxisSettings;
    };
    macros: any[];
}

interface MachineSettingsPanelProps {
    status: any; // Using any for status to avoid circular dependency or complex type import for now
    laserBeamEnabled: boolean;
    setLaserBeamEnabled: (enabled: boolean) => void;
}

const API_URL = 'http://localhost:3000';

export default function MachineSettingsPanel({ status, laserBeamEnabled, setLaserBeamEnabled }: MachineSettingsPanelProps) {
    const [settings, setSettings] = useState<MachineSettings | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/settings/machine`);
            const data = await res.json();
            setSettings(data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            await fetch(`${API_URL}/api/settings/machine`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const updateWorkbench = (key: keyof WorkbenchSettings, value: any) => {
        if (!settings) return;
        setSettings({
            ...settings,
            workbench: { ...settings.workbench, [key]: value }
        });
    };

    const updateAxis = (axis: 'x' | 'y' | 'z', key: keyof AxisSettings, value: any) => {
        if (!settings) return;
        setSettings({
            ...settings,
            axes: {
                ...settings.axes,
                [axis]: { ...settings.axes[axis], [key]: value }
            }
        });
    };

    // Placeholder for Import functions
    const handleImportKlipper = () => alert("Import from Klipper - Coming Soon");
    const handleImportGrbl = () => alert("Import from GRBL - Coming Soon");

    if (loading || !settings) return <div className="p-4 text-gray-400">Loading settings...</div>;

    return (
        <div className="p-4 space-y-6 text-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <LayoutTemplate size={20} className="text-cyan-400" />
                    Machine Setup
                </h3>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded flex items-center gap-2 disabled:opacity-50"
                >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </div>

            {/* Workbench Dimensions */}
            <section className="bg-slate-800/50 p-4 rounded-lg border border-white/10 space-y-4">
                <h4 className="text-md font-semibold text-gray-200 flex items-center gap-2">
                    <Box size={16} /> Workbench Area
                </h4>
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className="block text-gray-400 text-xs mb-1">Width (X)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={settings.workbench.width}
                                onChange={e => updateWorkbench('width', parseFloat(e.target.value))}
                                className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-white text-right pr-6"
                            />
                            <span className="absolute right-2 top-1 text-gray-500 text-xs">mm</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-400 text-xs mb-1">Height (Y)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={settings.workbench.height}
                                onChange={e => updateWorkbench('height', parseFloat(e.target.value))}
                                className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-white text-right pr-6"
                            />
                            <span className="absolute right-2 top-1 text-gray-500 text-xs">mm</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-400 text-xs mb-1">Depth (Z)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={settings.workbench.depth}
                                onChange={e => updateWorkbench('depth', parseFloat(e.target.value))}
                                className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-white text-right pr-6"
                            />
                            <span className="absolute right-2 top-1 text-gray-500 text-xs">mm</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-400">Show in Visualizer</span>
                    <input
                        type="checkbox"
                        checked={settings.workbench.showWorkbench}
                        onChange={e => updateWorkbench('showWorkbench', e.target.checked)}
                        className="accent-cyan-500"
                    />
                </div>
            </section>

            {/* Axis Configuration & Visualizer */}
            <section className="bg-slate-800/50 p-4 rounded-lg border border-white/10 space-y-4">
                <h4 className="text-md font-semibold text-gray-200 flex items-center gap-2">
                    <MoveIcon /> Axis Configuration
                </h4>

                {/* Visualizer Mockup (Simple SVG) */}
                <div className="w-full aspect-video bg-slate-900 rounded border border-white/5 relative flex items-center justify-center overflow-hidden">
                    <AxisVisualizer settings={settings} onUpdateOrigin={(o) => updateWorkbench('origin', o)} />
                </div>

                <div className="space-y-3">
                    {/* X Axis */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-red-500 font-bold">X</span>
                            <span className="text-gray-400 text-xs">{settings.axes.x.max}mm</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500 flex items-center gap-1 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.axes.x.reversed}
                                    onChange={e => updateAxis('x', 'reversed', e.target.checked)}
                                    className="accent-cyan-500"
                                /> Reverse
                            </label>
                        </div>
                    </div>

                    {/* Y Axis */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-green-500 font-bold">Y</span>
                            <span className="text-gray-400 text-xs">{settings.axes.y.max}mm</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500 flex items-center gap-1 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.axes.y.reversed}
                                    onChange={e => updateAxis('y', 'reversed', e.target.checked)}
                                    className="accent-cyan-500"
                                /> Reverse
                            </label>
                        </div>
                    </div>

                    {/* Z Axis */}
                    <div className="flex items-center justify-between pb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-blue-500 font-bold">Z</span>
                            <input
                                type="checkbox"
                                checked={settings.axes.z.visible}
                                onChange={e => updateAxis('z', 'visible', e.target.checked)}
                                className="accent-cyan-500"
                            />
                            <span className="text-gray-400 text-xs">{settings.axes.z.visible ? `${settings.axes.z.max}mm` : '(Disabled)'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {settings.axes.z.visible && (
                                <label className="text-xs text-gray-500 flex items-center gap-1 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.axes.z.reversed}
                                        onChange={e => updateAxis('z', 'reversed', e.target.checked)}
                                        className="accent-cyan-500"
                                    /> Reverse
                                </label>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Import / Export */}
            <section className="bg-slate-800/50 p-4 rounded-lg border border-white/10 space-y-4">
                <h4 className="text-md font-semibold text-gray-200">Data Management</h4>
                <div className="flex gap-2">
                    <button onClick={handleImportKlipper} className="flex-1 bg-white/5 hover:bg-white/10 p-2 rounded text-xs flex flex-col items-center gap-1">
                        <RefreshCw size={16} className="text-orange-400" />
                        <span>Klipper Import</span>
                    </button>
                    <button onClick={handleImportGrbl} className="flex-1 bg-white/5 hover:bg-white/10 p-2 rounded text-xs flex flex-col items-center gap-1">
                        <RefreshCw size={16} className="text-blue-400" />
                        <span>GRBL Import</span>
                    </button>
                </div>
                <div className="flex gap-2 pt-2 border-t border-white/5">
                    <button className="flex-1 text-gray-400 hover:text-white text-xs flex items-center justify-center gap-1">
                        <Download size={14} /> Export JSON
                    </button>
                    <button className="flex-1 text-gray-400 hover:text-white text-xs flex items-center justify-center gap-1">
                        <Upload size={14} /> Import JSON
                    </button>
                </div>
            </section>


            {/* Visualizer Settings */}
            <section className="bg-slate-800/50 p-4 rounded-lg border border-white/10 space-y-4">
                <h4 className="text-md font-semibold text-gray-200 flex items-center gap-2">
                    <Eye size={16} /> App Preferences
                </h4>
                <div className="flex items-center justify-between">
                    <span className="text-gray-400">Background Cosmetic Laser</span>
                    <button
                        onClick={() => setLaserBeamEnabled(!laserBeamEnabled)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${laserBeamEnabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
                    >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${laserBeamEnabled ? 'left-5.5' : 'left-0.5'}`} />
                    </button>
                </div>
            </section>

            {/* System Info */}
            <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10 opacity-75">
                <h3 className="text-md font-semibold text-white mb-4">System Info</h3>
                <div className="space-y-2 text-xs text-gray-400">
                    <div className="flex justify-between">
                        <span>Server URL:</span>
                        <span className="font-mono text-cyan-400 overflow-hidden text-ellipsis ml-2">{(status as any).ip || window.location.host}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Client Version:</span>
                        <span className="font-mono">v1.1.0 (Settings Upd)</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Mode:</span>
                        <span className="font-mono">{status.state === 'Disconnected' ? 'Offline' : 'Online'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MoveIcon() {
    return <ArrowLeftRight size={16} />;
}


function AxisVisualizer({ settings, onUpdateOrigin }: { settings: MachineSettings, onUpdateOrigin: (o: any) => void }) {
    // Determine aspect ratio for SVG
    const w = settings.workbench.width;
    const h = settings.workbench.height;



    const origin = settings.workbench.origin;

    // Origins: bottom-left (default), top-left, center
    const isBL = origin === 'bottom-left';
    const isTL = origin === 'top-left';
    const isCenter = origin === 'center';

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full p-4" style={{ transform: 'scale(0.8)' }}>
            {/* Bed Outline */}
            <rect x="0" y="0" width={w} height={h} fill="#1e293b" stroke="#475569" strokeWidth="2" />

            {/* Grid (simplified) */}
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#334155" strokeWidth="1" />
            </pattern>
            <rect x="0" y="0" width={w} height={h} fill="url(#grid)" />

            {/* Origin Markers (Clickable) */}
            {/* Bottom-Left */}
            <circle
                cx="0" cy={h} r={10}
                fill={isBL ? "#06b6d4" : "#475569"}
                className="cursor-pointer hover:fill-cyan-400 transition-colors"
                onClick={() => onUpdateOrigin('bottom-left')}
            />
            {/* Top-Left */}
            <circle
                cx="0" cy="0" r={10}
                fill={isTL ? "#06b6d4" : "#475569"}
                className="cursor-pointer hover:fill-cyan-400 transition-colors"
                onClick={() => onUpdateOrigin('top-left')}
            />
            {/* Center */}
            <circle
                cx={w / 2} cy={h / 2} r={10}
                fill={isCenter ? "#06b6d4" : "#475569"}
                className="cursor-pointer hover:fill-cyan-400 transition-colors"
                onClick={() => onUpdateOrigin('center')}
            />

            {/* Arrows representing Axes based on Origin */}
            {isBL && (
                <g transform={`translate(0, ${h}) scale(1, -1)`}>
                    <line x1="0" y1="0" x2="50" y2="0" stroke="red" strokeWidth="4" markerEnd="url(#arrow)" />
                    <line x1="0" y1="0" x2="0" y2="50" stroke="green" strokeWidth="4" markerEnd="url(#arrow)" />
                </g>
            )}
            {isTL && (
                <g transform={`translate(0, 0)`}>
                    <line x1="0" y1="0" x2="50" y2="0" stroke="red" strokeWidth="4" />
                    <line x1="0" y1="0" x2="0" y2="50" stroke="green" strokeWidth="4" />
                </g>
            )}
            {isCenter && (
                <g transform={`translate(${w / 2}, ${h / 2}) scale(1, -1)`}>
                    <line x1="0" y1="0" x2="50" y2="0" stroke="red" strokeWidth="4" />
                    <line x1="0" y1="0" x2="0" y2="50" stroke="green" strokeWidth="4" />
                </g>
            )}
        </svg>
    )
}
