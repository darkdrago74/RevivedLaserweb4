import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, OrthographicCamera, Bounds } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import MachineBed from './MachineBed';
import MachineHead from './MachineHead';
import GCodeViewer from './GCodeViewer';
import { BackgroundLaser } from './BackgroundLaser';

interface VisualizerSceneProps {
    machinePos: { x: number, y: number, z: number };
    limits?: {
        x: { min: number, max: number };
        y: { min: number, max: number };
        z: { min: number, max: number };
    };
    gcode?: string[];
    laserBeamEnabled?: boolean;
}

const VisualizerScene: React.FC<VisualizerSceneProps> = ({ machinePos, limits, gcode = [], laserBeamEnabled = true }) => {
    const [is2D, setIs2D] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate Bed Center for Auto-Fit
    const xMax = limits?.x?.max || 200;
    const yMax = limits?.y?.max || 200;
    const center = [xMax / 2, yMax / 2, 0] as [number, number, number];

    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-gray-900 rounded-lg overflow-hidden border border-white/10 shadow-inner relative"
        >
            <Canvas>
                {is2D ? (
                    <OrthographicCamera
                        key="2d-cam-final"
                        makeDefault
                        position={[center[0], center[1], 1000]}
                        rotation={[0, 0, 0]}
                        zoom={10} // Bounds will override
                        near={-5000}
                        far={5000}
                        up={[0, 1, 0]}
                    />
                ) : (
                    <PerspectiveCamera
                        key="3d-cam"
                        makeDefault
                        position={[xMax / 2, -yMax, yMax * 1.5]}
                        up={[0, 0, 1]}
                    />
                )}

                <OrbitControls
                    key={is2D ? '2d-controls' : '3d-controls'}
                    makeDefault
                    target={center}
                    enableRotate={!is2D}
                    enableZoom={true}
                    enablePan={true}
                />

                <ambientLight intensity={0.5} />
                <pointLight position={[100, 100, 100]} intensity={1} />

                {/* Post Processing for Glow */}
                <EffectComposer enableNormalPass={false}>
                    <Bloom
                        luminanceThreshold={1} // Only very bright things glow
                        mipmapBlur
                        intensity={2.5}
                        radius={0.8}
                    />
                </EffectComposer>

                {/* Background Laser Animation */}
                {laserBeamEnabled && (
                    <>
                        <BackgroundLaser delay={0} />
                        <BackgroundLaser delay={3.5} />
                    </>
                )}

                <Bounds fit={is2D} clip={is2D} observe={is2D} margin={1.2}>
                    <MachineBed limits={limits} />
                    <MachineHead x={machinePos.x} y={machinePos.y} z={machinePos.z} />
                    <GCodeViewer gcode={gcode} />
                </Bounds>
            </Canvas>

            {/* View Toggle & Controls */}
            <div className="absolute top-2 left-2 flex flex-col gap-2 pointer-events-none">
                <div className="text-[10px] text-gray-500 font-mono bg-black/50 p-1 rounded">
                    <p>Pan: Right-Click</p>
                    <p>Rotate: Left-Click</p>
                    <p>Zoom: Scroll</p>
                </div>
            </div>

            <div className="absolute top-2 left-[120px] pointer-events-auto">
                <button
                    onClick={() => setIs2D(!is2D)}
                    className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 shadow-md font-bold"
                >
                    {is2D ? 'SWITCH TO 3D' : 'SWITCH TO 2D'}
                </button>
            </div>
        </div>
    );
};

export default VisualizerScene;
