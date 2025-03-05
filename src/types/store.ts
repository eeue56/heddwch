export type RenderAction = "DoNotRerender" | "Rerender";

export type UpdateResponse<state> = Promise<{
  kind: "UpdateResponse";
  renderAction: RenderAction;
  state: state;
}>;

export async function requestRerender<state>(
  state: state
): UpdateResponse<state> {
  return {
    kind: "UpdateResponse",
    renderAction: "Rerender",
    state,
  };
}

export async function doNotRerender<state>(
  state: state
): UpdateResponse<state> {
  return {
    kind: "UpdateResponse",
    renderAction: "DoNotRerender",
    state,
  };
}
