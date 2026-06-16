import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, Suspense } from "react";
import type { Mesh } from "three";

function Mark() {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.6; });
  return (
    <mesh ref={ref}>
      <torusKnotGeometry args={[0.6, 0.22, 128, 16]} />
      <meshStandardMaterial color="#e8842a" metalness={0.6} roughness={0.2} emissive="#c45a2a" emissiveIntensity={0.3} />
    </mesh>
  );
}

export function Logo3D({ size = 40 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas camera={{ position: [0, 0, 2.2], fov: 50 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 2, 2]} intensity={1.2} />
          <Mark />
        </Suspense>
      </Canvas>
    </div>
  );
}