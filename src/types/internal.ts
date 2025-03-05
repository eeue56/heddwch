import type { DebuggingInfo } from "../types";

export type Update =
  | { kind: "Noop" }
  | { kind: "ReadyToRender" }
  | { kind: "SetDebuggingInfo"; info: DebuggingInfo };
