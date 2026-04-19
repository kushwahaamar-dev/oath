import * as THREE from "three";

type MonolithModelProps = {
  fracture: number;
};

const MONOLITH_MATERIAL = {
  color: "#d7d7d7",
  metalness: 0.18,
  roughness: 0.68,
} as const;

export function MonolithModel({ fracture }: MonolithModelProps): JSX.Element {
  const split = THREE.MathUtils.clamp(fracture, 0, 1);
  const offset = THREE.MathUtils.lerp(0.12, 0.56, split);
  const tilt = THREE.MathUtils.lerp(0.04, 0.18, split);

  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.78, 2.9, 0.4]} />
        <meshStandardMaterial {...MONOLITH_MATERIAL} />
      </mesh>

      {split > 0 ? (
        <mesh
          castShadow
          receiveShadow
          position={[offset, 0.12, -0.06]}
          rotation={[0, 0, tilt]}
          scale={[0.95, 0.98, 0.92]}
        >
          <boxGeometry args={[0.32, 2.48, 0.32]} />
          <meshStandardMaterial {...MONOLITH_MATERIAL} />
        </mesh>
      ) : null}
    </group>
  );
}
