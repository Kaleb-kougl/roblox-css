/**
 * parseInlineImages.ts — Parses <img> tags from text strings into structured segments.
 *
 * Roblox's built-in RichText does NOT support inline images. This parser extracts
 * standard HTML-style `<img src="..." width="N" height="N" />` tags so the InlineText
 * component can render them as separate Image elements.
 */
export interface TextSegment {
    readonly type: "text";
    readonly content: string;
}
export interface ImageSegment {
    readonly type: "image";
    readonly src: string;
    readonly width: number;
    readonly height: number;
}
export type InlineSegment = TextSegment | ImageSegment;
export declare function parseInlineImages(input: string): InlineSegment[];
export declare function containsRichTextTags(text: string): boolean;
