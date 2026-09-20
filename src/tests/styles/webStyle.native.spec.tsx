const _jestGlobals = require(
	game.GetService("ReplicatedStorage")
		.WaitForChild("rbxts_include")
		.WaitForChild("node_modules")
		.WaitForChild("@rbxts")
		.WaitForChild("jest-globals")
		.WaitForChild("src") as ModuleScript
) as typeof import("@rbxts/jest-globals");
const { describe, expect, it } = _jestGlobals;

// Dynamically require client files to bypass roblox-ts isolated container checks
const robloxCSS = game.GetService("ReplicatedStorage").WaitForChild("roblox-css");
const uiStyles = robloxCSS.WaitForChild("styles");

type ReactElementStub = {
	type: string;
	props: Record<string, unknown>;
};

const webStyleModule = require(uiStyles.WaitForChild("webStyle") as ModuleScript) as {
	webStyle: (
		style: Record<string, unknown>,
		hostText?: string,
	) => { props: Record<string, unknown>; children: ReactElementStub[] };
};
const webStyle = webStyleModule.webStyle;

describe("webStyle middleware", () => {
	it("maps order to LayoutOrder", () => {
		const result = webStyle({ order: 5 });
		expect(result.props.LayoutOrder).toBe(5);
	});

	it("paddingInline and paddingBlock override padding but yield to specific sides", () => {
		const result = webStyle({
			padding: "10px",
			paddingInline: "20px",
			paddingBlock: "30px",
			paddingLeft: "40px",
		});
		
		const paddingEl = result.children.find((c) => c.props.key === "uipadding");
		expect(paddingEl).toBeDefined();
		expect(((paddingEl as ReactElementStub).props.PaddingTop as UDim).Offset).toBe(30);
		expect(((paddingEl as ReactElementStub).props.PaddingBottom as UDim).Offset).toBe(30);
		expect(((paddingEl as ReactElementStub).props.PaddingRight as UDim).Offset).toBe(20);
		expect(((paddingEl as ReactElementStub).props.PaddingLeft as UDim).Offset).toBe(40);
	});

	it("outline injects UIStroke like border", () => {
		const result = webStyle({ outline: "2px solid #FF0000" });
		const strokeEl = result.children.find((c) => c.props.key === "uistroke");
		expect(strokeEl).toBeDefined();
		expect((strokeEl as ReactElementStub).props.Thickness).toBe(2);
		expect((strokeEl as ReactElementStub).props.Color).toBeDefined();
	});

	it("placeItems and placeContent map correctly", () => {
		const result = webStyle({ display: "flex", flexDirection: "column", placeItems: "center stretch", placeContent: "flex-end space-between" });
		const layoutEl = result.children.find((c) => c.props.key === "uilistlayout");
		expect(layoutEl).toBeDefined();
		expect((layoutEl as ReactElementStub).props.ItemLineAlignment).toBe(Enum.ItemLineAlignment.Stretch);
		expect((layoutEl as ReactElementStub).props.VerticalFlex).toBe(Enum.UIFlexAlignment.SpaceBetween);
	});

	it("flexFlow maps to FillDirection and Wraps", () => {
		const result = webStyle({ display: "flex", flexFlow: "row wrap" });
		const layoutEl = result.children.find((c) => c.props.key === "uilistlayout");
		expect(layoutEl).toBeDefined();
		expect((layoutEl as ReactElementStub).props.FillDirection).toBe(Enum.FillDirection.Horizontal);
		expect((layoutEl as ReactElementStub).props.Wraps).toBe(true);
	});

	it("borderRadius degradation", () => {
		const result = webStyle({ borderRadius: "10px 5px" });
		const cornerEl = result.children.find((c) => c.props.key === "uicorner");
		expect(cornerEl).toBeDefined();
		expect(((cornerEl as ReactElementStub).props.CornerRadius as UDim).Offset).toBe(10);
	});

	it("individual rounded corners map to UICorner corner radius fields", () => {
		const result = webStyle({
			borderRadius: "10px",
			borderTopRightRadius: "20px",
			borderBottomLeftRadius: "30px",
		});
		const cornerEl = result.children.find((c) => c.props.key === "uicorner");
		expect(cornerEl).toBeDefined();
		expect(((cornerEl as ReactElementStub).props.TopLeftRadius as UDim).Offset).toBe(10);
		expect(((cornerEl as ReactElementStub).props.TopRightRadius as UDim).Offset).toBe(20);
		expect(((cornerEl as ReactElementStub).props.BottomRightRadius as UDim).Offset).toBe(10);
		expect(((cornerEl as ReactElementStub).props.BottomLeftRadius as UDim).Offset).toBe(30);
	});

	it("individual rounded corners expand shorthand fallbacks", () => {
		const result = webStyle({
			borderRadius: "1px 2px 3px 4px",
			borderTopLeftRadius: "5px",
		});
		const cornerEl = result.children.find((c) => c.props.key === "uicorner");
		expect(cornerEl).toBeDefined();
		expect(((cornerEl as ReactElementStub).props.TopLeftRadius as UDim).Offset).toBe(5);
		expect(((cornerEl as ReactElementStub).props.TopRightRadius as UDim).Offset).toBe(2);
		expect(((cornerEl as ReactElementStub).props.BottomRightRadius as UDim).Offset).toBe(3);
		expect(((cornerEl as ReactElementStub).props.BottomLeftRadius as UDim).Offset).toBe(4);
	});

	it("background gradients can set UIGradient offset and rotation overrides", () => {
		const result = webStyle({
			background: "linear-gradient(to right, red, blue)",
			backgroundGradientOffset: "0.25 -0.5",
			backgroundGradientRotation: 45,
		});
		const gradientEl = result.children.find((c) => c.props.key === "uigradient");
		expect(gradientEl).toBeDefined();
		expect(((gradientEl as ReactElementStub).props.Offset as Vector2).X).toBe(0.25);
		expect(((gradientEl as ReactElementStub).props.Offset as Vector2).Y).toBe(-0.5);
		expect((gradientEl as ReactElementStub).props.Rotation).toBe(45);
	});

	it("border strokes map native UIStroke controls and alpha", () => {
		const result = webStyle({
			border: "4px solid rgba(255, 0, 0, 0.25)",
			borderOffset: "2px",
			borderStrokePosition: "outer",
			lineJoinMode: "bevel",
			strokeSizingMode: "scaled",
			strokeZIndex: 3,
		});
		const strokeEl = result.children.find((c) => c.props.key === "uistroke");
		expect(strokeEl).toBeDefined();
		expect((strokeEl as ReactElementStub).props.Thickness).toBe(4);
		expect((strokeEl as ReactElementStub).props.Transparency).toBe(0.75);
		expect(((strokeEl as ReactElementStub).props.BorderOffset as UDim).Offset).toBe(2);
		expect((strokeEl as ReactElementStub).props.BorderStrokePosition).toBe(Enum.BorderStrokePosition.Outer);
		expect((strokeEl as ReactElementStub).props.LineJoinMode).toBe(Enum.LineJoinMode.Bevel);
		expect((strokeEl as ReactElementStub).props.StrokeSizingMode).toBe(Enum.StrokeSizingMode.ScaledSize);
		expect((strokeEl as ReactElementStub).props.ZIndex).toBe(3);
	});

	it("strokeTransparency overrides rgba alpha", () => {
		const result = webStyle({
			border: "2px solid rgba(255, 0, 0, 0.25)",
			strokeTransparency: 0.2,
		});
		const strokeEl = result.children.find((c) => c.props.key === "uistroke");
		expect(strokeEl).toBeDefined();
		expect((strokeEl as ReactElementStub).props.Transparency).toBe(0.2);
	});

	it("strokeGradient injects a child UIGradient on UIStroke", () => {
		const result = webStyle({
			border: "2px solid white",
			strokeGradient: "linear-gradient(to bottom, red, blue)",
			strokeGradientOffset: "0.1 0",
			strokeGradientRotation: 15,
		});
		const strokeEl = result.children.find((c) => c.props.key === "uistroke");
		const gradientEl = (strokeEl as ReactElementStub).props.children as ReactElementStub;
		expect(strokeEl).toBeDefined();
		expect(gradientEl).toBeDefined();
		expect(gradientEl.props.key).toBe("uistroke-gradient");
		expect((gradientEl.props.Offset as Vector2).X).toBe(0.1);
		expect(gradientEl.props.Rotation).toBe(15);
	});

	it("border color can be a gradient child", () => {
		const result = webStyle({
			border: "2px solid linear-gradient(to right, red, blue)",
		});
		const strokeEl = result.children.find((c) => c.props.key === "uistroke");
		const gradientEl = (strokeEl as ReactElementStub).props.children as ReactElementStub;
		expect(strokeEl).toBeDefined();
		expect(gradientEl).toBeDefined();
		expect(gradientEl.props.key).toBe("uistroke-gradient");
	});

	it("textStroke receives native UIStroke controls", () => {
		const result = webStyle({
			textStroke: "3px solid rgba(0, 0, 0, 0.5)",
			lineJoinMode: "miter",
			strokeSizingMode: "fixed",
			strokeTransparency: 0.1,
			strokeZIndex: 7,
		});
		const strokeEl = result.children.find((c) => c.props.key === "uitextstroke");
		expect(strokeEl).toBeDefined();
		expect((strokeEl as ReactElementStub).props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Contextual);
		expect((strokeEl as ReactElementStub).props.LineJoinMode).toBe(Enum.LineJoinMode.Miter);
		expect((strokeEl as ReactElementStub).props.StrokeSizingMode).toBe(Enum.StrokeSizingMode.FixedSize);
		expect((strokeEl as ReactElementStub).props.Transparency).toBe(0.1);
		expect((strokeEl as ReactElementStub).props.ZIndex).toBe(7);
	});

	it("boxShadow can opt into native UIShadow properties", () => {
		const result = webStyle({
			boxShadow: "0 6px 12px 2px rgba(0, 0, 0, 0.4)",
			boxShadowMode: "uishadow",
			shadowTransparency: 0.25,
		});
		const shadowEl = result.children.find((c) => c.props.key === "uishadow");
		expect(shadowEl).toBeDefined();
		expect(((shadowEl as ReactElementStub).props.Offset as UDim2).Y.Offset).toBe(6);
		expect(((shadowEl as ReactElementStub).props.BlurRadius as UDim).Offset).toBe(12);
		expect(((shadowEl as ReactElementStub).props.Spread as UDim2).X.Offset).toBe(2);
		expect((shadowEl as ReactElementStub).props.Transparency).toBe(0.25);
	});

	it("shadow props create native UIShadow without boxShadow", () => {
		const result = webStyle({
			shadowBlurRadius: "8px",
			shadowColor: "rgba(10, 20, 30, 0.25)",
			shadowOffset: "3px -4px",
			shadowSpread: "5px 6px",
			shadowZIndex: 9,
		});
		const shadowEl = result.children.find((c) => c.props.key === "uishadow");
		expect(shadowEl).toBeDefined();
		expect(((shadowEl as ReactElementStub).props.BlurRadius as UDim).Offset).toBe(8);
		expect(((shadowEl as ReactElementStub).props.Offset as UDim2).X.Offset).toBe(3);
		expect(((shadowEl as ReactElementStub).props.Offset as UDim2).Y.Offset).toBe(-4);
		expect(((shadowEl as ReactElementStub).props.Spread as UDim2).X.Offset).toBe(5);
		expect(((shadowEl as ReactElementStub).props.Spread as UDim2).Y.Offset).toBe(6);
		expect((shadowEl as ReactElementStub).props.Transparency).toBe(0.75);
		expect((shadowEl as ReactElementStub).props.ZIndex).toBe(9);
	});

	it("CSS-like boxShadow can stay on image fallback when requested", () => {
		const result = webStyle({
			boxShadow: "1px 2px 3px 4px #ff0000",
			boxShadowMode: "image",
		});
		const imageEl = result.children.find((c) => c.props.key === "box-shadow");
		const shadowEl = result.children.find((c) => c.props.key === "uishadow");
		expect(imageEl).toBeDefined();
		expect(shadowEl).toBeUndefined();
	});

	it("backgroundSize cover maps to Crop", () => {
		const result = webStyle({ backgroundImage: "url('rbxassetid://123')", backgroundSize: "cover" });
		const imageEl = result.children.find((c) => c.props.key === "uibackgroundimage");
		expect(imageEl).toBeDefined();
		expect((imageEl as ReactElementStub).props.ScaleType).toBe(Enum.ScaleType.Crop);
	});

	it("maps documented image label and image button properties", () => {
		const result = webStyle({
			image: "rbxassetid://1",
			hoverImage: "rbxassetid://2",
			pressedImage: "rbxassetid://3",
			imageColor: "#336699",
			imageTransparency: 0.25,
		});

		expect(result.props.Image).toBe("rbxassetid://1");
		expect(result.props.HoverImage).toBe("rbxassetid://2");
		expect(result.props.PressedImage).toBe("rbxassetid://3");
		expect(result.props.ImageTransparency).toBe(0.25);
		expect(result.props.ImageColor3).toBeDefined();
	});

	it("maps documented scrolling frame canvas, inset, scrollbar, and elasticity properties", () => {
		const result = webStyle({
			canvasSize: "100% 420px",
			automaticCanvasSize: "y",
			canvasPosition: "4 12",
			verticalScrollBarInset: "scrollbar",
			horizontalScrollBarInset: "always",
			verticalScrollBarPosition: "left",
			scrollBarThickness: 10,
			scrollBarImageColor: "white",
			scrollBarImageTransparency: 0.4,
			scrollBarTopImage: "rbxassetid://top",
			scrollBarMidImage: "rbxassetid://mid",
			scrollBarBottomImage: "rbxassetid://bottom",
			elasticBehavior: "never",
		});

		const canvasSize = result.props.CanvasSize as UDim2;
		const canvasPosition = result.props.CanvasPosition as Vector2;
		expect(canvasSize.X.Scale).toBe(1);
		expect(canvasSize.Y.Offset).toBe(420);
		expect(result.props.AutomaticCanvasSize).toBe(Enum.AutomaticSize.Y);
		expect(canvasPosition.X).toBe(4);
		expect(canvasPosition.Y).toBe(12);
		expect(result.props.VerticalScrollBarInset).toBe(Enum.ScrollBarInset.ScrollBar);
		expect(result.props.HorizontalScrollBarInset).toBe(Enum.ScrollBarInset.Always);
		expect(result.props.VerticalScrollBarPosition).toBe(Enum.VerticalScrollBarPosition.Left);
		expect(result.props.ScrollBarThickness).toBe(10);
		expect(result.props.ScrollBarImageColor3).toBeDefined();
		expect(result.props.ScrollBarImageTransparency).toBe(0.4);
		expect(result.props.TopImage).toBe("rbxassetid://top");
		expect(result.props.MidImage).toBe("rbxassetid://mid");
		expect(result.props.BottomImage).toBe("rbxassetid://bottom");
		expect(result.props.ElasticBehavior).toBe(Enum.ElasticBehavior.Never);
	});

	it("maps documented viewport, video, and 2D path visual properties", () => {
		const result = webStyle({
			viewportAmbient: "rgb(200, 200, 200)",
			viewportLightColor: "rgb(140, 140, 140)",
			viewportLightDirection: "-1 -1 -1",
			video: "rbxassetid://5608384572",
			looped: true,
			playing: true,
			pathColor: "#ff0032",
			pathThickness: 10,
		});

		const lightDirection = result.props.LightDirection as Vector3;
		expect(result.props.Ambient).toBeDefined();
		expect(result.props.LightColor).toBeDefined();
		expect(lightDirection.X).toBe(-1);
		expect(lightDirection.Y).toBe(-1);
		expect(lightDirection.Z).toBe(-1);
		expect(result.props.Video).toBe("rbxassetid://5608384572");
		expect(result.props.Looped).toBe(true);
		expect(result.props.Playing).toBe(true);
		expect(result.props.Color3).toBeDefined();
		expect(result.props.Thickness).toBe(10);
	});

	it("maps documented proximity prompt properties", () => {
		const result = webStyle({
			promptObjectText: "Door",
			promptActionText: "Open",
			promptKeyboardKeyCode: "E",
			promptGamepadKeyCode: "ButtonR1",
			promptMaxActivationDistance: 12,
			promptRequiresLineOfSight: false,
			promptExclusivity: "always-show",
			promptHoldDuration: 0.5,
			promptClickable: true,
		});

		expect(result.props.ObjectText).toBe("Door");
		expect(result.props.ActionText).toBe("Open");
		expect(result.props.KeyboardKeyCode).toBe(Enum.KeyCode.E);
		expect(result.props.GamepadKeyCode).toBe(Enum.KeyCode.ButtonR1);
		expect(result.props.MaxActivationDistance).toBe(12);
		expect(result.props.RequiresLineOfSight).toBe(false);
		expect(result.props.Exclusivity).toBe(Enum.ProximityPromptExclusivity.AlwaysShow);
		expect(result.props.HoldDuration).toBe(0.5);
		expect(result.props.ClickablePrompt).toBe(true);
	});

	it("maps documented UI drag detector properties", () => {
		const result = webStyle({
			uiDragStyle: "translate-line",
			uiDragResponseStyle: "custom-scale",
			uiDragAxis: "0 1",
			uiDragMinTranslation: "0px 0px",
			uiDragMaxTranslation: "100% 12px",
			uiDragMinAngle: -45,
			uiDragMaxAngle: 45,
			uiDragBoundingBehavior: "hit-point",
			uiDragSpeedAxisMapping: "xx",
		});

		const dragAxis = result.props.DragAxis as Vector2;
		const maxTranslation = result.props.MaxDragTranslation as UDim2;
		expect(result.props.DragStyle).toBe(Enum.UIDragDetectorDragStyle.TranslateLine);
		expect(result.props.ResponseStyle).toBe(Enum.UIDragDetectorResponseStyle.CustomScale);
		expect(dragAxis.X).toBe(0);
		expect(dragAxis.Y).toBe(1);
		expect(maxTranslation.X.Scale).toBe(1);
		expect(maxTranslation.Y.Offset).toBe(12);
		expect(result.props.MinDragAngle).toBe(-45);
		expect(result.props.MaxDragAngle).toBe(45);
		expect(result.props.BoundingBehavior).toBe(Enum.UIDragDetectorBoundingBehavior.HitPoint);
		expect(result.props.UIDragSpeedAxisMapping).toBe(Enum.UIDragSpeedAxisMapping.XX);
	});

	it("maps documented list and grid layout ordering controls", () => {
		const list = webStyle({
			display: "flex",
			flexDirection: "row",
			justifyContent: "space-evenly",
			sortOrder: "name",
		});
		const listLayout = list.children.find((c) => c.props.key === "uilistlayout");
		expect(listLayout).toBeDefined();
		expect((listLayout as ReactElementStub).props.FillDirection).toBe(Enum.FillDirection.Horizontal);
		expect((listLayout as ReactElementStub).props.HorizontalFlex).toBe(Enum.UIFlexAlignment.SpaceEvenly);
		expect((listLayout as ReactElementStub).props.SortOrder).toBe(Enum.SortOrder.Name);

		const grid = webStyle({
			display: "grid",
			gridMaxCells: 3,
			gridStartCorner: "bottom-right",
			sortOrder: "name",
		});
		const gridLayout = grid.children.find((c) => c.props.key === "uigridlayout");
		expect(gridLayout).toBeDefined();
		expect((gridLayout as ReactElementStub).props.FillDirectionMaxCells).toBe(3);
		expect((gridLayout as ReactElementStub).props.StartCorner).toBe(Enum.StartCorner.BottomRight);
		expect((gridLayout as ReactElementStub).props.SortOrder).toBe(Enum.SortOrder.Name);
	});

	it("maps documented table and page layout properties", () => {
		const tableResult = webStyle({
			display: "table",
			tableMajorAxis: "column-major",
			tableFillEmptySpaceColumns: true,
			tableFillEmptySpaceRows: true,
			tablePadding: "4px 8px",
		});
		const tableLayout = tableResult.children.find((c) => c.props.key === "uitablelayout");
		expect(tableLayout).toBeDefined();
		expect((tableLayout as ReactElementStub).props.FillDirection).toBe(Enum.FillDirection.Vertical);
		expect((tableLayout as ReactElementStub).props.MajorAxis).toBe(Enum.TableMajorAxis.ColumnMajor);
		expect((tableLayout as ReactElementStub).props.FillEmptySpaceColumns).toBe(true);
		expect((tableLayout as ReactElementStub).props.FillEmptySpaceRows).toBe(true);
		expect(((tableLayout as ReactElementStub).props.Padding as UDim2).X.Offset).toBe(4);
		expect(((tableLayout as ReactElementStub).props.Padding as UDim2).Y.Offset).toBe(8);

		const page = webStyle({
			display: "page",
			pageFillDirection: "row",
			pagePadding: "12px",
			pageAnimated: true,
			pageCircular: true,
			pageTweenTime: 0.35,
			pageEasingStyle: "cubic",
			pageEasingDirection: "in-out",
			pageGamepadInputEnabled: false,
			pageScrollWheelInputEnabled: false,
			pageTouchInputEnabled: true,
		});
		const pageLayout = page.children.find((c) => c.props.key === "uipagelayout");
		expect(pageLayout).toBeDefined();
		expect((pageLayout as ReactElementStub).props.FillDirection).toBe(Enum.FillDirection.Horizontal);
		expect(((pageLayout as ReactElementStub).props.Padding as UDim).Offset).toBe(12);
		expect((pageLayout as ReactElementStub).props.Animated).toBe(true);
		expect((pageLayout as ReactElementStub).props.Circular).toBe(true);
		expect((pageLayout as ReactElementStub).props.TweenTime).toBe(0.35);
		expect((pageLayout as ReactElementStub).props.EasingStyle).toBe(Enum.EasingStyle.Cubic);
		expect((pageLayout as ReactElementStub).props.EasingDirection).toBe(Enum.EasingDirection.InOut);
		expect((pageLayout as ReactElementStub).props.GamepadInputEnabled).toBe(false);
		expect((pageLayout as ReactElementStub).props.ScrollWheelInputEnabled).toBe(false);
		expect((pageLayout as ReactElementStub).props.TouchInputEnabled).toBe(true);
	});

	it("maps documented size, text animation, and CanvasGroup properties", () => {
		const result = webStyle({
			scale: 1.5,
			textScaled: true,
			minTextSize: 9,
			maxTextSize: 48,
			maxVisibleGraphemes: 12,
			textStrokeColor: "#00ff00",
			textStrokeTransparency: 0.25,
			autoLocalize: false,
			groupColor: "#336699",
			groupTransparency: 0.4,
		});

		const scale = result.children.find((c) => c.props.key === "uiscale");
		const textConstraint = result.children.find((c) => c.props.key === "uitextsizeconstraint");
		expect(scale).toBeDefined();
		expect((scale as ReactElementStub).props.Scale).toBe(1.5);
		expect(textConstraint).toBeDefined();
		expect((textConstraint as ReactElementStub).props.MinTextSize).toBe(9);
		expect((textConstraint as ReactElementStub).props.MaxTextSize).toBe(48);
		expect(result.props.TextScaled).toBe(true);
		expect(result.props.MaxVisibleGraphemes).toBe(12);
		expect(result.props.TextStrokeColor3).toBeDefined();
		expect(result.props.TextStrokeTransparency).toBe(0.25);
		expect(result.props.AutoLocalize).toBe(false);
		expect(result.props.GroupColor3).toBeDefined();
		expect(result.props.GroupTransparency).toBe(0.4);
	});

	it("maps documented 3D drag detector properties", () => {
		const result = webStyle({
			dragStyle: "translate-view-plane",
			dragResponseStyle: "physical",
			dragAxis: "0 1 0",
			dragOrientation: "0 90 0",
			dragMinTranslation: "0 0 0",
			dragMaxTranslation: "10 0 10",
			dragMinAngle: 0,
			dragMaxAngle: 90,
			dragPermissionPolicy: "scriptable",
			dragApplyAtCenterOfMass: true,
			dragMaxForce: 100000,
			dragMaxTorque: 5000,
			dragResponsiveness: 20,
			dragRunLocally: true,
		});

		const axis = result.props.Axis as Vector3;
		const orientation = result.props.Orientation as Vector3;
		const maxTranslation = result.props.MaxDragTranslation as Vector3;
		expect(result.props.DragStyle).toBe(Enum.DragDetectorDragStyle.TranslateViewPlane);
		expect(result.props.ResponseStyle).toBe(Enum.DragDetectorResponseStyle.Physical);
		expect(axis.Y).toBe(1);
		expect(orientation.Y).toBe(90);
		expect(maxTranslation.X).toBe(10);
		expect(maxTranslation.Z).toBe(10);
		expect(result.props.PermissionPolicy).toBe(Enum.DragDetectorPermissionPolicy.Scriptable);
		expect(result.props.ApplyAtCenterOfMass).toBe(true);
		expect(result.props.MaxForce).toBe(100000);
		expect(result.props.MaxTorque).toBe(5000);
		expect(result.props.Responsiveness).toBe(20);
		expect(result.props.RunLocally).toBe(true);
	});
});
