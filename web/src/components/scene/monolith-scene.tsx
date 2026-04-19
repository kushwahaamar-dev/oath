"use client";

import React, { useRef } from "react";
import { Environment, Float } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { HaloField } from "@/components/scene/halo-field";
import { MonolithModel } from "@/components/scene/monolith-model";
import { getScenePreset } from "@/components/scene/scene-presets";
import type { OathVisualState, SceneComponentProps } from "@/components/scene/types";

type SceneBodyProps = {
  state: OathVisualState;
};

function SceneBody({ state }: SceneBodyProps): JSX.Element {
  const preset = getScenePreset(state);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((animationState, delta) => {
    if (!groupRef.current) {
      return;
    }

    const elapsed = animationState.clock.getElapsedTime();
    const driftX = Math.sin(elapsed * 0.55) * preset.cameraDrift * 0.12;
    const driftY = Math.cos(elapsed * 0.8) * 0.08;

    groupRef.current.rotation.y += delta * preset.rotationSpeed;
    groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, driftX, 3.2, delta);
    groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, driftY, 3.2, delta);
  });

  return (
    <>
      <ambientLight intensity={0.42 + preset.glowStrength} />
      <directionalLight color="#f8f8f8" intensity={0.92 + preset.glowStrength} position={[2.8, 3.6, 4.2]} />

      <Float speed={0.9} rotationIntensity={0.08} floatIntensity={0.18}>
        <group ref={groupRef}>
          <HaloField opacity={preset.haloOpacity} scale={preset.haloScale} />
          <MonolithModel fracture={preset.fracture} />
        </group>
      </Float>

      <Environment preset="night" />
    </>
  );
}

export function MonolithScene({
  label,
  state,
  compact = false,
}: SceneComponentProps): JSX.Element {
  const sceneHeight = compact ? "h-[320px]" : "h-[440px]";
  const cameraFov = compact ? 34 : 28;

  return (
    <section className="chamber-surface relative overflow-hidden rounded-[2rem] p-4 sm:p-6" aria-label={label}>
      <div aria-hidden className="halo-noise absolute inset-0 opacity-70" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 p-4 sm:p-6">
        <div className="space-y-2">
          <p className="font-ui text-[11px] uppercase tracking-[0.34em] text-muted-foreground">
            Monolith chamber
          </p>
          <h2 className="font-display text-2xl text-foreground sm:text-3xl">{label}</h2>
        </div>

        <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {state}
        </div>
      </div>

      <div className={`relative ${sceneHeight}`}>
        <Canvas
          camera={{ position: [0, 0.18, 5], fov: cameraFov }}
          className="h-full w-full"
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        >
          <color attach="background" args={["#05070c"]} />
          <fog attach="fog" args={["#05070c", 4.2, 7.8]} />
          <SceneBody state={state} />
        </Canvas>
      </div>
    </section>
  );
}
