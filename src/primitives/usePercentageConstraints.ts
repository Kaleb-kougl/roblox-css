import React, { useContext } from "@rbxts/react";
import { ParentSizeContext } from "../styles/ParentSizeContext";
import { parseDimension } from "../styles/dimensionParser";
import type { CSSProperties } from "../styles/CSSTypes";

export function usePercentageConstraints(style: CSSProperties | undefined): React.Element | undefined {
	const parentSize = useContext(ParentSizeContext);
	if (!parentSize) return undefined;
	if (!style) return undefined;

	// Extract Scale and Offset components from all four constraint properties.
	// Scale is used for percentage axes; Offset is the pixel fallback for non-percentage axes.
	const minW = style.minWidth !== undefined ? parseDimension(style.minWidth) : undefined;
	const minH = style.minHeight !== undefined ? parseDimension(style.minHeight) : undefined;
	const maxW = style.maxWidth !== undefined ? parseDimension(style.maxWidth) : undefined;
	const maxH = style.maxHeight !== undefined ? parseDimension(style.maxHeight) : undefined;

	const minWScale = minW?.Scale ?? 0;
	const minHScale = minH?.Scale ?? 0;
	const maxWScale = maxW?.Scale ?? 0;
	const maxHScale = maxH?.Scale ?? 0;

	// Only activate if at least one constraint has a Scale component
	if (minWScale === 0 && minHScale === 0 && maxWScale === 0 && maxHScale === 0) {
		return undefined;
	}

	// When this hook activates, it takes EXCLUSIVE ownership of the <uisizeconstraint>.
	// For axes without a percentage, use the pixel (.Offset) fallback from parseDimension().
	// This handles mixed cases like { minWidth: "200px", maxWidth: "50%" }.
	const minWFallback = minW?.Offset ?? 0;
	const minHFallback = minH?.Offset ?? 0;
	const maxWFallback = maxW?.Offset ?? math.huge;
	const maxHFallback = maxH?.Offset ?? math.huge;

	return React.createElement("uisizeconstraint", {
		MinSize: parentSize.map((ps: Vector2) => new Vector2(
			minWScale > 0 ? ps.X * minWScale : minWFallback,
			minHScale > 0 ? ps.Y * minHScale : minHFallback,
		)),
		MaxSize: parentSize.map((ps: Vector2) => new Vector2(
			maxWScale > 0 ? ps.X * maxWScale : maxWFallback,
			maxHScale > 0 ? ps.Y * maxHScale : maxHFallback,
		)),
	});
}
