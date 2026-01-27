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

    // Dimensions from Settings (Priority) or Limits (Fallback)
    const width = machineSettings?.workbench?.width || limits?.x?.max || 200;
    const height = machineSettings?.workbench?.height || limits?.y?.max || 200;
    const origin = machineSettings?.workbench?.origin || 'bottom-left';

    // Calculate Offset based on Origin (Matches MachineBed logic)
    // This determines the geometric center of the bed in CNC coordinates (relative to Origin 0,0)
    let centerX = width / 2;
    let centerY = height / 2;

    if (origin === 'top-left') {
        centerX = width / 2;
        centerY = -height / 2;
    } else if (origin === 'top-right') {
        centerX = -width / 2;
        centerY = -height / 2;
    } else if (origin === 'bottom-right') {
        centerX = -width / 2;
        centerY = height / 2;
    }

    // Map CNC Center (x, y, 0) to World Space (x, 0, y) due to -90deg X rotation of the group
    // Correction: -90deg rotation maps CNC +Y to World -Z. So CNC -150 becomes World +150.
    const centerWorld = [centerX, 0, -centerY] as [number, number, number];

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
                        up={[0, 0, -1]}
                    />
                ) : (
                    <PerspectiveCamera
                        key="3d-cam"
                        makeDefault
                        // Isometric: Center + Offset
                        position={[centerX, Math.max(width, height) * 1.5, -centerY + Math.max(width, height) * 1.5]}
                        up={[0, 1, 0]}
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

                {/* Background Laser Animation */}
                {laserBeamEnabled && (
                    <>
                        {/* Sky Lasers (Vertical Rain) - "Wall" at Y=1000 (Z=-1000), X +/- 1000, Y +2500 to -3500 */}
                        <group position={[0, -500, -1000]}>
                            <BackgroundLaser delay={0} spawnMode="vertical" height={6000} xRange={2000} zRange={100} particleSize={9} />
                            <BackgroundLaser delay={3.5} spawnMode="vertical" height={6000} xRange={2000} zRange={100} particleSize={9} />
                        </group>

                        {/* Bed Lasers (Flat on Floor) - Y=-20mm */}
                        <group position={[0, -20, 0]}>
                            <BackgroundLaser delay={1.5} spawnMode="flat" xRange={width || 300} zRange={height || 300} />
                            <BackgroundLaser delay={5.0} spawnMode="flat" xRange={width || 300} zRange={height || 300} />
                        </group>
                    </>
                )}

                {/* ROTATE ENTIRE CONTENT TO MAP CNC-Z TO WORLD-Y */}
                <group rotation={[-Math.PI / 2, 0, 0]}>
                    <MachineBed
                        limits={limits}
                        width={width}
                        height={height}
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
                    RECENTER VIEW
                </button>
            </div>
        </div>
    );
};

export default VisualizerScene;
