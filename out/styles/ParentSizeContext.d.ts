import React from "@rbxts/react";
/**
 * Carries the nearest ancestor <Box>'s AbsoluteSize as a binding,
 * enabling children to reactively resolve percentage-based size constraints.
 */
export declare const ParentSizeContext: React.Context<React.Binding<Vector2> | undefined>;
