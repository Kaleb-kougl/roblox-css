import React, { createElement } from "@rbxts/react";
import ReactRoblox, { act } from "@rbxts/react-roblox";
import { describe, expect, it, afterEach } from "@rbxts/jest-globals";

const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const primitivesFolder = robloxCSS.WaitForChild("primitives");
const { MotionButton } = require(primitivesFolder.WaitForChild("MotionButton") as ModuleScript) as {
	MotionButton: React.FunctionComponent<any>;
};

describe("MotionButton Component", () => {
	const createdInstances: Instance[] = [];

	afterEach(() => {
		for (const inst of createdInstances) inst.Destroy();
		createdInstances.clear();
	});

	it("should export MotionButton as a function or table", () => {
		expect(typeIs(MotionButton, "function") || typeIs(MotionButton, "table")).toBe(true);
	});

	it("should render a TextButton instance without crashing", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionButton));
		});

		const button = container.FindFirstChildWhichIsA("TextButton");
		expect(button).toBeDefined();

		act(() => {
			root.unmount();
		});
	});

	it("should map string children to the Text property of the TextButton", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionButton, { children: "Click Me" as unknown as React.ReactNode } as Record<string, unknown>));
		});

		const button = container.FindFirstChildWhichIsA("TextButton") as TextButton;
		expect(button.Text).toBe("Click Me");

		act(() => {
			root.unmount();
		});
	});

	it("should apply default BackgroundTransparency and empty Text", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionButton));
		});

		const button = container.FindFirstChildWhichIsA("TextButton") as TextButton;
		expect(button.BackgroundTransparency).toBe(1);
		expect(button.Text).toBe("");

		act(() => {
			root.unmount();
		});
	});

	it("should set AutomaticSize.XY when no Size or style width/height is provided", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionButton));
		});

		const button = container.FindFirstChildWhichIsA("TextButton") as TextButton;
		expect(button.AutomaticSize).toBe(Enum.AutomaticSize.XY);

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
			root.render(createElement(MotionButton, { variants: variants, animate: "visible" }));
		});

		const button = container.FindFirstChildWhichIsA("TextButton") as TextButton;
		expect(button).toBeDefined();

		act(() => {
			root.unmount();
		});
	});

	it("should apply textTransform uppercase", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionButton, { children: "hello" as unknown as React.ReactNode, style: { textTransform: "uppercase" } } as Record<string, unknown>));
		});

		const button = container.FindFirstChildWhichIsA("TextButton") as TextButton;
		expect(button.Text).toBe("HELLO");

		act(() => {
			root.unmount();
		});
	});

	it("should apply textTransform lowercase", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionButton, { children: "HELLO" as unknown as React.ReactNode, style: { textTransform: "lowercase" } } as Record<string, unknown>));
		});

		const button = container.FindFirstChildWhichIsA("TextButton") as TextButton;
		expect(button.Text).toBe("hello");

		act(() => {
			root.unmount();
		});
	});

	it("should apply textTransform capitalize", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionButton, { children: "hello world" as unknown as React.ReactNode, style: { textTransform: "capitalize" } } as Record<string, unknown>));
		});

		const button = container.FindFirstChildWhichIsA("TextButton") as TextButton;
		expect(button.Text).toBe("Hello World");

		act(() => {
			root.unmount();
		});
	});

	it("should apply textTransform none (unchanged)", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionButton, { children: "Hello" as unknown as React.ReactNode, style: { textTransform: "none" } } as Record<string, unknown>));
		});

		const button = container.FindFirstChildWhichIsA("TextButton") as TextButton;
		expect(button.Text).toBe("Hello");

		act(() => {
			root.unmount();
		});
	});

	it("should apply textDecoration underline", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionButton, { children: "Hello" as unknown as React.ReactNode, style: { textDecoration: "underline" } } as Record<string, unknown>));
		});

		const button = container.FindFirstChildWhichIsA("TextButton") as TextButton;
		expect(button.Text).toBe("<u>Hello</u>");

		act(() => {
			root.unmount();
		});
	});

	it("should apply textDecoration line-through", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionButton, { children: "Hello" as unknown as React.ReactNode, style: { textDecoration: "line-through" } } as Record<string, unknown>));
		});

		const button = container.FindFirstChildWhichIsA("TextButton") as TextButton;
		expect(button.Text).toBe("<s>Hello</s>");

		act(() => {
			root.unmount();
		});
	});

	it("should apply textDecoration none (unchanged)", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionButton, { children: "Hello" as unknown as React.ReactNode, style: { textDecoration: "none" } } as Record<string, unknown>));
		});

		const button = container.FindFirstChildWhichIsA("TextButton") as TextButton;
		expect(button.Text).toBe("Hello");

		act(() => {
			root.unmount();
		});
	});

	it("should apply wordBreak break-all with zero-width spaces", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionButton, { children: "Hello" as unknown as React.ReactNode, style: { wordBreak: "break-all" } } as Record<string, unknown>));
		});

		const button = container.FindFirstChildWhichIsA("TextButton") as TextButton;
		expect(button.Text).toBe("H\u{200B}e\u{200B}l\u{200B}l\u{200B}o");

		act(() => {
			root.unmount();
		});
	});

	it("should apply wordBreak keep-all with newline replacement", () => {
		const container = new Instance("Folder");
		createdInstances.push(container);
		const root = ReactRoblox.createRoot(container);

		act(() => {
			root.render(createElement(MotionButton, { children: "Hello World" as unknown as React.ReactNode, style: { wordBreak: "keep-all" } } as Record<string, unknown>));
		});

		const button = container.FindFirstChildWhichIsA("TextButton") as TextButton;
		expect(button.Text).toBe("Hello\nWorld");

		act(() => {
			root.unmount();
		});
	});
});
