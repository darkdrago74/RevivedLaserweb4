import React, { useState } from 'react';
import { Table, Zap } from 'lucide-react';

interface TestGeneratorProps {
    onGenerate: (gcode: string) => void;
}

const TestGeneratorPanel: React.FC<TestGeneratorProps> = ({ onGenerate }) => {
    // Configuration
    const [minSpeed, setMinSpeed] = useState(500);
    const [maxSpeed, setMaxSpeed] = useState(3000);
    const [minPower, setMinPower] = useState(10);
    const [maxPower, setMaxPower] = useState(80);
    const [gridSize, setGridSize] = useState(5); // 5x5
    const [mode, setMode] = useState<'cut' | 'fill'>('cut');

    const generateGrid = () => {
        const gcode = [
            '; Laser Test Pattern',
            'G21', // mm
            'G90', // absolute
            'M5',
            `G0 Z0`, // assumes Z0
        ];

        const cellSize = 10; // 10mm squares
        const spacing = 2; // 2mm gap
        const stepX = (maxSpeed - minSpeed) / (gridSize - 1);
        const stepY = (maxPower - minPower) / (gridSize - 1);

        // X Axis = Speed
        // Y Axis = Power

        for (let row = 0; row < gridSize; row++) {
            const power = minPower + (row * stepY);
            // Invert row so high power is at top or bottom? Let's do bottom-up (Y+)
            // Usually test grid 0,0 is bottom left

            for (let col = 0; col < gridSize; col++) {
                const speed = minSpeed + (col * stepX);

                const x = col * (cellSize + spacing);
                const y = row * (cellSize + spacing);

                gcode.push(`; Cell ${col},${row}: S${Math.floor(speed)} mm/min, P${Math.floor(power)}%`);
                // Calculate PWM S-value (assuming 1000 max)
                const sVal = Math.floor((power / 100) * 1000);

                gcode.push(`M3 S${sVal}`);

                if (mode === 'cut') {
                    // Draw square contour
                    gcode.push(`G0 X${x} Y${y}`); // Move to start
                    gcode.push(`G1 X${x + cellSize} Y${y} F${speed}`);
                    gcode.push(`G1 X${x + cellSize} Y${y + cellSize} F${speed}`);
                    gcode.push(`G1 X${x} Y${y + cellSize} F${speed}`);
                    gcode.push(`G1 X${x} Y${y} F${speed}`);
                } else {
                    // Fill (ZigZag)
                    const fillStep = 0.5; // 0.5mm stepover
                    gcode.push(`G0 X${x} Y${y}`);
                    for (let fy = 0; fy < cellSize; fy += fillStep) {
                        // Scan line
                        const startX = x;
                        const endX = x + cellSize;
                        const currentY = y + fy;

                        // Simple One-Way raster for now
                        gcode.push(`G0 X${startX} Y${currentY}`); // Rapid back
                        gcode.push(`G1 X${endX} Y${currentY} F${speed}`); // Cut fwd
                    }
                }
                gcode.push('M5'); // Off between cells
            }
        }

        gcode.push('M5');
        gcode.push('G0 X0 Y0');

        onGenerate(gcode.join('\n'));
    };

    return (
        <div className="bg-black/30 p-4 rounded border border-white/10 text-sm space-y-4">
            <h3 className="font-semibold text-gray-300 flex items-center gap-2">
                <Table size={16} /> Test Generator
            </h3>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-gray-500 text-xs">Rows/Cols</label>
                    <input
                        type="number"
                        value={gridSize}
                        onChange={e => setGridSize(Number(e.target.value))}
                        className="w-full bg-black border border-gray-700 rounded p-1 text-white"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-gray-500 text-xs">Mode</label>
                    <select
                        value={mode}
                        onChange={e => setMode(e.target.value as 'cut' | 'fill')}
                        className="w-full bg-black border border-gray-700 rounded p-1 text-white"
                    >
                        <option value="cut">Line (Cut)</option>
                        <option value="fill">Fill (Engrave)</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-gray-500 text-xs">Speed (mm/min)</label>
                    <div className="flex gap-1">
                        <input value={minSpeed} onChange={e => setMinSpeed(Number(e.target.value))} className="w-1/2 bg-black border border-gray-700 rounded p-1 text-white" placeholder="Min" />
                        <input value={maxSpeed} onChange={e => setMaxSpeed(Number(e.target.value))} className="w-1/2 bg-black border border-gray-700 rounded p-1 text-white" placeholder="Max" />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-gray-500 text-xs">Power (%)</label>
                    <div className="flex gap-1">
                        <input value={minPower} onChange={e => setMinPower(Number(e.target.value))} className="w-1/2 bg-black border border-gray-700 rounded p-1 text-white" placeholder="Min" />
                        <input value={maxPower} onChange={e => setMaxPower(Number(e.target.value))} className="w-1/2 bg-black border border-gray-700 rounded p-1 text-white" placeholder="Max" />
                    </div>
                </div>
            </div>

            <button
                onClick={generateGrid}
                className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded font-medium shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
            >
                <Zap size={16} /> Generate Test Grid
            </button>
        </div>
    );
};

export default TestGeneratorPanel;
