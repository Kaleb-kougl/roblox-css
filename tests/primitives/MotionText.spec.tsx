import React, { createElement } from "@rbxts/react";
import ReactRoblox, { act } from "@rbxts/react-roblox";
import { describe, expect, it, afterEach } from "@rbxts/jest-globals";

const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const primitivesFolder = robloxCSS.WaitForChild("primitives");
const { MotionText } = require(primitivesFolder.WaitForChild("MotionText") as ModuleScript) as {
	MotionText: React.FunctionComponent<any>;
};

describe("MotionText Component", () => {
	const createdInstances: Instance[] = [];

	afterEach(() => {
		for (const inst of createdInstances) inst.Destroy();
		createdInstances.clear();
	});

	it("should export MotionText as a function or table", () => {
		expect(typeIs(MotionText, "function") || typeIs(MotionText, "table")).toBe(true);
	});

	it("should render a TextLabel instance without crashing", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionText));
		});

		const textLabel = container.FindFirstChildWhichIsA("TextLabel");
		expect(textLabel).toBeDefined();

		act(() => {
			root.unmount();
		});
	});

	it("should map string children to the Text property", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionText, { children: "Hello World" as unknown as React.ReactNode } as Record<string, unknown>));
		});

		const textLabel = container.FindFirstChildWhichIsA("TextLabel") as TextLabel;
		expect(textLabel.Text).toBe("Hello World");

		act(() => {
			root.unmount();
		});
	});

	it("should apply default BackgroundTransparency, TextWrapped, and empty Text", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionText));
		});

		const textLabel = container.FindFirstChildWhichIsA("TextLabel") as TextLabel;
		expect(textLabel.BackgroundTransparency).toBe(1);
		expect(textLabel.TextWrapped).toBe(true);
		expect(textLabel.Text).toBe("");

		act(() => {
			root.unmount();
		});
	});

	it("should set AutomaticSize.XY when no Size or style dimensions provided", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionText));
		});

		const textLabel = container.FindFirstChildWhichIsA("TextLabel") as TextLabel;
		expect(textLabel.AutomaticSize).toBe(Enum.AutomaticSize.XY);

		act(() => {
			root.unmount();
		});
	});

	it("should render with variants and animate without crashing", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		const variants = {
			visible: { BackgroundTransparency: 0 },
			hidden: { BackgroundTransparency: 1 },
		};

		act(() => {
			root.render(createElement(MotionText, { variants: variants, animate: "visible" }));
		});

		const textLabel = container.FindFirstChildWhichIsA("TextLabel") as TextLabel;
		expect(textLabel).toBeDefined();

		act(() => {
			root.unmount();
		});
	});

	it("should apply textTransform uppercase", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionText, { children: "hello" as unknown as React.ReactNode, style: { textTransform: "uppercase" } } as Record<string, unknown>));
		});

		const textLabel = container.FindFirstChildWhichIsA("TextLabel") as TextLabel;
		expect(textLabel.Text).toBe("HELLO");

		act(() => {
			root.unmount();
		});
	});

	it("should apply textTransform lowercase", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionText, { children: "HELLO" as unknown as React.ReactNode, style: { textTransform: "lowercase" } } as Record<string, unknown>));
		});

		const textLabel = container.FindFirstChildWhichIsA("TextLabel") as TextLabel;
		expect(textLabel.Text).toBe("hello");

		act(() => {
			root.unmount();
		});
	});

	it("should apply textTransform capitalize", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionText, { children: "hello world" as unknown as React.ReactNode, style: { textTransform: "capitalize" } } as Record<string, unknown>));
		});

		const textLabel = container.FindFirstChildWhichIsA("TextLabel") as TextLabel;
		expect(textLabel.Text).toBe("Hello World");

		act(() => {
			root.unmount();
		});
	});

	it("should apply textTransform none (unchanged)", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionText, { children: "Hello" as unknown as React.ReactNode, style: { textTransform: "none" } } as Record<string, unknown>));
		});

		const textLabel = container.FindFirstChildWhichIsA("TextLabel") as TextLabel;
		expect(textLabel.Text).toBe("Hello");

		act(() => {
			root.unmount();
		});
	});

	it("should apply textDecoration underline", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionText, { children: "Hello" as unknown as React.ReactNode, style: { textDecoration: "underline" } } as Record<string, unknown>));
		});

		const textLabel = container.FindFirstChildWhichIsA("TextLabel") as TextLabel;
		expect(textLabel.Text).toBe("<u>Hello</u>");

		act(() => {
			root.unmount();
		});
	});

	it("should apply textDecoration line-through", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionText, { children: "Hello" as unknown as React.ReactNode, style: { textDecoration: "line-through" } } as Record<string, unknown>));
		});

		const textLabel = container.FindFirstChildWhichIsA("TextLabel") as TextLabel;
		expect(textLabel.Text).toBe("<s>Hello</s>");

		act(() => {
			root.unmount();
		});
	});

	it("should apply textDecoration none (unchanged)", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionText, { children: "Hello" as unknown as React.ReactNode, style: { textDecoration: "none" } } as Record<string, unknown>));
		});

		const textLabel = container.FindFirstChildWhichIsA("TextLabel") as TextLabel;
		expect(textLabel.Text).toBe("Hello");

		act(() => {
			root.unmount();
		});
	});

	it("should apply wordBreak break-all with zero-width spaces", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionText, { children: "Hello" as unknown as React.ReactNode, style: { wordBreak: "break-all" } } as Record<string, unknown>));
		});

		const textLabel = container.FindFirstChildWhichIsA("TextLabel") as TextLabel;
		expect(textLabel.Text).toBe("H\u{200B}e\u{200B}l\u{200B}l\u{200B}o");

		act(() => {
			root.unmount();
		});
	});

	it("should apply wordBreak keep-all with newline replacement", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionText, { children: "Hello World" as unknown as React.ReactNode, style: { wordBreak: "keep-all" } } as Record<string, unknown>));
		});

		const textLabel = container.FindFirstChildWhichIsA("TextLabel") as TextLabel;
		expect(textLabel.Text).toBe("Hello\nWorld");

		act(() => {
			root.unmount();
		});
	});

	it("should pass through uppercase native Roblox properties from style to the Virtual DOM", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(
				createElement(MotionText, {
					style: {
						Position: new UDim2(0, 10, 0, 20),
						TextTransparency: 0.5,
					},
				} as Record<string, unknown>)
			);
		});

		const textLabel = container.FindFirstChildWhichIsA("TextLabel") as TextLabel;
		expect(textLabel.Position).toBeDefined();
		expect(textLabel.Position.X.Offset).toBe(10);
		expect(textLabel.Position.Y.Offset).toBe(20);
		expect(textLabel.TextTransparency).toBe(0.5);

		act(() => {
			root.unmount();
		});
	});
});
