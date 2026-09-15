import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface HolographicLabProps {
  isHovered: boolean;
  isClicked: boolean;
}

// --- 1. 3D Neural Network Nodes & Connecting Lines ---
const NeuralNetwork: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null!);

  const { nodes, linePoints } = useMemo(() => {
    const numNodes = 18;
    const nodePositions: [number, number, number][] = [];

    for (let i = 0; i < numNodes; i++) {
      const x = (Math.random() - 0.5) * 7;
      const y = (Math.random() - 0.5) * 5 + 0.5;
      const z = (Math.random() - 0.5) * 4 - 1.5;
      nodePositions.push([x, y, z]);
    }

    // Connect nodes within a distance threshold
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < numNodes; i++) {
      for (let j = i + 1; j < numNodes; j++) {
        const p1 = new THREE.Vector3(...nodePositions[i]);
        const p2 = new THREE.Vector3(...nodePositions[j]);
        if (p1.distanceTo(p2) < 2.8) {
          points.push(p1, p2);
        }
      }
    }

    return { nodes: nodePositions, linePoints: points };
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.05;
      groupRef.current.position.y = Math.sin(time * 0.8) * 0.05;
    }
  });

  const lineGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(linePoints);
    return geom;
  }, [linePoints]);

  return (
    <group ref={groupRef}>
      {/* Nodes Spheres */}
      {nodes.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial
            color="#00f0ff"
            emissive="#00e5ff"
            emissiveIntensity={3.0}
          />
        </mesh>
      ))}

      {/* Connecting Neural Lines */}
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color="#00aaff" transparent opacity={0.35} />
      </lineSegments>
    </group>
  );
};

// --- 2. 3D Floating Glass UI Chat Panels & Waveform ---
const FloatingUIPanels: React.FC<{ isHovered: boolean }> = ({ isHovered }) => {
  const panelLeftRef = useRef<THREE.Group>(null!);
  const panelRightRef = useRef<THREE.Group>(null!);
  const brainRef = useRef<THREE.Group>(null!);
  const waveBarsRef = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (panelLeftRef.current) {
      panelLeftRef.current.position.y = 0.8 + Math.sin(time * 1.2) * 0.08;
      panelLeftRef.current.rotation.y = 0.25 + Math.sin(time * 0.6) * 0.04;
      const scale = isHovered ? 1.12 : 1.0;
      panelLeftRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), delta * 4);
    }

    if (panelRightRef.current) {
      panelRightRef.current.position.y = -0.1 + Math.cos(time * 1.4) * 0.08;
      panelRightRef.current.rotation.y = -0.3 + Math.cos(time * 0.7) * 0.04;
    }

    if (brainRef.current) {
      brainRef.current.rotation.y = time * 0.4;
      brainRef.current.position.y = 1.4 + Math.sin(time * 1.0) * 0.06;
    }

    // Voice Waveform Bar Heights Animation
    if (waveBarsRef.current) {
      waveBarsRef.current.children.forEach((bar, idx) => {
        const height = 0.15 + Math.sin(time * 8.0 + idx * 0.8) * 0.12;
        bar.scale.set(1, height * 5, 1);
      });
    }
  });

  return (
    <>
      {/* LEFT UI PANEL: "Avo AI Neural Core" */}
      <group ref={panelLeftRef} position={[-2.4, 0.8, -0.2]} rotation={[0, 0.25, 0]}>
        {/* Glass Card Base */}
        <mesh>
          <planeGeometry args={[1.7, 1.1]} />
          <meshPhysicalMaterial
            color="#0f172a"
            transparent
            opacity={0.65}
            roughness={0.1}
            transmission={0.85}
            ior={1.4}
          />
        </mesh>
        {/* Glowing Border Frame */}
        <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(1.7, 1.1)]} />
          <lineBasicMaterial color="#00f0ff" transparent opacity={0.6} />
        </lineSegments>

        {/* Text Headers */}
        <Text
          position={[-0.72, 0.38, 0.02]}
          fontSize={0.085}
          color="#38bdf8"
          anchorX="left"
          anchorY="middle"
        >
          AVO AI CORE • ACTIVE
        </Text>
        <Text
          position={[-0.72, 0.22, 0.02]}
          fontSize={0.065}
          color="#ffffff"
          anchorX="left"
          anchorY="middle"
        >
          Context Synthesis: 1M Tokens
        </Text>
        <Text
          position={[-0.72, 0.08, 0.02]}
          fontSize={0.055}
          color="#94a3b8"
          anchorX="left"
          anchorY="middle"
        >
          Latency: 8.4ms • Precision 99.9%
        </Text>

        {/* Mini 3D Voice Waveform Bar Visualizer */}
        <group ref={waveBarsRef} position={[-0.5, -0.22, 0.02]}>
          {[...Array(12)].map((_, i) => (
            <mesh key={i} position={[i * 0.09, 0, 0]}>
              <boxGeometry args={[0.04, 0.12, 0.01]} />
              <meshStandardMaterial color="#00f0ff" emissive="#00e5ff" emissiveIntensity={2.5} />
            </mesh>
          ))}
        </group>
      </group>

      {/* RIGHT UI PANEL: "Floating Chat Bubble" */}
      <group ref={panelRightRef} position={[2.3, -0.1, -0.1]} rotation={[0, -0.3, 0]}>
        {/* Glass Card Base */}
        <mesh>
          <planeGeometry args={[1.8, 1.0]} />
          <meshPhysicalMaterial
            color="#0f172a"
            transparent
            opacity={0.7}
            roughness={0.1}
            transmission={0.85}
            ior={1.4}
          />
        </mesh>
        {/* Glowing Border Frame */}
        <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(1.8, 1.0)]} />
          <lineBasicMaterial color="#38bdf8" transparent opacity={0.6} />
        </lineSegments>

        <Text
          position={[-0.76, 0.3, 0.02]}
          fontSize={0.08}
          color="#00f0ff"
          anchorX="left"
          anchorY="middle"
        >
          {"💬 How can Avo help?"}
        </Text>

        <Text
          position={[-0.76, 0.1, 0.02]}
          fontSize={0.055}
          color="#f8fafc"
          anchorX="left"
          anchorY="middle"
        >
          {"\"Build a full-stack React app with 3D Canvas\""}
        </Text>

        <Text
          position={[-0.76, -0.12, 0.02]}
          fontSize={0.05}
          color="#38bdf8"
          anchorX="left"
          anchorY="middle"
        >
          {"⚡ Generating code • Ready to deploy"}
        </Text>
      </group>

      {/* 3D AI BRAIN HOLOGRAM (Floating Orbiting Wireframe Icosahedron) */}
      <group ref={brainRef} position={[2.2, 1.4, -1.0]}>
        <mesh>
          <icosahedronGeometry args={[0.42, 2]} />
          <meshStandardMaterial
            color="#00f0ff"
            wireframe
            emissive="#00e5ff"
            emissiveIntensity={2.8}
            transparent
            opacity={0.7}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3.5} />
        </mesh>
      </group>
    </>
  );
};

