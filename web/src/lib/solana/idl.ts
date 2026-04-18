import type { Oath as OathIdlType } from "./generated/oath";
import idlJson from "./generated/oath.json";

export const OATH_IDL = idlJson as unknown as OathIdlType;
export type OathProgram = OathIdlType;
