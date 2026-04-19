"use client";

import React, { useRef } from "react";
import { Environment, Float } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { HaloField } from "@/components/scene/halo-field";
import { MonolithModel } from "@/components/scene/monolith-model";
import { getScenePreset } from "@/components/scene/scene-presets";
import { STATE_COPY } from "@/components/scene/scene-copy";
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
    const driftX = Math.sin(elapsed * 0.55) * preset.cameraDrift * 0.08;
    const driftY = Math.cos(elapsed * 0.8) * 0.05;

    groupRef.current.rotation.y += delta * preset.rotationSpeed;
    groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, driftX, 3.2, delta);
    groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, driftY, 3.2, delta);
  });

  return (
    <>
      <ambientLight intensity={0.42 + preset.glowStrength} />
      <directionalLight color="#f8f8f8" intensity={0.92 + preset.glowStrength} position={[2.8, 3.6, 4.2]} />

      <Float speed={0.9} rotationIntensity={0.05} floatIntensity={0.12}>
        <group ref={groupRef} scale={0.68}>
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
  const sceneHeight = compact ? "h-[240px]" : "h-[320px]";
  const cameraFov = compact ? 30 : 26;
  const copy = STATE_COPY[state];

  return (
    <section
      className="chamber-surface relative overflow-hidden rounded-[2rem]"
      aria-label={label ?? copy.title}
    >
      <div aria-hidden className="halo-noise pointer-events-none absolute inset-0 opacity-60" />

      <header className="relative z-10 flex items-start justify-between gap-4 border-b border-white/5 p-5 sm:p-6">
        <div className="min-w-0 space-y-2">
          <p className="font-ui text-[11px] uppercase tracking-[0.34em] text-muted-foreground">
            Live oath state
          </p>
          <h2 className="font-display text-2xl leading-tight text-foreground sm:text-3xl">
            {copy.title}
          </h2>
          <p className="font-ui max-w-[40ch] text-[12.5px] leading-relaxed text-muted-foreground">
            {copy.description}
          </p>
        </div>

        <div className="shrink-0 rounded-full border border-white/10 bg-black/40 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/80">
          {copy.badge}
        </div>
      </header>

      <div className={`relative ${sceneHeight} overflow-hidden`}>
        <Canvas
          camera={{ position: [0, 0.18, 5.4], fov: cameraFov }}
          className="h-full w-full"
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        >
          <color attach="background" args={["#05070c"]} />
          <fog attach="fog" args={["#05070c", 4.2, 7.8]} />
          <SceneBody state={state} />
        </Canvas>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/20 to-transparent"
        />
      </div>

      <footer className="relative z-10 grid grid-cols-3 divide-x divide-white/5 border-t border-white/5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        <div className="px-4 py-3 sm:px-5">
          <span className="block text-foreground/80">Ring</span>
          <span className="block">scope boundary</span>
        </div>
        <div className="px-4 py-3 sm:px-5">
          <span className="block text-foreground/80">Slab</span>
          <span className="block">signed oath</span>
        </div>
        <div className="px-4 py-3 sm:px-5">
          <span className="block text-foreground/80">Fracture</span>
          <span className="block">slash event</span>
        </div>
      </footer>
    </section>
  );
}
