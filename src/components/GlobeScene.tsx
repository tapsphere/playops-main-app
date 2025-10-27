import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import earthTexture from '@/assets/earth-texture.jpg';

interface GlobeProps {
  progress: number;
  mousePosition: { x: number; y: number };
}

// Particle component for cosmic dust
const CosmicDust = () => {
  const particlesRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const positions = new Float32Array(200 * 3);
    const colors = new Float32Array(200 * 3);
    
    for (let i = 0; i < 200; i++) {
      const radius = 2 + Math.random() * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      colors[i * 3] = 0.8 + Math.random() * 0.2;
      colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
      colors[i * 3 + 2] = 1;
    }
    
    return { positions, colors };
  }, []);
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.0002;
    }
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={200}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={200}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

interface GlobeProps {
  progress: number;
  mousePosition: { x: number; y: number };
  isSpeaking: boolean;
  onEarthClick: () => void;
}

export const Globe = ({ progress, mousePosition, isSpeaking, onEarthClick }: GlobeProps) => {
  const globeRef = useRef<THREE.Group>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0, y: 0 });
  
  // Load real Earth texture
  const texture = useTexture(earthTexture);

  // Create material for the globe with real Earth texture
  const globeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: texture,
      metalness: 0.2,
      roughness: 0.7,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0,
      transparent: true,
      opacity: progress > 0 ? 1 : 0, // Hidden until Initialize clicked
    });
  }, [texture, progress]);
  
  // Create overlay material for circuit board pattern
  const overlayMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        progress: { value: 0 },
        glowColor: { value: new THREE.Color(0x00ff00) }, // Pure bright green
        time: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float progress;
        uniform vec3 glowColor;
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }
        
        void main() {
          vec2 uv = vUv * 25.0; // Less dense grid
          vec2 gridId = floor(uv);
          vec2 gridUv = fract(uv);
          
          float circuit = 0.0;
          float seed = random(gridId);
          
          // Thinner lines, more spacing
          float lineWidth = 0.015;
          float spacing = 0.15;
          
          // Fewer horizontal traces
          for (float i = -2.0; i <= 2.0; i += 1.0) {
            float offset = i * spacing;
            float hTrace = step(abs(gridUv.y - 0.5 - offset), lineWidth);
            circuit += hTrace * step(0.3, seed + i * 0.1);
          }
          
          // Fewer vertical traces  
          for (float i = -2.0; i <= 2.0; i += 1.0) {
            float offset = i * spacing;
            float vTrace = step(abs(gridUv.x - 0.5 - offset), lineWidth);
            circuit += vTrace * step(0.3, seed + i * 0.12);
          }
          
          // Occasional diagonal traces
          float diagNoise = noise(gridId + vec2(5.0, 3.0));
          if (diagNoise > 0.5) {
            float diagDist = abs(gridUv.x - gridUv.y);
            float diagTrace = step(diagDist, lineWidth * 1.2);
            circuit += diagTrace * 0.5;
          }
          
          // Small connection nodes
          vec2 nodeCenter = vec2(0.5);
          float nodeDist = length(gridUv - nodeCenter);
          float mainNode = smoothstep(0.06, 0.03, nodeDist) * step(0.65, seed);
          
          // Combine all elements
          circuit = clamp(circuit, 0.0, 1.0);
          float nodes = mainNode;
          
          // Angled sweep animation - diagonal from bottom-left to top-right
          float angle3d = atan(vPosition.z, vPosition.x);
          float heightFactor = vPosition.y; // -1 to 1 (bottom to top)
          float normalizedAngle = (angle3d + 3.14159) / 6.28318; // 0 to 1 around sphere
          
          // Combine horizontal position and height for diagonal sweep
          // This creates a sweep that goes diagonally across the sphere
          float sweepPosition = (normalizedAngle + (heightFactor * 0.5 + 0.5)) * 0.5;
          
          // Static glitch effect
          float staticNoise = noise(vec2(sweepPosition * 20.0, time * 0.3));
          float glitch = step(0.6, staticNoise) * 0.05;
          
          // Progressive wrapping from bottom-left to top-right
          float wrapEdge = progress * 1.3 + glitch;
          float reveal = 1.0 - smoothstep(wrapEdge - 0.25, wrapEdge + 0.05, sweepPosition);
          reveal *= smoothstep(0.0, 0.1, progress);
          
          // Scanline flicker at the wrap edge
          float edgeDistance = abs(sweepPosition - wrapEdge);
          float scanline = sin(sweepPosition * 80.0 - time * 10.0) * 0.5 + 0.5;
          float edgeGlow = smoothstep(0.3, 0.0, edgeDistance) * scanline * 0.4;
          reveal = clamp(reveal + edgeGlow * progress, 0.0, 1.0);
          
          // Glowing effect with reduced intensity to see Earth
          float totalCircuit = circuit + nodes;
          float glow = totalCircuit * 2.0;
          vec3 color = glowColor * (totalCircuit * 3.5 + glow * 2.0) * reveal;
          
          // Extra bright nodes
          color += glowColor * nodes * 6.0 * reveal;
          
          // Pulse animation
          float pulse = 1.0 + sin(time * 2.0 + seed * 6.28) * 0.15;
          color *= pulse;
          
          // Lower alpha so Earth shows through
          float alpha = totalCircuit * reveal * 0.65 + glow * reveal * 0.35;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // Start camera far away from the beginning
  useEffect(() => {
    camera.position.set(0, 0, 15);
  }, [camera]);

  // Cinematic zoom intro from deep space - happens first
  useEffect(() => {
    if (progress > 0 && !introComplete) {
      const startTime = Date.now();
      const duration = 2500;
      const startZ = 15;
      const endZ = 4;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // Ease out cubic
        
        camera.position.z = startZ - ((startZ - endZ) * eased);
        
        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          setIntroComplete(true);
        }
      };
      
      animate();
    }
  }, [progress, camera, introComplete]);

  // Enhanced drag interaction
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        
        rotationRef.current.y += deltaX * 0.005;
        rotationRef.current.x += deltaY * 0.005;
        rotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationRef.current.x));
        
        dragStartRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        setIsDragging(true);
        dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        const deltaX = e.touches[0].clientX - dragStartRef.current.x;
        const deltaY = e.touches[0].clientY - dragStartRef.current.y;
        
        rotationRef.current.y += deltaX * 0.005;
        rotationRef.current.x += deltaY * 0.005;
        rotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationRef.current.x));
        
        dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  useFrame((state) => {
    if (!globeRef.current) return;
    
    // Rotate Earth constantly from the moment it appears
    if (progress > 0) {
      globeRef.current.rotation.y += 0.002;
    }
    
    // Pulse earth when ARIA is speaking - reduced pulse to prevent text overlap
    if (isSpeaking) {
      const pulseScale = 1 + Math.sin(state.clock.elapsedTime * 8) * 0.015;
      globeRef.current.scale.set(pulseScale, pulseScale, pulseScale);
    } else {
      // Smooth return to normal scale
      const currentScale = globeRef.current.scale.x;
      const targetScale = 1;
      const newScale = currentScale + (targetScale - currentScale) * 0.1;
      globeRef.current.scale.set(newScale, newScale, newScale);
    }
    
    // Interactive rotation and parallax (after zoom completes)
    if (!isDragging && introComplete) {
      // Subtle parallax from mouse
      const targetRotationX = (mousePosition.y / window.innerHeight - 0.5) * 0.15;
      const targetRotationY = (mousePosition.x / window.innerWidth - 0.5) * 0.15;
      
      globeRef.current.rotation.x += (targetRotationX + rotationRef.current.x - globeRef.current.rotation.x) * 0.03;
    } else if (isDragging && introComplete) {
      // Apply drag rotation only after zoom
      globeRef.current.rotation.x = rotationRef.current.x;
      const currentY = globeRef.current.rotation.y % (Math.PI * 2);
      const targetY = rotationRef.current.y % (Math.PI * 2);
      globeRef.current.rotation.y = currentY + (targetY - currentY) * 0.1;
    }
    
    // Enhanced pulsing atmospheric glow - reduced pulse to prevent text overlap
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.copy(globeRef.current.rotation);
      if (isSpeaking) {
        const speakScale = 1.08 + Math.sin(state.clock.elapsedTime * 8) * 0.04;
        atmosphereRef.current.scale.set(speakScale, speakScale, speakScale);
      } else {
        const scale = 1.08 + Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
        atmosphereRef.current.scale.set(scale, scale, scale);
      }
    }
    
    // Grid wraps ONLY when loading bar reaches 100%
    const overlayMesh = globeRef.current.children[1] as THREE.Mesh;
    if (overlayMesh && overlayMesh.material) {
      const mat = overlayMesh.material as THREE.ShaderMaterial;
      if (mat.uniforms) {
        if (mat.uniforms.progress) {
          // Grid animation starts ONLY when progress hits 100, then slowly wraps over time
          if (progress >= 100) {
            const currentProgress = mat.uniforms.progress.value;
            const targetProgress = 1;
            // Slow interpolation - takes about 8 seconds to fully wrap
            mat.uniforms.progress.value = currentProgress + (targetProgress - currentProgress) * 0.008;
          } else {
            mat.uniforms.progress.value = 0;
          }
        }
        if (mat.uniforms.time) {
          mat.uniforms.time.value = state.clock.elapsedTime;
        }
      }
    }
  });

  return (
    <>
      {progress > 0 && (
        <>
          <group 
            ref={globeRef} 
            position={[0, 0.1, 0]}
            onClick={(e) => {
              e.stopPropagation();
              console.log('Earth clicked! Progress:', progress);
              if (progress >= 100) {
                console.log('Activating voice operator!');
                onEarthClick();
              } else {
                console.log('Progress not complete yet');
              }
            }}
          >
            {/* Main Earth sphere with texture - scaled down */}
            <Sphere args={[0.55, 64, 64]} material={globeMaterial} />
            
            {/* Circuit overlay */}
            <Sphere args={[0.555, 64, 64]} material={overlayMaterial} />
          </group>
          
          {/* Enhanced volumetric atmospheric glow - pulses when speaking */}
          <mesh ref={atmosphereRef} position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.65, 64, 64]} />
            <meshBasicMaterial
              color={isSpeaking ? "#00ff00" : "#4a90e2"}
              transparent
              opacity={isSpeaking ? 0.3 : 0.15}
              side={THREE.BackSide}
            />
          </mesh>
          
          {/* Inner atmospheric glow */}
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.58, 64, 64]} />
            <meshBasicMaterial
              color="#6ba3d8"
              transparent
              opacity={0.1}
              side={THREE.BackSide}
            />
          </mesh>
          
          {/* Cosmic dust particles */}
          <CosmicDust />
          
          {/* Lens flare effect */}
          <mesh position={[2, 1, -1]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
          
          {/* Floating particles for depth */}
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 1.5 + Math.random() * 0.5;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (Math.random() - 0.5) * 1;
            
            return (
              <mesh key={i} position={[x, y, z]}>
                <sphereGeometry args={[0.01, 8, 8]} />
                <meshBasicMaterial 
                  color={i % 3 === 0 ? "#4a90e2" : "#ffffff"} 
                  transparent 
                  opacity={0.4} 
                />
              </mesh>
            );
          })}
        </>
      )}
    </>
  );
};

