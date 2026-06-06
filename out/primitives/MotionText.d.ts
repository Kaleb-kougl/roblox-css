import React from "@rbxts/react";
import { CSSProperties } from "../styles/CSSTypes";
import { MotionProps } from "./useVariantResolver";
export type MotionTextProps = React.PropsWithChildren<React.ComponentProps<"textlabel">> & {
    style?: CSSProperties;
} & MotionProps & {
    readonly _motionTextProps?: unique symbol;
};
/**
 * MotionText component — Declarative animated equivalent of Text.
 */
export declare const MotionText: React.ForwardRefExoticComponent<Omit<MotionTextProps, "ref"> & React.RefAttributes<TextLabel>>;
