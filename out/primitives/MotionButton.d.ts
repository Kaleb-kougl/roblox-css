import React from "@rbxts/react";
import { CSSProperties } from "../styles/CSSTypes";
import { MotionProps } from "./useVariantResolver";
export type MotionButtonProps = React.PropsWithChildren<React.ComponentProps<"textbutton">> & {
    style?: CSSProperties;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
} & MotionProps & {
    readonly _motionButtonProps?: unique symbol;
};
/**
 * MotionButton component — Declarative animated equivalent of Button.
 */
export declare const MotionButton: React.ForwardRefExoticComponent<Omit<MotionButtonProps, "ref"> & React.RefAttributes<TextButton>>;
