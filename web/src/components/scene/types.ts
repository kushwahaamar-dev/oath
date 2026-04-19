export type OathVisualState =
  | "idle"
  | "planning"
  | "awaitingSignature"
  | "submitting"
  | "active"
  | "completed"
  | "revoked"
  | "slashed"
  | "error";

export interface SceneComponentProps {
  label: string;
  state: OathVisualState;
  compact?: boolean;
}

export interface ScenePreset {
  haloOpacity: number;
  haloScale: number;
  rotationSpeed: number;
  cameraDrift: number;
  fracture: number;
  glowStrength: number;
}
