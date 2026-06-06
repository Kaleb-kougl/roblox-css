import React from "@rbxts/react";
import { CSSProperties } from "../styles/webStyle";
import { MotionProps } from "./useVariantResolver";
export type MotionBoxProps = React.PropsWithChildren<React.ComponentProps<"frame">> & {
    style?: CSSProperties;
} & MotionProps & {
    readonly _motionBoxProps?: unique symbol;
};
/**
 * MotionBox component — Declarative animated equivalent of Box.
 *
 * Exposes Framer Motion-like props (`animate`, `variants`, `transition`)
 * over the base `webStyle` layout engine.
 */
export declare const MotionBox: React.ForwardRefExoticComponent<Omit<MotionBoxProps, "ref"> & React.RefAttributes<Frame>>;
