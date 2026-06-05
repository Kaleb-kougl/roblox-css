import React from "@rbxts/react";

/**
 * Carries the nearest ancestor <Box>'s AbsoluteSize as a binding,
 * enabling children to reactively resolve percentage-based size constraints.
 */
export const ParentSizeContext = React.createContext<React.Binding<Vector2> | undefined>(undefined);
