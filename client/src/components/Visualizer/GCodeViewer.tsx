import React, { useMemo } from 'react';
import * as THREE from 'three';

interface GCodeViewerProps {
    gcode: string[];
}

const GCodeViewer: React.FC<GCodeViewerProps> = ({ gcode }) => {
    const { moves, cuts } = useMemo(() => {
        const moves: THREE.Vector3[] = [];
        const cuts: THREE.Vector3[] = [];

        let cx = 0, cy = 0, cz = 0;
        let isCut = false;

        // Simple G-code parser for visualization
        gcode.forEach(line => {
            const parts = line.toUpperCase().split(' ');
            let hasMove = false;

            // Check G0/G1
            if (line.includes('G0')) isCut = false;
            else if (line.includes('G1') || line.includes('G2') || line.includes('G3')) isCut = true;

            parts.forEach(p => {
                if (p.startsWith('X')) { cx = parseFloat(p.substring(1)); hasMove = true; }
                if (p.startsWith('Y')) { cy = parseFloat(p.substring(1)); hasMove = true; }
                if (p.startsWith('Z')) { cz = parseFloat(p.substring(1)); hasMove = true; }
            });

            if (hasMove) {
                const pt = new THREE.Vector3(cx, cy, cz);
                if (isCut) {
                    cuts.push(pt);
                    // To make line segments we need pairs. 
                    // This is simplified: THREE.Line expects continuous points.
                    // For LineSegments (better perf), we need start/end pairs. 
                    // This logic assumes continuous line strip for simplicity in this prototype.
                } else {
                    moves.push(pt);
                }
            }
        });

        // Convert point lists to buffered geometries? 
        // For now, let's just return raw points and use <line>
        return { moves, cuts };
    }, [gcode]);

    if (!gcode || gcode.length === 0) return null;

    return (
        <group>
            {/* Cuts: Red */}
            {cuts.length > 0 && (
                <line>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={cuts.length}
                            array={new Float32Array(cuts.flatMap(v => [v.x, v.y, v.z]))}
                            itemSize={3}
                            args={[new Float32Array(cuts.flatMap(v => [v.x, v.y, v.z])), 3]}
                        />
                    </bufferGeometry>
                    <lineBasicMaterial color="red" linewidth={2} />
                </line>
            )}

            {/* Moves: Blue/Transparent */}
            {moves.length > 0 && (
                <line>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={moves.length}
                            array={new Float32Array(moves.flatMap(v => [v.x, v.y, v.z]))}
                            itemSize={3}
                            args={[new Float32Array(moves.flatMap(v => [v.x, v.y, v.z])), 3]}
                        />
                    </bufferGeometry>
                    <lineBasicMaterial color="blue" opacity={0.3} transparent />
                </line>
            )}
        </group>
    );
};

export default GCodeViewer;
