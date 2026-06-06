export type ParsedGradient = {
    readonly colorSequence: ColorSequence;
    readonly transparencySequence: NumberSequence | undefined;
    readonly rotation: number;
} & {
    readonly _parsed: unique symbol;
};
export declare function isGradientString(input: string): boolean;
export declare function parseGradient(input: string, elementWidth?: number, elementHeight?: number): ParsedGradient | undefined;
