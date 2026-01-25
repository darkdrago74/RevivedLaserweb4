import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BackgroundLaserProps {
    delay?: number;
}

export const BackgroundLaser = ({ delay = 0 }: BackgroundLaserProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const beamRef = useRef<THREE.Mesh>(null);

    const particlesRef = useRef<THREE.Points>(null);

    // Animation State
    const [cycleState, setCycleState] = useState<'HIDDEN' | 'FADE_IN' | 'VISIBLE' | 'FADE_OUT'>('HIDDEN');
    const timer = useRef(0);
    const opacity = useRef(0);
    const initialDelay = useRef(delay);

    // Constants
    const CYCLE_Duration = {
        HIDDEN: 2.0,
        FADE_IN: 1.0,
        VISIBLE: 3.0,
        FADE_OUT: 1.5
    };

    // Particles Data
    const particleCount = 20; // Reduced count
    const particlesGeometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        // Spread particles along a long line (Y-axis to match Cylinder default)
        // Cylinder default is Y-axis. We rotate group Z=90 to make it Horizontal.
        // So particles should be spread along Y-axis to match cylinder geometry space.
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20; // X Scatter (Width)
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2000; // Y Length (Along beam)
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20; // Z Scatter (Height)
            sizes[i] = Math.random() * 3;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        return geo;
    }, []);

    useFrame((_, delta) => {
        // Handle Initial Delay
        if (initialDelay.current > 0) {
            initialDelay.current -= delta;
            return;
        }

        timer.current += delta;

        switch (cycleState) {
            case 'HIDDEN':
                opacity.current = 0;
                if (timer.current > CYCLE_Duration.HIDDEN) {
                    // Start new cycle: Randomize Position/Rotation
                    if (groupRef.current) {
                        groupRef.current.position.set(0, 0, -200); // Behind bed
                        groupRef.current.rotation.z = Math.random() * Math.PI * 2;

                        // Random offset
                        const offsetX = (Math.random() - 0.5) * 200;
                        const offsetY = (Math.random() - 0.5) * 200;
                        groupRef.current.position.x += offsetX;
                        groupRef.current.position.y += offsetY;
                    }
                    timer.current = 0;
                    setCycleState('FADE_IN');
                }
                break;

            case 'FADE_IN':
                opacity.current = Math.min(1, timer.current / CYCLE_Duration.FADE_IN);
                if (timer.current > CYCLE_Duration.FADE_IN) {
                    timer.current = 0;
                    setCycleState('VISIBLE');
                }
                break;

            case 'VISIBLE':
                opacity.current = 1;
                if (timer.current > CYCLE_Duration.VISIBLE) {
                    timer.current = 0;
                    setCycleState('FADE_OUT');
                }
                break;

            case 'FADE_OUT':
                opacity.current = Math.max(0, 1 - (timer.current / CYCLE_Duration.FADE_OUT));
                if (timer.current > CYCLE_Duration.FADE_OUT) {
                    timer.current = 0;
                    setCycleState('HIDDEN');
                }
                break;
        }

        // 2. Particle Animation (Sliding)
        if (particlesRef.current && cycleState !== 'HIDDEN') {
            const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
            const speed = 20 * delta; // Speed of sliding

            for (let i = 0; i < particleCount; i++) {
                // Y-axis is along the beam length (local space)
                positions[i * 3 + 1] += speed;

                // Loop particles when they reach end
                if (positions[i * 3 + 1] > 1000) {
                    positions[i * 3 + 1] = -1000;
                }
            }
            particlesRef.current.geometry.attributes.position.needsUpdate = true;
        }

        // 3. Apply Opacity
        if (beamRef.current) {
            (beamRef.current.material as THREE.Material).opacity = opacity.current; // Core is solid
        }

        if (particlesRef.current) {
            (particlesRef.current.material as THREE.Material).opacity = opacity.current;
        }
    });

    return (
        <group ref={groupRef}>
            {/* The Single Beam */}
            <mesh ref={beamRef} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.6, 0.6, 2000, 16]} />
                <meshBasicMaterial
                    color="#00FFFF" // Cyan for visibility
                    transparent
                    opacity={0}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Particles along the beam - Rotated to match Cylinder */}
            <points ref={particlesRef} geometry={particlesGeometry} rotation={[0, 0, Math.PI / 2]}>
                <pointsMaterial
                    size={3}
                    color="#00ffff"
                    transparent
                    opacity={0}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    sizeAttenuation={true}
                />
            </points>
        </group>
    );
};
