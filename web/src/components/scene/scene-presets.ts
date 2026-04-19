import type { OathVisualState, ScenePreset } from "@/components/scene/types";

export const PRESETS = {
  idle: {
    haloOpacity: 0.45,
    haloScale: 1,
    rotationSpeed: 0.08,
    cameraDrift: 0.12,
    fracture: 0,
    glowStrength: 0.18,
  },
  planning: {
    haloOpacity: 0.52,
    haloScale: 1.04,
    rotationSpeed: 0.1,
    cameraDrift: 0.16,
    fracture: 0,
    glowStrength: 0.24,
  },
  awaitingSignature: {
    haloOpacity: 0.68,
    haloScale: 1.06,
    rotationSpeed: 0.12,
    cameraDrift: 0.18,
    fracture: 0,
    glowStrength: 0.32,
  },
  submitting: {
    haloOpacity: 0.74,
    haloScale: 1.08,
    rotationSpeed: 0.14,
    cameraDrift: 0.22,
    fracture: 0,
    glowStrength: 0.4,
  },
  active: {
    haloOpacity: 0.58,
    haloScale: 1.02,
    rotationSpeed: 0.16,
    cameraDrift: 0.2,
    fracture: 0,
    glowStrength: 0.26,
  },
  completed: {
    haloOpacity: 0.5,
    haloScale: 0.98,
    rotationSpeed: 0.1,
    cameraDrift: 0.14,
    fracture: 0,
    glowStrength: 0.16,
  },
  revoked: {
    haloOpacity: 0.2,
    haloScale: 0.92,
    rotationSpeed: 0.04,
    cameraDrift: 0.08,
    fracture: 0.1,
    glowStrength: 0.08,
  },
  slashed: {
    haloOpacity: 0.12,
    haloScale: 1.14,
    rotationSpeed: 0.34,
    cameraDrift: 0.42,
    fracture: 1,
    glowStrength: 0.04,
  },
  error: {
    haloOpacity: 0.18,
    haloScale: 0.96,
    rotationSpeed: 0.06,
    cameraDrift: 0.1,
    fracture: 0.18,
    glowStrength: 0.1,
  },
} satisfies Record<OathVisualState, ScenePreset>;

export function getScenePreset(state: OathVisualState): ScenePreset {
  return PRESETS[state];
}
