import { parseColor } from "./colorParser";
import { createLogger } from "../logger";

const log = createLogger("gradientParser");

export type ParsedGradient = {
	readonly colorSequence: ColorSequence;
	readonly transparencySequence: NumberSequence | undefined;
	readonly rotation: number;
} & { readonly _parsed: unique symbol };

function makeParsedGradient(
	colorSequence: ColorSequence,
	transparencySequence: NumberSequence | undefined,
	rotation: number,
): ParsedGradient {
	return { colorSequence, transparencySequence, rotation } as unknown as ParsedGradient;
}

export function isGradientString(input: string): boolean {
	return typeIs(input, "string") && input.sub(1, 16) === "linear-gradient(";
}

type ParsedStop = {
	color: Color3;
	transparency: number;
	position: number | undefined; // [0, 1]
	isHint: boolean;
};

function parseAngle(directionStr: string, elementWidth?: number, elementHeight?: number): number {
	const lower = directionStr.lower();

	// Keyword directions
	if (lower === "to top") return 0;
	if (lower === "to right") return 90;
	if (lower === "to bottom") return 180;
	if (lower === "to left") return 270;

	// Corner keywords
	if (lower.sub(1, 3) === "to ") {
		const corner = lower.sub(4);
		let angleDeg = 45; // Default for to top right
		if (elementWidth !== undefined && elementHeight !== undefined && elementHeight !== 0) {
			const ratioAngle = math.deg(math.atan2(elementWidth, elementHeight));
			if (corner === "top right") return ratioAngle;
			if (corner === "bottom right") return 180 - ratioAngle;
			if (corner === "bottom left") return 180 + ratioAngle;
			if (corner === "top left") return 360 - ratioAngle;
		} else {
			if (corner === "top right") return 45;
			if (corner === "bottom right") return 135;
			if (corner === "bottom left") return 225;
			if (corner === "top left") return 315;
		}
	}

	// Angle values
	const [degMatch] = string.match(lower, "^([%d%.%-]+)deg$");
	if (degMatch !== undefined) return tonumber(degMatch) ?? 180;

	const [turnMatch] = string.match(lower, "^([%d%.%-]+)turn$");
	if (turnMatch !== undefined) return (tonumber(turnMatch) ?? 0) * 360;

	const [gradMatch] = string.match(lower, "^([%d%.%-]+)grad$");
	if (gradMatch !== undefined) return (tonumber(gradMatch) ?? 0) * 0.9;

	const [radMatch] = string.match(lower, "^([%d%.%-]+)rad$");
	if (radMatch !== undefined) return math.deg(tonumber(radMatch) ?? 0);

	return 180; // default
}

function parseStop(stopStr: string): ParsedStop | undefined {
	const [trimmedRaw] = string.match(stopStr, "^%s*(.-)%s*$");
	if (trimmedRaw === undefined || trimmedRaw === "") return undefined;
	const trimmed = trimmedRaw as string;

	// Check if it's a bare percentage (color hint)
	const [hintMatch] = string.match(trimmed, "^([%d%.]+)%%$");
	if (hintMatch !== undefined) {
		const pos = tonumber(hintMatch);
		if (pos !== undefined) {
			return { color: new Color3(), transparency: 0, position: math.clamp(pos / 100, 0, 1), isHint: true };
		}
	}

	// Split by space from the end to find optional position
	// Since color could be rgba(255, 0, 0, 0.5) we must be careful with spaces.
	// We'll look for a percentage at the end.
	let colorStr = trimmed;
	let position: number | undefined;

	const [endPercentMatch] = string.match(trimmed, " ([%d%.%-]+)%%$");
	if (endPercentMatch !== undefined) {
		const pos = tonumber(endPercentMatch);
		if (pos !== undefined) {
			position = math.clamp(pos / 100, 0, 1);
			const [colorMatch] = string.match(trimmed, "^(.*) [%d%.%-]+%%$");
			if (colorMatch !== undefined) colorStr = colorMatch as unknown as string;
		}
	}

	const parsedColor = parseColor(colorStr);
	return {
		color: parsedColor.color as Color3,
		transparency: parsedColor.transparency,
		position: position,
		isHint: false,
	};
}

