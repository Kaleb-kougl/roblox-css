import React from "@rbxts/react";
import { CSSProperties } from "../styles/webStyle";
export interface MotionProps {
    initial?: string;
    animate?: string;
    variants?: Record<string, Partial<CSSProperties> & Record<string, unknown>>;
    transition?: TweenInfo;
}
export declare function isAnimatable(value: unknown): boolean;
export declare function useVariantResolver(animate?: string, initial?: string, variants?: Record<string, Partial<CSSProperties> & Record<string, unknown>>, transition?: TweenInfo, parser?: (style: Partial<CSSProperties> & Record<string, unknown>) => Record<string, unknown>): {
    animatedProps: Record<string, React.Binding<unknown>>;
    staticProps: Record<string, unknown>;
};
