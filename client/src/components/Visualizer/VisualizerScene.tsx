import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, OrthographicCamera } from '@react-three/drei';
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
    machineSettings?: any;
}

const VisualizerScene: React.FC<VisualizerSceneProps> = ({ machinePos, limits, gcode = [], laserBeamEnabled = true, machineSettings }) => {
    const [is2D, setIs2D] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate Bed Center
    const xMax = limits?.x?.max || 200;
    const yMax = limits?.y?.max || 200;

    // Mapped Center in World Space (Rotated -90 X)
    // CNC (x, y, 0) -> World (x, 0, y)
    const centerWorld = [xMax / 2, 0, yMax / 2] as [number, number, number];

    const origin = machineSettings?.workbench?.origin || 'bottom-left';

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
                        // Top-Down View: Look from +Y (World Up) down to XZ Plane
                        position={[centerWorld[0], 1000, centerWorld[2]]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        zoom={10}
                        near={-5000}
                        far={5000}
                        up={[0, 0, -1]} // Adjust up vector for 2D orientation if needed
                    />
                ) : (
                    <PerspectiveCamera
                        key="3d-cam"
                        makeDefault
                        // Isometric: Center X, High Y (Up), Positive Z (Front)
                        position={[xMax / 2, Math.max(xMax, yMax) * 1.5, yMax * 1.5]}
                        up={[0, 1, 0]} // Standard Three.js Up
                        fov={45}
                        near={1}
                        far={5000}
                    />
                )}

                <OrbitControls
                    key={is2D ? '2d-controls' : '3d-controls'}
                    makeDefault
                    target={centerWorld}
                    enableRotate={!is2D}
                    enableZoom={true}
                    enablePan={true}
                    minDistance={10}
                    maxDistance={2000}
                />

                <ambientLight intensity={0.5} />
                <pointLight position={[100, 200, 100]} intensity={0.8} />

                {/* Post Processing */}
                <EffectComposer enableNormalPass={false}>
                    <Bloom
                        luminanceThreshold={1}
                        mipmapBlur
                        intensity={2.5}
                        radius={0.8}
                    />
                </EffectComposer>

                {/* Background Laser Animation (Screen Space or World Space?) - Keep as is for now */}
                {laserBeamEnabled && (
                    <>
                        <BackgroundLaser delay={0} />
                        <BackgroundLaser delay={3.5} />
                    </>
                )}

                {/* ROTATE ENTIRE CONTENT TO MAP CNC-Z TO WORLD-Y */}
                <group rotation={[-Math.PI / 2, 0, 0]}>
                    <MachineBed
                        limits={limits}
                        visible={machineSettings?.workbench?.showWorkbench}
                        origin={origin}
                        axesSettings={machineSettings?.axes}
                    />
                    <MachineHead x={machinePos.x} y={machinePos.y} z={machinePos.z} />
                    <GCodeViewer gcode={gcode} />
                </group>
            </Canvas>

            {/* View Toggle & Controls */}
            <div className="absolute top-2 left-2 flex flex-col gap-2 pointer-events-none">
                <div className="text-[10px] text-gray-500 font-mono bg-black/50 p-1 rounded">
                    <p>Pan: Right-Click</p>
                    <p>Rotate: Left-Click</p>
                    <p>Zoom: Scroll</p>
                </div>
            </div>

            <div className="absolute top-2 left-[120px] pointer-events-auto flex flex-col gap-2">
                <button
                    onClick={() => setIs2D(!is2D)}
                    className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 shadow-md font-bold"
                >
                    {is2D ? 'SWITCH TO 3D' : 'SWITCH TO 2D'}
                </button>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 shadow-md font-bold"
                >
                    RESET VIEW
                </button>
            </div>
        </div>
    );
};

export default VisualizerScene;