export function parseGradient(
	input: string,
	elementWidth?: number,
	elementHeight?: number,
): ParsedGradient | undefined {
	if (!isGradientString(input)) return undefined;

	const [repeatingStart] = string.find(input.lower(), "^repeating%-linear%-gradient");
	if (repeatingStart !== undefined) {
		log.warn("UNSUPPORTED_GRADIENT", "repeating-linear-gradient is not supported", { input });
		return undefined;
	}

	const inner = input.sub(17, -2);
	if (inner === "") return undefined;

	// Simple parser for comma-separated args, respecting parentheses for rgb/rgba
	const args: string[] = [];
	let currentArg = "";
	let parenLevel = 0;

	for (let i = 1; i <= inner.size(); i++) {
		const char = inner.sub(i, i);
		if (char === "(") parenLevel++;
		else if (char === ")") parenLevel--;
		else if (char === "," && parenLevel === 0) {
			args.push(currentArg);
			currentArg = "";
			continue;
		}
		currentArg += char;
	}
	args.push(currentArg);

	if (args.size() < 2) return undefined;

	// Determine if the first arg is a direction
	let directionStr = args[0];
	let directionAngle = 180;
	let firstStopIdx = 0;

	const lowerFirst = directionStr.lower();
	const [hasDeg] = string.find(lowerFirst, "deg$");
	const [hasTurn] = string.find(lowerFirst, "turn$");
	const [hasGrad] = string.find(lowerFirst, "grad$");
	const [hasRad] = string.find(lowerFirst, "rad$");
	if (
		lowerFirst.sub(1, 3) === "to " ||
		hasDeg ||
		hasTurn ||
		hasGrad ||
		hasRad
	) {
		directionAngle = parseAngle(directionStr, elementWidth, elementHeight);
		firstStopIdx = 1;
	}

	const stops: ParsedStop[] = [];
	for (let i = firstStopIdx; i < args.size(); i++) {
		const parsed = parseStop(args[i]);
		if (parsed !== undefined) {
			stops.push(parsed);
		}
	}

	// Remove leading/trailing hints and check valid color stops
	while (stops.size() > 0 && stops[0].isHint) stops.shift();
	while (stops.size() > 0 && stops[stops.size() - 1].isHint) stops.pop();

	let colorStopCount = 0;
	for (const stop of stops) {
		if (!stop.isHint) colorStopCount++;
	}

	if (colorStopCount < 2) return undefined;

	// Distribute positions
	if (stops[0].position === undefined) stops[0].position = 0;
	if (stops[stops.size() - 1].position === undefined) stops[stops.size() - 1].position = 1;

	let lastKnownIdx = 0;
	for (let i = 1; i < stops.size(); i++) {
		if (stops[i].position !== undefined) {
			const steps = i - lastKnownIdx;
			const startPos = stops[lastKnownIdx].position!;
			const endPos = stops[i].position!;
			const stepSize = (endPos - startPos) / steps;
			for (let j = 1; j < steps; j++) {
				stops[lastKnownIdx + j].position = startPos + stepSize * j;
			}
			lastKnownIdx = i;
		}
	}

	// Auto-correct out-of-order positions
	let maxPos = 0;
	for (const stop of stops) {
		if (stop.position! < maxPos) stop.position = maxPos;
		maxPos = stop.position!;
	}

	// Apply hints
	const finalStops: ParsedStop[] = [];
	for (let i = 0; i < stops.size(); i++) {
		const stop = stops[i];
		if (stop.isHint) {
			const prev = stops[i - 1];
			const nextStop = stops[i + 1];
			const startPos = prev.position!;
			const endPos = nextStop.position!;

			if (startPos === endPos) continue;

			// H = (hintAbsPos - stop1Pos) / (stop2Pos - stop1Pos)
			let h = (stop.position! - startPos) / (endPos - startPos);
			h = math.clamp(h, 0.01, 0.99); // avoid div by 0

			const exp = math.log(0.5) / math.log(h);
			
			// Pop the last added stop so we can replace the segment
			finalStops.pop();
			finalStops.push(prev);

			for (let sample = 1; sample <= 7; sample++) {
				const p = sample / 8;
				const f = p ** exp;
				const pos = startPos + p * (endPos - startPos);
				
				const r = prev.color.R + f * (nextStop.color.R - prev.color.R);
				const g = prev.color.G + f * (nextStop.color.G - prev.color.G);
				const b = prev.color.B + f * (nextStop.color.B - prev.color.B);
				
				const transp = prev.transparency + f * (nextStop.transparency - prev.transparency);
				
				finalStops.push({
					color: new Color3(r, g, b),
					transparency: transp,
					position: pos,
					isHint: false,
				});
			}
		} else {
			finalStops.push(stop);
		}
	}

	// Build sequences
	const colorKeypoints: ColorSequenceKeypoint[] = [];
	const alphaKeypoints: NumberSequenceKeypoint[] = [];
	let hasTransparency = false;

	// Roblox limits keypoints to 20, but we might have more.
	// For simplicity, we just push all and trust it's <= 20 or user will see engine err, 
	// but let's downsample if needed. Let's just create them as specified.
	for (const stop of finalStops) {
		const pos = math.clamp(stop.position!, 0, 1);
		colorKeypoints.push(new ColorSequenceKeypoint(pos, stop.color));
		alphaKeypoints.push(new NumberSequenceKeypoint(pos, stop.transparency));
		if (stop.transparency > 0) hasTransparency = true;
	}

	// Fix duplicate positions (Roblox requires strictly increasing times for ColorSequence, or at least no more than 2 at same time if they are immediate jumps, but usually increasing is safer)
	// We'll enforce non-decreasing and add epsilon for exact duplicates if needed.
	const uniqueColorKeypoints: ColorSequenceKeypoint[] = [];
	const uniqueAlphaKeypoints: NumberSequenceKeypoint[] = [];
	let lastTime = -1;
	for (let i = 0; i < colorKeypoints.size(); i++) {
		let t = colorKeypoints[i].Time;
		if (t <= lastTime) {
			t = math.clamp(lastTime + 0.001, 0, 1);
		}
		if (t > lastTime || uniqueColorKeypoints.size() === 0) {
			uniqueColorKeypoints.push(new ColorSequenceKeypoint(t, colorKeypoints[i].Value));
			uniqueAlphaKeypoints.push(new NumberSequenceKeypoint(t, alphaKeypoints[i].Value));
			lastTime = t;
		}
	}

	// We must cap at 20 keypoints due to Roblox engine limits. 
	// (Skipping downsampling for now as prompt doesn't strictly demand it, but good to know)
	// Let's ensure time goes exactly up to 1 for the last one if it was squished.
	if (uniqueColorKeypoints[uniqueColorKeypoints.size() - 1].Time < 1) {
		// Just ensure the last element is exactly 1, or adjust.
		// Actually, if it's less than 1, Roblox might error if the last keypoint is not at Time=1.
		const lastC = uniqueColorKeypoints[uniqueColorKeypoints.size() - 1];
		if (lastC.Time !== 1) {
			uniqueColorKeypoints.push(new ColorSequenceKeypoint(1, lastC.Value));
		}
		const lastA = uniqueAlphaKeypoints[uniqueAlphaKeypoints.size() - 1];
		if (lastA.Time !== 1) {
			uniqueAlphaKeypoints.push(new NumberSequenceKeypoint(1, lastA.Value));
		}
	}

	if (uniqueColorKeypoints[0].Time > 0) {
		const firstC = uniqueColorKeypoints[0];
		uniqueColorKeypoints.unshift(new ColorSequenceKeypoint(0, firstC.Value));
		const firstA = uniqueAlphaKeypoints[0];
		uniqueAlphaKeypoints.unshift(new NumberSequenceKeypoint(0, firstA.Value));
	}
	
	// Enforce 20 keypoints max — Roblox engine hard-limits ColorSequence/NumberSequence to 20.
	// Downsample by preserving first/last and evenly distributing interior points.
	if (uniqueColorKeypoints.size() > 20) {
		log.warn("GRADIENT_KEYPOINT_LIMIT", "Gradient exceeds 20 keypoints, downsampling", {
			count: uniqueColorKeypoints.size(),
		});

		const srcColors = [...uniqueColorKeypoints];
		const srcAlphas = [...uniqueAlphaKeypoints];
		const total = srcColors.size();

		const downsampled: ColorSequenceKeypoint[] = [srcColors[0]];
		const downsampledAlpha: NumberSequenceKeypoint[] = [srcAlphas[0]];

		// Pick 18 evenly spaced interior points
		for (let i = 1; i <= 18; i++) {
			const idx = math.floor((i / 19) * (total - 1));
			downsampled.push(srcColors[idx]);
			downsampledAlpha.push(srcAlphas[idx]);
		}

		downsampled.push(srcColors[total - 1]);
		downsampledAlpha.push(srcAlphas[total - 1]);

		// Replace the arrays in-place
		uniqueColorKeypoints.clear();
		uniqueAlphaKeypoints.clear();
		for (const kp of downsampled) uniqueColorKeypoints.push(kp);
		for (const kp of downsampledAlpha) uniqueAlphaKeypoints.push(kp);
	}

	const cSeq = new ColorSequence(uniqueColorKeypoints);
	const tSeq = hasTransparency ? new NumberSequence(uniqueAlphaKeypoints) : undefined;
	const robloxRotation = directionAngle - 90;

	return makeParsedGradient(cSeq, tSeq, robloxRotation);
}
