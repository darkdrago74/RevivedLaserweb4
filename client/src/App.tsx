import { useState, useEffect, useCallback } from 'react';
import { ConnectionPanel } from './components/ConnectionPanel';
import { ControlPanel } from './components/ControlPanel';
import CamPanel from './components/CamPanel';
import Terminal from './components/Terminal';
import MacroPanel from './components/MacroPanel';
import VisualizerScene from './components/Visualizer/VisualizerScene';
import type { MachineStatus } from './types';
import { Activity } from 'lucide-react';

import { Sidebar } from './components/Sidebar';
import { BackgroundFX } from './components/BackgroundFX';

const API_URL = 'http://localhost:3000';

function App() {
  const [status, setStatus] = useState<MachineStatus>({
    state: 'Disconnected',
    pos: { x: 0, y: 0, z: 0 },
    feedrate: 0,
    spindle: 0,
    logs: []
  });

  const [gcode, setGcode] = useState<string[]>([]);
  const handleGcodeGenerated = (generated: string) => {
    setGcode(generated.split('\n'));
    setActiveTab('gcode'); // Auto-switch to GCode view
  };
  // const [lastPing, setLastPing] = useState<Date>(new Date());

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/status`);
      const data = await res.json();

      // Safety: Ensure pos exists if server returns partial status (e.g. Disconnected)
      setStatus(prev => ({
        ...prev,
        ...data,
        pos: data.pos || prev.pos || { x: 0, y: 0, z: 0 }
      }));
    } catch {
      // console.error(e);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(fetchStatus, 500);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleConnect = async (type: 'grbl' | 'klipper', config: any) => {
    try {
      await fetch(`${API_URL}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...config })
      });
      fetchStatus();
    } catch {
      alert('Connection failed');
    }
  };

  const handleDisconnect = async () => {
    // Implement disconnect
  };

  const handleJog = async (axis: 'x' | 'y' | 'z', dist: number, feedrate: number) => {
    try {
      await fetch(`${API_URL}/jog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ axis, dist, feedrate })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommand = async (gcode: string) => {
    try {
      await fetch(`${API_URL}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gcode })
      });
    } catch (e) { console.error(e); }
  };

  const handleProbe = async (options: unknown) => {
    try {
      await fetch(`${API_URL}/probe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
    } catch {
      alert('Probe Failed to Start');
    }
  };

  const handleLaserTest = async (powerPct: number, duration: number) => {
    // S value depends on controller max (usually 1000 for GRBL defaults, or 255)
    // Assuming S1000 = 100%. 
    const sVal = Math.floor((powerPct / 100) * 1000);
    const cmd = sVal > 0 ? `M3 S${sVal}` : 'M5';
    handleCommand(cmd);
    // If toggle logic needed (e.g. click to fire, click to stop), UI handles it or we send specific pair.
    // For now, simpler: user clicks Fire -> M3. User clicks again -> M5? 
    // The UI currently just sends "Fire". Let's assume it's a toggle for now or momentary?
    // User requirement: "Laser test function". Usually momentary button or toggle.
    // Let's rely on user manually turning it off, or finding a way to toggle.
    // IMPROVEMENT: MacroPanel should probably handle Toggle state for "Fire".
    // For safety, let's just assume this fires ON. User must manually stop or we add a text input for Duration.
    // Let's add a quick timeout for safety if duration > 0.
    if (duration > 0) {
      setTimeout(() => handleCommand('M5'), duration);
    }
  };

  const handleFrame = async () => {
    if (gcode.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    gcode.forEach(line => {
      // Basic parsing for G0/G1 X.. Y..
      const matchX = /X([\d.-]+)/.exec(line);
      const matchY = /Y([\d.-]+)/.exec(line);
      if (matchX) {
        const v = parseFloat(matchX[1]);
        if (v < minX) minX = v;
        if (v > maxX) maxX = v;
      }
      if (matchY) {
        const v = parseFloat(matchY[1]);
        if (v < minY) minY = v;
        if (v > maxY) maxY = v;
      }
    });

    if (minX === Infinity || minY === Infinity) {
      alert("Could not determine bounds from G-code");
      return;
    }

    // Framing Sequence: 
    // 1. Laser On (Low Power - hardcoded 1% or user pref? Let's use S10)
    // 2. Move to corners
    // 3. Laser Off
    // Note: Moves should be G0 (Rapid)

    const cmds = [
      'M3 S10', // Low power check
      `G0 X${minX} Y${minY}`,
      `G0 X${minX} Y${maxY}`,
      `G0 X${maxX} Y${maxY}`,
      `G0 X${maxX} Y${minY}`,
      `G0 X${minX} Y${minY}`,
      'M5'
    ];

    // Execute sequentially
    for (const cmd of cmds) {
      await handleCommand(cmd);
      // Small delay might be needed for visual tracking? 
      // Browser fetch is async, but server queues it.
    }
  };

  const [activeTab, setActiveTab] = useState<string | null>('connection');
  const [laserBeamEnabled, setLaserBeamEnabled] = useState(true);

  // Refactor: Mapping activeTab to SidePane Content
  const renderSidePane = () => {
    switch (activeTab) {
      case 'connection':
        return <ConnectionPanel status={status} onConnect={handleConnect} onDisconnect={handleDisconnect} />;
      case 'jog':
        return (
          <div className="space-y-6">
            <ControlPanel status={status} onJog={handleJog} onHome={() => handleCommand('$H')} />
            <MacroPanel
              status={status}
              hasGcode={gcode.length > 0}
              onCommand={handleCommand}
              onProbe={handleProbe}
              onLaserTest={handleLaserTest}
              onFrame={handleFrame}
            />
          </div>
        );
      case 'cam':
        return <CamPanel onGenerate={handleGcodeGenerated} />;
      case 'gcode':
        return (
          <div className="h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4">G-Code Job</h2>
            <div className="flex-1 overflow-hidden">
              <Terminal logs={status.logs || []} onCommand={handleCommand} />
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="p-4 space-y-6">
            <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10">
              <h3 className="text-md font-semibold text-white mb-4">Visualizer Settings</h3>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Background Laser Beam</span>
                <button
                  onClick={() => setLaserBeamEnabled(!laserBeamEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${laserBeamEnabled ? 'bg-cyan-500' : 'bg-gray-600'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${laserBeamEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Show cosmetic laser beam animation in the background.
              </p>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10">
              <h3 className="text-md font-semibold text-white mb-4">System Info</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Server URL:</span>
                  <span className="font-mono text-cyan-400">{(status as any).ip ? `${(status as any).ip}:3000` : window.location.host}</span>
                </div>
                <div className="flex justify-between">
                  <span>Client Version:</span>
                  <span className="font-mono">v1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <span className="font-mono">{status.state === 'Disconnected' ? 'Offline' : 'Online'}</span>
                </div>
              </div>
            </div>

            {/* Future settings can go here */}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-gray-200 overflow-hidden relative">
      <BackgroundFX />

      {/* LzrCnc Logo Overlay - Top Center (Shifted Right) */}
      <div className="absolute top-0 left-[60%] transform -translate-x-1/2 z-[60] pointer-events-none mt-4">
        <img
          src="/logo.png"
          alt="LzrCnc Logo"
          className="h-20 object-contain"
          style={{
            maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 80%)'
          }}
        />
      </div>

      {/* 1. Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        connectionState={status.state}
      />


      {/* 2. Side Pane (Expandable) */}
      {activeTab && (
        <div className="w-[400px] border-r border-white/10 bg-[#1e293b]/50 backdrop-blur-md flex flex-col transition-all duration-300 z-40 shadow-2xl">
          <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white capitalize">{activeTab}</h2>
            <button onClick={() => setActiveTab(null)} className="text-gray-500 hover:text-white">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {renderSidePane()}
          </div>
        </div>
      )}

      {/* 3. Main Content (Visualizer) */}
      <div className="flex-1 relative bg-black/40">
        <VisualizerScene
          machinePos={status.pos}
          limits={status.limits}
          gcode={gcode}
          laserBeamEnabled={laserBeamEnabled}
        />

        {/* Overlay Status Bar */}
        <div className="absolute top-4 right-4 flex gap-4 pointer-events-none">
          <div className="glass-panel px-4 py-2 flex items-center gap-2 pointer-events-auto">
            <Activity size={16} className={status.state !== 'Disconnected' ? "text-green-400" : "text-gray-500"} />
            <span className="font-mono font-bold">{status.state}</span>
            <span className="text-sm text-gray-400">
              X:{status.pos.x.toFixed(1)} Y:{status.pos.y.toFixed(1)} Z:{status.pos.z.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
