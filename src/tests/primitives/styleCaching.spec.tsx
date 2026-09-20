/**
 * styleCaching.spec.tsx — Regression tests for the useWebStyle parse cache.
 *
 * The primitives reuse a cached webStyle() result across renders. Text and
 * Image post-process that result (multiplying transparency by `opacity`), so
 * these tests pin the behaviour that would break if the cached table were
 * mutated in place: the value must be identical after a re-render, not
 * compounded.
 */

import { describe, it, expect } from "@rbxts/jest-globals";
import React from "@rbxts/react";
import ReactRoblox from "@rbxts/react-roblox";
import { Text } from "../../primitives/Text";
import { Image } from "../../primitives/Image";
import { Box } from "../../primitives/Box";

describe("useWebStyle parse cache", () => {
	it("should not compound Text opacity across re-renders", () => {
		const container = new Instance("Folder");
		const root = ReactRoblox.createRoot(container);

		ReactRoblox.act(() => {
			// A fresh style table each render — the shape the cache must handle.
			root.render(<Text Text="hi" style={{ color: "#ffffff", opacity: 0.5 }} />);
		});

		const label = container.FindFirstChildOfClass("TextLabel") as TextLabel;
		const afterFirst = label.TextTransparency;

		ReactRoblox.act(() => {
			root.render(<Text Text="hi" style={{ color: "#ffffff", opacity: 0.5 }} />);
		});
		ReactRoblox.act(() => {
			root.render(<Text Text="hi" style={{ color: "#ffffff", opacity: 0.5 }} />);
		});

		expect(label.TextTransparency).toBe(afterFirst);

		root.unmount();
		container.Destroy();
	});

	it("should not compound Image opacity across re-renders", () => {
		const container = new Instance("Folder");
		const root = ReactRoblox.createRoot(container);

		ReactRoblox.act(() => {
			root.render(<Image src="rbxassetid://12345" style={{ opacity: 0.5 }} />);
		});

		const image = container.FindFirstChildOfClass("ImageLabel") as ImageLabel;
		const afterFirst = image.ImageTransparency;

		ReactRoblox.act(() => {
			root.render(<Image src="rbxassetid://12345" style={{ opacity: 0.5 }} />);
		});
		ReactRoblox.act(() => {
			root.render(<Image src="rbxassetid://12345" style={{ opacity: 0.5 }} />);
		});

		expect(image.ImageTransparency).toBe(afterFirst);

		root.unmount();
		container.Destroy();
	});

	it("should still apply a changed style after a cached render", () => {
		const container = new Instance("Folder");
		const root = ReactRoblox.createRoot(container);

		ReactRoblox.act(() => {
			root.render(<Box style={{ width: "100px", height: "50px" }} />);
		});
		ReactRoblox.act(() => {
			// Same values, new table — should hit the cache and change nothing.
			root.render(<Box style={{ width: "100px", height: "50px" }} />);
		});

		const frame = container.FindFirstChildOfClass("Frame") as Frame;
		expect(frame.Size.X.Offset).toBe(100);

		ReactRoblox.act(() => {
			root.render(<Box style={{ width: "200px", height: "50px" }} />);
		});

		expect(frame.Size.X.Offset).toBe(200);

		root.unmount();
		container.Destroy();
	});

	it("should reparse when only the text content changes", () => {
		// hostText is part of the cache key because webStyle() lays out
		// textShadow against the final string.
		const container = new Instance("Folder");
		const root = ReactRoblox.createRoot(container);

		ReactRoblox.act(() => {
			root.render(<Text Text="first" style={{ textShadow: "2px 2px #000000" }} />);
		});

		const label = container.FindFirstChildOfClass("TextLabel") as TextLabel;
		const shadow = label.FindFirstChild("textShadow") as TextLabel;
		expect(shadow.Text).toBe("first");

		ReactRoblox.act(() => {
			root.render(<Text Text="second" style={{ textShadow: "2px 2px #000000" }} />);
		});

		expect((label.FindFirstChild("textShadow") as TextLabel).Text).toBe("second");

		root.unmount();
		container.Destroy();
	});
});
