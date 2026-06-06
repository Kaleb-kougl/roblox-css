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

const IMG_PATTERN = '<img%s+src="([^"]*)"%s+width="(%d+)"%s+height="(%d+)"%s*/?>';

export function parseInlineImages(input: string): InlineSegment[] {
	const segments: InlineSegment[] = [];
	let searchStart = 1;

	for (;;) {
		const [matchStart, matchEnd, src, widthStr, heightStr] = string.find(
			input,
			IMG_PATTERN,
			searchStart,
		);

		if (matchStart === undefined || matchEnd === undefined) {
			const remaining = string.sub(input, searchStart);
			if (remaining !== "") {
				segments.push({ type: "text", content: remaining });
			}
			break;
		}

		if (matchStart > searchStart) {
			const before = string.sub(input, searchStart, matchStart - 1);
			if (before !== "") {
				segments.push({ type: "text", content: before });
			}
		}

		segments.push({
			type: "image",
			src: tostring(src),
			width: tonumber(widthStr) ?? 20,
			height: tonumber(heightStr) ?? 20,
		});

		searchStart = matchEnd + 1;
	}

	if (segments.isEmpty()) {
		segments.push({ type: "text", content: input });
	}

	return segments;
}

const RICH_TEXT_TAG_PATTERN = "</?[biusBIUS]>";

export function containsRichTextTags(text: string): boolean {
	const [simple] = string.find(text, RICH_TEXT_TAG_PATTERN);
	if (simple !== undefined) return true;
	const [font] = string.find(text, "<font%s");
	if (font !== undefined) return true;
	const [stroke] = string.find(text, "<stroke%s");
	if (stroke !== undefined) return true;
	const [sc] = string.find(text, "<sc>");
	if (sc !== undefined) return true;
	const [br] = string.find(text, "<br%s*/?>");
	if (br !== undefined) return true;
	return false;
}
