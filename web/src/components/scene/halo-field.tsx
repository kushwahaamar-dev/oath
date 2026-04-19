"use client";

import React from "react";

type HaloFieldProps = {
  scale: number;
  opacity: number;
};

export function HaloField({ scale, opacity }: HaloFieldProps): JSX.Element {
  const haloScale = Math.max(scale, 0.1);
  const haloOpacity = Math.min(Math.max(opacity, 0), 1);

  return (
    <group scale={haloScale}>
      <mesh name="halo-torus" position={[0, 0.12, -0.18]}>
        <torusGeometry args={[1.42, 0.034, 16, 72]} />
        <meshStandardMaterial
          color="#f1f1f1"
          emissive="#ffffff"
          emissiveIntensity={0.16}
          metalness={0.08}
          roughness={0.46}
          transparent
          opacity={haloOpacity}
        />
      </mesh>

      <mesh name="halo-ring" position={[0, 0.12, -0.24]} scale={1.08}>
        <ringGeometry args={[1.54, 1.68, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={haloOpacity * 0.24} />
      </mesh>
    </group>
  );
}
