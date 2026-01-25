import React from 'react';
import { Text, Grid } from '@react-three/drei';
import * as THREE from 'three';

interface MachineBedProps {
    limits?: {
        x: { min: number, max: number };
        y: { min: number, max: number };
        z: { min: number, max: number };
    };
}

const MachineBed: React.FC<MachineBedProps> = ({ limits }) => {
    // defaults
    const xMax = limits?.x?.max || 200;
    const yMax = limits?.y?.max || 200;

    return (
        <group>
            {/* Outer Grid: 10cm (100 units) spacing - Lowered slightly to avoid z-fighting */}
            <Grid
                position={[xMax / 2, yMax / 2, -0.05]}
                args={[xMax, yMax]}
                rotation={[Math.PI / 2, 0, 0]}
                cellSize={50}
                sectionSize={100}
                sectionColor="#003366"
                cellColor="#003366"
                sectionThickness={1.0}
                cellThickness={0.6}
                infiniteGrid
                fadeDistance={1200}
            />

            {/* Inner Precision Grid: 2cm (20 units) spacing - Only inside bed */}
            <Grid
                position={[xMax / 2, yMax / 2, 0.1]} // Slightly raised
                args={[xMax, yMax]}
                rotation={[Math.PI / 2, 0, 0]}
                cellSize={50}
                sectionSize={100}
                sectionColor="#06b6d4" // Cyan sections
                cellColor="#1e3a8a"   // Dark blue cells
                sectionThickness={1.0}
                cellThickness={0.5}
                infiniteGrid={false}  // Constrained to args
            />

            {/* Physical Bed Plate visualization (Light Grey Background) */}
            <mesh position={[xMax / 2, yMax / 2, -0.5]} receiveShadow>
                <planeGeometry args={[xMax, yMax]} />
                <meshStandardMaterial color="#e5e7eb" roughness={0.5} metalness={0.1} />
            </mesh>

            {/* Axes Labels */}
            <Text position={[xMax + 10, 0, 0]} fontSize={10} color="red">X</Text>
            <Text position={[0, yMax + 10, 0]} fontSize={10} color="green">Y</Text>

            {/* Bed Border - Neon Blue Glow */}
            <lineSegments position={[xMax / 2, yMax / 2, 0]}>
                <edgesGeometry args={[new THREE.BoxGeometry(xMax, yMax, 1)]} />
                <lineBasicMaterial color="#06b6d4" linewidth={2} toneMapped={false} />
            </lineSegments>

            {/* Origin Marker */}
            <axesHelper args={[20]} />
        </group>
    );
};

export default MachineBed;
