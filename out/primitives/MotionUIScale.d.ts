import React from "@rbxts/react";
import { MotionProps } from "./useVariantResolver";
export type MotionUIScaleProps = React.ComponentProps<"uiscale"> & MotionProps & {
    readonly _motionUIScaleProps?: unique symbol;
};
/**
 * MotionUIScale component — Declarative animated equivalent of UIScale.
 */
export declare const MotionUIScale: React.ForwardRefExoticComponent<Omit<MotionUIScaleProps, "ref"> & React.RefAttributes<UIScale>>;
