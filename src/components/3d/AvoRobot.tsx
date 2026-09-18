import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

interface AvoRobotProps {
  isHovered: boolean;
  isClicked: boolean;
  onRobotClick?: () => void;
  theme?: 'black' | 'white';
}

export const AvoRobot: React.FC<AvoRobotProps> = ({
  isHovered,
  isClicked,
  onRobotClick,
  theme = 'black',
}) => {
  const isBlackTheme = theme === 'black';

  // Main References
  const robotGroupRef = useRef<THREE.Group>(null!);
  const headGroupRef = useRef<THREE.Group>(null!);
  const chestGroupRef = useRef<THREE.Group>(null!);
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const rightHandRef = useRef<THREE.Group>(null!);
  
  // Materials & Glow Refs
  const eyeMaterialRef = useRef<THREE.MeshStandardMaterial>(null!);
  const smileMaterialRef = useRef<THREE.MeshStandardMaterial>(null!);
  const coreMaterialRef = useRef<THREE.MeshStandardMaterial>(null!);
  const logoMaterialRef = useRef<THREE.MeshStandardMaterial>(null!);
  const coreOctaRef = useRef<THREE.Mesh>(null!);
  const coreRing1Ref = useRef<THREE.Mesh>(null!);
  const coreRing2Ref = useRef<THREE.Mesh>(null!);
  
  // Wave shockwave ring animation
  const shockwaveRef = useRef<THREE.Mesh>(null!);
  const shockwaveScale = useRef<number>(0);
  const shockwaveOpacity = useRef<number>(0);

  // Blinking State
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  const eyeScaleY = useRef<number>(1);

  // Mouse vector tracking
  const mouse = useRef({ x: 0, y: 0 });

  // Handle Mouse Movement (throttled with rAF)
  useEffect(() => {
    let animId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (animId !== null) return;
      animId = window.requestAnimationFrame(() => {
        mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        animId = null;
      });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animId !== null) window.cancelAnimationFrame(animId);
    };
  }, []);

  // Blinking Animation Loop
  useEffect(() => {
    let blinkTimeout: ReturnType<typeof setTimeout> | null = null;
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      blinkTimeout = setTimeout(() => setIsBlinking(false), 180);
    }, 3800);
    return () => {
      clearInterval(blinkInterval);
      if (blinkTimeout) clearTimeout(blinkTimeout);
    };
  }, []);

  // Trigger Wave Shockwave on Click
  useEffect(() => {
    if (isClicked) {
      shockwaveScale.current = 0.1;
      shockwaveOpacity.current = 1.0;
    }
  }, [isClicked]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // 1. Blinking Logic
    const targetEyeScaleY = isBlinking ? 0.05 : 1;
    eyeScaleY.current = THREE.MathUtils.lerp(eyeScaleY.current, targetEyeScaleY, delta * 25);

    // 2. Head & Eye Cursor Tracking (Damped smooth rotation within max ~12 degrees)
    if (headGroupRef.current) {
      const targetHeadY = mouse.current.x * 0.28;
      const targetHeadX = -mouse.current.y * 0.22;
      headGroupRef.current.rotation.y = THREE.MathUtils.lerp(headGroupRef.current.rotation.y, targetHeadY, delta * 3.5);
      headGroupRef.current.rotation.x = THREE.MathUtils.lerp(headGroupRef.current.rotation.x, targetHeadX, delta * 3.5);
      
      // Subtle head tilt
      headGroupRef.current.rotation.z = Math.sin(time * 0.8) * 0.02 + mouse.current.x * 0.03;
    }

    // 3. Body Torso Motion & Gentle Breathing & Subtle Sway
    if (robotGroupRef.current) {
      // Breathing vertical rise/fall
      const breathingY = Math.sin(time * 1.5) * 0.06;
      robotGroupRef.current.position.y = -0.12 + breathingY;
      
      // Slight torso rotation toward cursor
      robotGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        robotGroupRef.current.rotation.y,
        mouse.current.x * 0.12,
        delta * 2.0
      );
    }

    // 4. Chest Group Expansion on Breathing
    if (chestGroupRef.current) {
      const chestScale = 1 + Math.sin(time * 1.5) * 0.012;
      chestGroupRef.current.scale.set(chestScale, chestScale, chestScale);
    }

    // 5. Holographic Core Reactor Animation
    if (coreOctaRef.current) {
      coreOctaRef.current.rotation.x = time * 0.8;
      coreOctaRef.current.rotation.y = time * 1.2;
    }
    if (coreRing1Ref.current && coreRing2Ref.current) {
      coreRing1Ref.current.rotation.x = time * 1.5;
      coreRing1Ref.current.rotation.z = time * 0.8;
      coreRing2Ref.current.rotation.y = -time * 1.2;
      coreRing2Ref.current.rotation.x = time * 0.6;
    }

    // 6. Glowing LED intensity modulation (Brighten on Hover / Click)
    const baseEmissive = isHovered ? 4.5 : 3.0;
    if (eyeMaterialRef.current) {
      eyeMaterialRef.current.emissiveIntensity = baseEmissive + Math.sin(time * 3.0) * 0.6;
    }
    if (smileMaterialRef.current) {
      smileMaterialRef.current.emissiveIntensity = baseEmissive * 0.8 + Math.sin(time * 2.0) * 0.4;
    }
    if (coreMaterialRef.current) {
      coreMaterialRef.current.emissiveIntensity = (baseEmissive + 1.2) + Math.sin(time * 4.0) * 0.8;
    }
    if (logoMaterialRef.current) {
      logoMaterialRef.current.emissiveIntensity = isHovered ? 4.0 : 2.5;
    }

    // 7. ARMS & HAND POSING (Idle vs Hover Greeting vs Click Wave)
    if (leftArmRef.current) {
      // Left arm natural stance with subtle breathing
      const targetLeftZ = 0.26 + Math.sin(time * 1.2) * 0.03;
      const targetLeftX = 0.08 + Math.sin(time * 0.9) * 0.02 + mouse.current.y * 0.06;
      leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, targetLeftZ, delta * 3.0);
      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, targetLeftX, delta * 3.0);
    }

    if (rightArmRef.current) {
      let targetRightZ = -0.26;
      let targetRightX = 0.08;
      let targetRightY = 0;

      if (isClicked) {
        // Wave Animation gesture & point towards chat!
        targetRightZ = -1.2 + Math.sin(time * 12.0) * 0.25;
        targetRightX = -0.85;
        targetRightY = 0.35;
      } else if (isHovered) {
        // Raised Hand Welcoming Open Palm Greeting
        targetRightZ = -0.85;
        targetRightX = -0.65;
        targetRightY = 0.2 + mouse.current.x * 0.12;
      } else {
        // Idle
        targetRightZ = -0.26 - Math.sin(time * 1.2) * 0.03;
        targetRightX = 0.08 + mouse.current.y * 0.06;
      }

      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, targetRightZ, delta * 4.0);
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, targetRightX, delta * 4.0);
      rightArmRef.current.rotation.y = THREE.MathUtils.lerp(rightArmRef.current.rotation.y, targetRightY, delta * 4.0);
    }

    // Shockwave Ring Expanding Logic
    if (shockwaveRef.current && shockwaveOpacity.current > 0.01) {
      shockwaveScale.current += delta * 4.5;
      shockwaveOpacity.current -= delta * 1.2;
      shockwaveRef.current.scale.set(shockwaveScale.current, shockwaveScale.current, shockwaveScale.current);
      if (shockwaveRef.current.material instanceof THREE.MeshStandardMaterial) {
        shockwaveRef.current.material.opacity = Math.max(0, shockwaveOpacity.current);
      }
    }
  });

  // Color Definitions according to Theme
  const mainShellColor = isBlackTheme ? "#0a0a0d" : "#f8fafc";
  const shellRoughness = isBlackTheme ? 0.06 : 0.2;
  const shellMetalness = isBlackTheme ? 0.95 : 0.05;
  const jointColor = "#111827";
  const chromeNeckColor = "#e2e8f0";
  const eyeColor = isBlackTheme ? "#ffffff" : "#00f0ff";
  const eyeEmissive = isBlackTheme ? "#ffffff" : "#00e5ff";

  return (
    <Float speed={1.2} rotationIntensity={0.06} floatIntensity={0.22}>
      <group
        ref={robotGroupRef}
        position={[1.1, -0.12, 1.2]}
        scale={[0.95, 0.95, 0.95]}
        onClick={onRobotClick}
      >
        
        {/* --- 1. HEAD ASSEMBLY --- */}
        <group ref={headGroupRef} position={[0, 1.22, 0]}>
          
          {/* Main Piano Black Glossy Helmet Shell */}
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.56, 32, 32]} />
            <meshPhysicalMaterial
              color={mainShellColor}
              roughness={shellRoughness}
              metalness={shellMetalness}
              clearcoat={1.0}
              clearcoatRoughness={0.01}
              reflectivity={1.0}
            />
          </mesh>

          {/* Helmet Top Titanium Ridge Accent */}
          <mesh position={[0, 0.32, -0.1]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.28, 0.18, 0.62]} />
            <meshStandardMaterial color="#1f2937" roughness={0.2} metalness={0.9} />
          </mesh>

          {/* Curved Glossy Mirror-Like Visor Face Shield */}
          <mesh position={[0, 0.04, 0.22]}>
            <sphereGeometry args={[0.49, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
            <meshPhysicalMaterial
              color="#020617"
              roughness={0.01}
              metalness={0.98}
              clearcoat={1.0}
              clearcoatRoughness={0.01}
              reflectivity={1.0}
            />
          </mesh>

          {/* Small White LED Matrix Pixel Eyes (Left & Right) */}
          <group position={[0, 0.09, 0.495]}>
            {/* Left Eye Pixel Cluster */}
            <group position={[-0.18, 0, 0]} scale={[1, eyeScaleY.current, 1]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.075, 0.075, 0.02, 24]} />
                <meshStandardMaterial
                  ref={eyeMaterialRef}
                  color={eyeColor}
                  emissive={eyeEmissive}
                  emissiveIntensity={3.5}
                />
              </mesh>
              {/* Inner White High-Tech Lens Core */}
              <mesh position={[0, 0, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.035, 0.035, 0.01, 16]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={4.5} />
              </mesh>
            </group>

            {/* Right Eye Pixel Cluster */}
            <group position={[0.18, 0, 0]} scale={[1, eyeScaleY.current, 1]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.075, 0.075, 0.02, 24]} />
                <meshStandardMaterial
                  color={eyeColor}
                  emissive={eyeEmissive}
                  emissiveIntensity={3.5}
                />
              </mesh>
              {/* Inner White High-Tech Lens Core */}
              <mesh position={[0, 0, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.035, 0.035, 0.01, 16]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={4.5} />
              </mesh>
            </group>

            {/* Subtle LED Smile Arc */}
            <mesh position={[0, -0.16, -0.02]} rotation={[0.2, 0, 0]}>
              <torusGeometry args={[0.13, 0.01, 12, 32, Math.PI]} />
              <meshStandardMaterial
                ref={smileMaterialRef}
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={2.5}
              />
            </mesh>
          </group>

          {/* Lower Jaw Titanium Chin Guard */}
          <mesh position={[0, -0.34, 0.2]} castShadow>
            <cylinderGeometry args={[0.3, 0.22, 0.28, 16]} />
            <meshStandardMaterial color="#111827" roughness={0.25} metalness={0.9} />
          </mesh>

          {/* Side High-Tech Chrome Ear Pod Receptors */}
          <mesh position={[-0.58, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.14, 0.14, 0.1, 24]} />
            <meshStandardMaterial color={chromeNeckColor} roughness={0.1} metalness={0.95} />
          </mesh>
          <mesh position={[-0.6, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.12, 0.015, 12, 24]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.5} />
          </mesh>

          <mesh position={[0.58, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.14, 0.14, 0.1, 24]} />
            <meshStandardMaterial color={chromeNeckColor} roughness={0.1} metalness={0.95} />
          </mesh>
          <mesh position={[0.6, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.12, 0.015, 12, 24]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.5} />
          </mesh>
        </group>

        {/* --- 2. CHROME NECK ARTICULATED JOINTS --- */}
        <group position={[0, 0.62, 0]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.18, 0.32, 16]} />
            <meshStandardMaterial color={chromeNeckColor} roughness={0.08} metalness={0.96} />
          </mesh>
          <mesh position={[0, -0.05, 0]}>
            <torusGeometry args={[0.2, 0.02, 16, 32]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.0} />
          </mesh>
        </group>

        {/* --- 3. MATTE BLACK CHEST & CARBON-FIBER CORE TORSO --- */}
        <group ref={chestGroupRef} position={[0, -0.1, 0]}>
          
          {/* Main Triangular Matte Black Chest Armor Shell */}
          <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.18, 0.96, 0.74]} />
            <meshStandardMaterial
              color={mainShellColor}
              roughness={isBlackTheme ? 0.35 : 0.2}
              metalness={isBlackTheme ? 0.25 : 0.05}
            />
          </mesh>

          {/* Carbon Fiber Inset Panel */}
          <mesh position={[0, 0.08, 0.375]}>
            <planeGeometry args={[0.82, 0.64]} />
            <meshStandardMaterial
              color="#030712"
              roughness={0.15}
              metalness={0.9}
            />
          </mesh>

          {/* Illuminated AVO AI Logo Badge on Upper Chest */}
          <group position={[0, 0.38, 0.385]}>
            <mesh>
              <boxGeometry args={[0.42, 0.12, 0.02]} />
              <meshStandardMaterial color="#030712" roughness={0.1} metalness={0.95} />
            </mesh>
            {/* Glowing "AVO" emblem bar */}
            <mesh position={[0, 0, 0.012]}>
              <boxGeometry args={[0.32, 0.04, 0.01]} />
              <meshStandardMaterial
                ref={logoMaterialRef}
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={3.0}
              />
            </mesh>
          </group>

          {/* FLOATING HOLOGRAPHIC CORE REACTOR IN CHEST */}
          <group position={[0, 0.08, 0.38]}>
            {/* Glass Housing Orb */}
            <mesh>
              <sphereGeometry args={[0.21, 24, 24]} />
              <meshPhysicalMaterial
                color="#ffffff"
                transmission={0.92}
                roughness={0.08}
                ior={1.5}
                transparent
                opacity={0.88}
              />
            </mesh>

            {/* Floating Spinning Octahedron Core */}
            <mesh ref={coreOctaRef}>
              <octahedronGeometry args={[0.10, 0]} />
              <meshStandardMaterial
                ref={coreMaterialRef}
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={3.8}
              />
            </mesh>

            {/* Dual Orbiting Energy Rings */}
            <mesh ref={coreRing1Ref}>
              <torusGeometry args={[0.15, 0.01, 12, 32]} />
              <meshStandardMaterial color="#38bdf8" emissive="#00f0ff" emissiveIntensity={3.0} />
            </mesh>
            <mesh ref={coreRing2Ref}>
              <torusGeometry args={[0.17, 0.008, 12, 32]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3.0} />
            </mesh>
          </group>

          {/* Abdominal Spine Joint Segment */}
          <mesh position={[0, -0.52, 0]}>
            <cylinderGeometry args={[0.32, 0.28, 0.48, 16]} />
            <meshStandardMaterial color={jointColor} roughness={0.3} metalness={0.88} />
          </mesh>
        </group>

        {/* --- 4. LEFT ARTICULATED ARM (5 MECHANICAL FINGERS) --- */}
        <group ref={leftArmRef} position={[-0.76, 0.08, 0]}>
          {/* Shoulder Joint Ball */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.24, 24, 24]} />
            <meshStandardMaterial color={jointColor} metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Bicep Upper Arm */}
          <group rotation={[0.2, 0, 0.15]}>
            <mesh position={[-0.14, -0.38, 0]} castShadow>
              <capsuleGeometry args={[0.15, 0.48, 16, 16]} />
              <meshStandardMaterial color={mainShellColor} roughness={shellRoughness} metalness={shellMetalness} />
            </mesh>

            {/* Elbow Joint */}
            <mesh position={[-0.14, -0.68, 0]}>
              <sphereGeometry args={[0.13, 16, 16]} />
              <meshStandardMaterial color={jointColor} metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Forearm angled down */}
            <group position={[-0.14, -0.68, 0]} rotation={[-0.3, -0.2, 0.2]}>
              <mesh position={[0, -0.36, 0]} castShadow>
                <capsuleGeometry args={[0.12, 0.48, 16, 16]} />
                <meshStandardMaterial color={mainShellColor} roughness={shellRoughness} metalness={shellMetalness} />
              </mesh>

              {/* Hand Palm & 5 Mechanical Fingers */}
              <group position={[0, -0.68, 0]}>
                <mesh>
                  <boxGeometry args={[0.2, 0.08, 0.24]} />
                  <meshStandardMaterial color="#030712" metalness={0.95} roughness={0.1} />
                </mesh>

                {/* 5 Mechanical Fingers with Phalanx Knuckles */}
                {[-0.08, -0.03, 0.02, 0.07].map((xOffset, idx) => (
                  <group key={idx} position={[xOffset, -0.08, 0.08]} rotation={[0.3, 0, 0]}>
                    <mesh position={[0, -0.05, 0]}>
                      <cylinderGeometry args={[0.016, 0.016, 0.1, 12]} />
                      <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
                    </mesh>
                    <mesh position={[0, -0.11, 0.02]} rotation={[0.3, 0, 0]}>
                      <cylinderGeometry args={[0.014, 0.012, 0.08, 12]} />
                      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.0} />
                    </mesh>
                  </group>
                ))}
              </group>
            </group>
          </group>
        </group>

        {/* --- 5. RIGHT ARTICULATED ARM (INTERACTIVE GREETING / WAVING) --- */}
        <group ref={rightArmRef} position={[0.76, 0.08, 0]}>
          {/* Shoulder Joint Ball */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.24, 24, 24]} />
            <meshStandardMaterial color={jointColor} metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Bicep Upper Arm */}
          <group rotation={[0.2, 0, -0.15]}>
            <mesh position={[0.14, -0.38, 0]} castShadow>
              <capsuleGeometry args={[0.15, 0.48, 16, 16]} />
              <meshStandardMaterial color={mainShellColor} roughness={shellRoughness} metalness={shellMetalness} />
            </mesh>

            {/* Elbow Joint */}
            <mesh position={[0.14, -0.68, 0]}>
              <sphereGeometry args={[0.13, 16, 16]} />
              <meshStandardMaterial color={jointColor} metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Forearm */}
            <group position={[0.14, -0.68, 0]} rotation={[-0.4, 0.2, -0.2]}>
              <mesh position={[0, -0.36, 0]} castShadow>
                <capsuleGeometry args={[0.12, 0.48, 16, 16]} />
                <meshStandardMaterial color={mainShellColor} roughness={shellRoughness} metalness={shellMetalness} />
              </mesh>

              {/* Hand Palm & 5 Mechanical Fingers */}
              <group ref={rightHandRef} position={[0, -0.68, 0]}>
                <mesh>
                  <boxGeometry args={[0.2, 0.08, 0.24]} />
                  <meshStandardMaterial color="#030712" metalness={0.95} roughness={0.1} />
                </mesh>

                {/* Palm Glowing Sensor Disk */}
                <mesh position={[0, 0, 0.125]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.06, 0.06, 0.01, 24]} />
                  <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3.5} />
                </mesh>

                {/* 5 Mechanical Fingers */}
                {[-0.08, -0.03, 0.02, 0.07].map((xOffset, idx) => (
                  <group key={idx} position={[xOffset, -0.08, 0.08]} rotation={[0.3, 0, 0]}>
                    <mesh position={[0, -0.05, 0]}>
                      <cylinderGeometry args={[0.016, 0.016, 0.1, 12]} />
                      <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
                    </mesh>
                    <mesh position={[0, -0.11, 0.02]} rotation={[0.3, 0, 0]}>
                      <cylinderGeometry args={[0.014, 0.012, 0.08, 12]} />
                      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.0} />
                    </mesh>
                  </group>
                ))}
              </group>
            </group>
          </group>
        </group>

        {/* --- 6. LOWER BODY & LEGS --- */}
        <group position={[0, -0.92, 0]}>
          {/* Hips Pelvis Assembly */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.88, 0.32, 0.54]} />
            <meshStandardMaterial color={jointColor} metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Hip Joint Ball Sockets */}
          <mesh position={[-0.28, -0.18, 0]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.0} />
          </mesh>
          <mesh position={[0.28, -0.18, 0]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.0} />
          </mesh>

          {/* Thighs */}
          <mesh position={[-0.28, -0.62, 0]} castShadow>
            <capsuleGeometry args={[0.16, 0.58, 16, 16]} />
            <meshStandardMaterial color={mainShellColor} roughness={shellRoughness} metalness={shellMetalness} />
          </mesh>
          <mesh position={[0.28, -0.62, 0]} castShadow>
            <capsuleGeometry args={[0.16, 0.58, 16, 16]} />
            <meshStandardMaterial color={mainShellColor} roughness={shellRoughness} metalness={shellMetalness} />
          </mesh>
        </group>

        {/* CLICK EXPANDING HOLOGRAPHIC ENERGY SHOCKWAVE RING */}
        <mesh ref={shockwaveRef} position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 0.88, 64]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={4.0}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
          />
        </mesh>

      </group>
    </Float>
  );
};