// --- 3. FUTURISTIC CIRCULAR STAGE & DIGITAL GRID FLOOR ---
const PlatformStage: React.FC = () => {
  const ring1Ref = useRef<THREE.Group>(null!);
  const ring2Ref = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (ring1Ref.current) ring1Ref.current.rotation.y = time * 0.12;
    if (ring2Ref.current) ring2Ref.current.rotation.y = -time * 0.18;
  });

  return (
    <group position={[0, -1.65, 0]}>
      {/* Main Center Circular Stage Base */}
      <mesh receiveShadow position={[0, -0.1, 0]}>
        <cylinderGeometry args={[2.8, 3.2, 0.22, 64]} />
        <meshStandardMaterial color="#020617" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Top Mirror Reflective Glass Surface */}
      <mesh receiveShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[2.75, 2.75, 0.02, 64]} />
        <meshPhysicalMaterial
          color="#0f172a"
          roughness={0.05}
          metalness={0.95}
          clearcoat={1.0}
          clearcoatRoughness={0.02}
          reflectivity={1.0}
        />
      </mesh>

      {/* Outer Illuminated Cyan Perimeter LED Ring */}
      <mesh position={[0, 0.03, 0]}>
        <torusGeometry args={[2.78, 0.025, 16, 100]} />
        <meshStandardMaterial color="#00f0ff" emissive="#00e5ff" emissiveIntensity={3.5} />
      </mesh>

      {/* Orbiting Laser Projection Rings on Stage */}
      <group ref={ring1Ref} position={[0, 0.04, 0]} rotation={[0, 0, 0]}>
        <mesh>
          <torusGeometry args={[2.1, 0.015, 12, 80]} />
          <meshStandardMaterial color="#38bdf8" emissive="#00f0ff" emissiveIntensity={2.5} />
        </mesh>
      </group>

      <group ref={ring2Ref} position={[0, 0.05, 0]} rotation={[0, 0, 0]}>
        <mesh>
          <torusGeometry args={[1.4, 0.015, 12, 64]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.5} />
        </mesh>
      </group>

      {/* Digital Grid Ground Plane */}
      <gridHelper args={[24, 32, '#00f0ff', '#1e293b']} position={[0, -0.12, 0]} />
    </group>
  );
};

// --- 4. BOKEH PARTICLES FIELD ---
const FloatingParticles: React.FC<{ count?: number }> = ({ count = 110 }) => {
  const pointsRef = useRef<THREE.Points>(null!);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const cyan = new THREE.Color('#00f0ff');
    const white = new THREE.Color('#ffffff');
    const blue = new THREE.Color('#38bdf8');

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10 + 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 1;

      const rand = Math.random();
      const mixed = rand > 0.6 ? cyan : rand > 0.3 ? blue : white;
      col[i * 3] = mixed.r;
      col[i * 3 + 1] = mixed.g;
      col[i * 3 + 2] = mixed.b;
    }

    return { positions: pos, colors: col };
  }, [count]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.02;
      const positionsAttr = pointsRef.current.geometry.attributes.position;
      for (let i = 0; i < count; i++) {
        let y = positionsAttr.getY(i);
        y += Math.sin(time + i) * 0.0015;
        positionsAttr.setY(i, y);
      }
      positionsAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.11}
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

export const HolographicLab: React.FC<HolographicLabProps> = ({ isHovered }) => {
  return (
    <>
      <PlatformStage />
      <NeuralNetwork />
      <FloatingUIPanels isHovered={isHovered} />
      <FloatingParticles />
    </>
  );
};
