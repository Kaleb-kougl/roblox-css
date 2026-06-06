import React from "@rbxts/react";
import { CSSProperties } from "../styles/CSSTypes";
import { MotionProps } from "./useVariantResolver";
export type MotionImageProps = React.PropsWithChildren<React.ComponentProps<"imagelabel">> & {
    style?: CSSProperties;
    src?: string;
} & MotionProps & {
    readonly _motionImageProps?: unique symbol;
};
/**
 * MotionImage component — Declarative animated equivalent of Image.
 */
export declare const MotionImage: React.ForwardRefExoticComponent<Omit<MotionImageProps, "ref"> & React.RefAttributes<ImageLabel>>;
