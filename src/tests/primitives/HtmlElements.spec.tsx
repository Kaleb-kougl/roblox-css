import { describe, it, expect } from "@rbxts/jest-globals";
import React from "@rbxts/react";
import ReactRoblox from "@rbxts/react-roblox";
import { Div, Span, P, H1, H2, H3 } from "../../primitives/HtmlElements";

describe("HtmlElements", () => {
	it("should render a Div as a Frame via Box", () => {
		const container = new Instance("Folder");
		const root = ReactRoblox.createRoot(container);
		
		ReactRoblox.act(() => {
			root.render(<Div style={{ backgroundColor: "#FF0000" }} />);
		});
		
		const frame = container.FindFirstChildOfClass("Frame") as Frame;
		expect(frame).toBeDefined();
		expect(frame.IsA("Frame")).toBe(true);
		
		root.unmount();
	});

	it("should render a Span as a TextLabel via InlineText", () => {
		const container = new Instance("Folder");
		const root = ReactRoblox.createRoot(container);
		
		ReactRoblox.act(() => {
			root.render(<Span Text="Hello World" />);
		});
		
		// InlineText may render a Text primitive inside
		const label = container.FindFirstChildOfClass("TextLabel") as TextLabel;
		expect(label).toBeDefined();
		expect(label.Text).toBe("Hello World");
		
		root.unmount();
	});

	it("should render P, H1, H2, H3 as TextLabels with varying default font sizes", () => {
		const container = new Instance("Folder");
		const root = ReactRoblox.createRoot(container);
		
		ReactRoblox.act(() => {
			root.render(
				<Div>
					<P Text="Paragraph" />
					<H1 Text="Heading 1" />
					<H2 Text="Heading 2" />
					<H3 Text="Heading 3" />
				</Div>
			);
		});
		
		const frame = container.FindFirstChildOfClass("Frame") as Frame;
		expect(frame).toBeDefined();

		const p = frame.FindFirstChild("1") as TextLabel;
		const h1 = frame.FindFirstChild("2") as TextLabel;
		const h2 = frame.FindFirstChild("3") as TextLabel;
		const h3 = frame.FindFirstChild("4") as TextLabel;
		
		expect(p).toBeDefined();
		expect(p.Text).toBe("Paragraph");
		expect(p.TextSize).toBe(16);
		
		expect(h1).toBeDefined();
		expect(h1.Text).toBe("Heading 1");
		expect(h1.TextSize).toBe(32);
		
		expect(h2).toBeDefined();
		expect(h2.TextSize).toBe(24);
		
		expect(h3).toBeDefined();
		expect(h3.TextSize).toBe(18);
		
		root.unmount();
	});
});
