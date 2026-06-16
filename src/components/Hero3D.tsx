import { Canvas } from "@react-three/fiber";
import { Float, OrbitControls, MeshDistortMaterial, Sphere, Torus } from "@react-three/drei";
import { Suspense } from "react";

function Scene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffb366" />
      <pointLight position={[-5, -2, -5]} intensity={0.6} color="#ff6b35" />
      <Float speed={1.5} rotationIntensity={1.2} floatIntensity={1.5}>
        <Sphere args={[1.4, 64, 64]} position={[0, 0, 0]}>
          <MeshDistortMaterial color="#e8842a" distort={0.45} speed={2} roughness={0.2} metalness={0.4} />
        </Sphere>
      </Float>
      <Float speed={2} rotationIntensity={2} floatIntensity={2}>
        <Torus args={[2.4, 0.1, 16, 100]} position={[0, 0, 0]} rotation={[Math.PI / 3, 0, 0]}>
          <meshStandardMaterial color="#c45a2a" emissive="#c45a2a" emissiveIntensity={0.3} />
        </Torus>
      </Float>
      <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
        <Sphere args={[0.3, 32, 32]} position={[2.2, 1.3, -1]}>
          <meshStandardMaterial color="#f4c542" emissive="#f4c542" emissiveIntensity={0.4} />
        </Sphere>
      </Float>
      <Float speed={1.3} rotationIntensity={0.5} floatIntensity={1.3}>
        <Sphere args={[0.22, 32, 32]} position={[-2.4, -1.1, 0.5]}>
          <meshStandardMaterial color="#7ac74f" emissive="#7ac74f" emissiveIntensity={0.3} />
        </Sphere>
      </Float>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </>
  );
}

export function Hero3D({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}