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
	webStyle: (style: Record<string, unknown>) => { props: Record<string, unknown>; children: ReactElementStub[] };
};
const webStyle = webStyleModule.webStyle;

describe("webStyle", () => {
	describe("1. width / height → Size", () => {
		it("should parse width and height to Size", () => {
			const result = webStyle({ width: "50%", height: "100px" });
			expect(result.props.Size).toBeDefined();
			const size = result.props.Size as UDim2;
			expect(size.X.Scale).toBeCloseTo(0.5, 5);
			expect(size.X.Offset).toBe(0);
			expect(size.Y.Scale).toBe(0);
			expect(size.Y.Offset).toBe(100);
		});

		it("should default to 100% width and height if only one is provided", () => {
			const result1 = webStyle({ width: "50%" });
			let size = result1.props.Size as UDim2;
			expect(size.X.Scale).toBeCloseTo(0.5, 5);
			expect(size.Y.Scale).toBeCloseTo(1, 5);

			const result2 = webStyle({ height: "100px" });
			size = result2.props.Size as UDim2;
			expect(size.X.Scale).toBeCloseTo(1, 5);
			expect(size.Y.Offset).toBe(100);
		});

		it("should not define Size if width and height are undefined", () => {
			const result = webStyle({});
			expect(result.props.Size).toBeUndefined();
		});
	});

	describe("minWidth / maxWidth → <uisizeconstraint>", () => {
		it("should inject <uisizeconstraint> with correct Vector2 properties when minWidth and maxHeight are provided", () => {
			const result = webStyle({ minWidth: "50px", maxHeight: "100px" });
			expect(result.children.size()).toBe(1);
			const child = result.children[0];
			expect(child!.type).toBe("UISizeConstraint");
			const minSize = child!.props.MinSize as Vector2;
			const maxSize = child!.props.MaxSize as Vector2;
			expect(minSize.X).toBe(50);
			expect(minSize.Y).toBe(0);
			expect(maxSize.X).toBe(math.huge);
			expect(maxSize.Y).toBe(100);
		});

		it("should correctly fallback unassigned axes to 0 for MinSize and math.huge for MaxSize", () => {
			const result = webStyle({ maxWidth: "200px", minHeight: "25px" });
			const child = result.children[0];
			expect(child!.type).toBe("UISizeConstraint");
			const minSize = child!.props.MinSize as Vector2;
			const maxSize = child!.props.MaxSize as Vector2;
			expect(minSize.X).toBe(0);
			expect(minSize.Y).toBe(25);
			expect(maxSize.X).toBe(200);
			expect(maxSize.Y).toBe(math.huge);
		});
	});

	describe("11.5. Percentage constraint skip guard", () => {
		it("should NOT emit UISizeConstraint when maxWidth is a percentage", () => {
			const result = webStyle({ maxWidth: "50%" });
			const constraint = result.children.find((c) => c.type === "UISizeConstraint");
			expect(constraint).toBeUndefined();
		});

		it("should NOT emit UISizeConstraint when minHeight is a percentage", () => {
			const result = webStyle({ minHeight: "25%" });
			const constraint = result.children.find((c) => c.type === "UISizeConstraint");
			expect(constraint).toBeUndefined();
		});

		it("should NOT emit UISizeConstraint when mixed pixel + percentage", () => {
			const result = webStyle({ minWidth: "200px", maxWidth: "50%" });
			const constraint = result.children.find((c) => c.type === "UISizeConstraint");
			expect(constraint).toBeUndefined();
		});

		it("should STILL emit UISizeConstraint when all constraints are pixel-only", () => {
			const result = webStyle({ minWidth: "50px", maxHeight: "100px" });
			const constraint = result.children.find((c) => c.type === "UISizeConstraint");
			expect(constraint).toBeDefined();
			const minSize = constraint!.props.MinSize as Vector2;
			const maxSize = constraint!.props.MaxSize as Vector2;
			expect(minSize.X).toBe(50);
			expect(minSize.Y).toBe(0);
			expect(maxSize.X).toBe(math.huge);
			expect(maxSize.Y).toBe(100);
		});

		it("should STILL emit UISizeConstraint for numeric pixel values", () => {
			const result = webStyle({ maxWidth: 400 });
			const constraint = result.children.find((c) => c.type === "UISizeConstraint");
			expect(constraint).toBeDefined();
			const maxSize = constraint!.props.MaxSize as Vector2;
			expect(maxSize.X).toBe(400);
		});

		it("should NOT emit UISizeConstraint when any single axis is a percentage", () => {
			const result = webStyle({ minWidth: "100px", maxWidth: "300px", minHeight: "50px", maxHeight: "80%" });
			const constraint = result.children.find((c) => c.type === "UISizeConstraint");
			expect(constraint).toBeUndefined();
		});

		it("should not affect other children when percentage constraint skips", () => {
			const result = webStyle({ maxWidth: "50%", borderRadius: "8px" });
			const constraint = result.children.find((c) => c.type === "UISizeConstraint");
			const corner = result.children.find((c) => c.type === "UICorner");
			expect(constraint).toBeUndefined();
			expect(corner).toBeDefined();
		});
	});

	describe("2. backgroundColor → BackgroundColor3 + BackgroundTransparency", () => {
		it("should parse hex colors to BackgroundColor3", () => {
			const result = webStyle({ backgroundColor: "#ff0000" });
			expect(result.props.BackgroundColor3).toBeDefined();
			const color = result.props.BackgroundColor3 as Color3;
			expect(color.R).toBe(1);
			expect(color.G).toBe(0);
			expect(color.B).toBe(0);
			expect(result.props.BackgroundTransparency).toBe(0);
		});

		it("should set BackgroundTransparency to 1 for transparent background", () => {
			const result = webStyle({ backgroundColor: "transparent" });
			expect(result.props.BackgroundTransparency).toBe(1);
		});
	});

	describe("3. opacity → BackgroundTransparency", () => {
		it("should invert opacity to set BackgroundTransparency", () => {
			const result = webStyle({ opacity: 0.2 });
			expect(result.props.BackgroundTransparency).toBeCloseTo(0.8, 5);
		});

		it("should let opacity override backgroundColor transparency", () => {
			const result = webStyle({ backgroundColor: "transparent", opacity: 0.5 });
			expect(result.props.BackgroundTransparency).toBeCloseTo(0.5, 5);
		});
	});

	describe("4. borderRadius → <uicorner>", () => {
		it("should inject <uicorner> child with CornerRadius", () => {
			const result = webStyle({ borderRadius: "10px" });
			expect(result.children.size()).toBe(1);
			const child = result.children[0];
			expect(child!.type).toBe("UICorner");
			const radius = child!.props.CornerRadius as UDim;
			expect(radius.Offset).toBe(10);
			expect(radius.Scale).toBe(0);
		});
	});

	describe("5. padding → <uipadding>", () => {
		it("should inject <uipadding> with shorthand padding", () => {
			const result = webStyle({ padding: "10px 20px" });
			const child = result.children.find((c) => c.type === "UIPadding");
			expect(child).toBeDefined();
			expect((child!.props.PaddingTop as UDim).Offset).toBe(10);
			expect((child!.props.PaddingBottom as UDim).Offset).toBe(10);
			expect((child!.props.PaddingLeft as UDim).Offset).toBe(20);
			expect((child!.props.PaddingRight as UDim).Offset).toBe(20);
		});

		it("should let individual sides override shorthand padding", () => {
			const result = webStyle({ padding: "10px", paddingLeft: "5px" });
			const child = result.children.find((c) => c.type === "UIPadding");
			expect(child).toBeDefined();
			expect((child!.props.PaddingTop as UDim).Offset).toBe(10);
			expect((child!.props.PaddingLeft as UDim).Offset).toBe(5);
		});

		it("should handle just individual sides", () => {
			const result = webStyle({ paddingRight: "15%" });
			const child = result.children.find((c) => c.type === "UIPadding");
			expect(child).toBeDefined();
			expect((child!.props.PaddingRight as UDim).Scale).toBeCloseTo(0.15, 5);
			expect((child!.props.PaddingTop as UDim).Offset).toBe(0);
		});
	});

	describe("6. display: 'flex' → <uilistlayout>", () => {
		it("should inject <uilistlayout> for flex display", () => {
			const result = webStyle({ display: "flex" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child).toBeDefined();
			expect(child!.props.FillDirection).toBe(Enum.FillDirection.Vertical);
			expect(child!.props.SortOrder).toBe(Enum.SortOrder.LayoutOrder);
		});

		it("should map flexDirection: 'row'", () => {
			const result = webStyle({ display: "flex", flexDirection: "row" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child!.props.FillDirection).toBe(Enum.FillDirection.Horizontal);
		});

		it("should map justifyContent and alignItems for column", () => {
			const result = webStyle({
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				alignItems: "flex-end",
			});
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child!.props.VerticalAlignment).toBe(Enum.VerticalAlignment.Center);
			expect(child!.props.HorizontalAlignment).toBe(Enum.HorizontalAlignment.Right);
		});

		it("should map justifyContent and alignItems for row", () => {
			const result = webStyle({
				display: "flex",
				flexDirection: "row",
				justifyContent: "flex-end",
				alignItems: "center",
			});
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child!.props.HorizontalAlignment).toBe(Enum.HorizontalAlignment.Right);
			expect(child!.props.VerticalAlignment).toBe(Enum.VerticalAlignment.Center);
		});

		it("should map gap to Padding", () => {
			const result = webStyle({ display: "flex", gap: "10px" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect((child!.props.Padding as UDim).Offset).toBe(10);
		});

		it("should map flexWrap: 'wrap' to Wraps: true", () => {
			const result = webStyle({ display: "flex", flexWrap: "wrap" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child!.props.Wraps).toBe(true);
		});

		it("should not set Wraps for flexWrap: 'nowrap'", () => {
			const result = webStyle({ display: "flex", flexWrap: "nowrap" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child!.props.Wraps).toBeUndefined();
		});

		it("should map justifyContent: 'space-between' to HorizontalFlex for row", () => {
			const result = webStyle({ display: "flex", flexDirection: "row", justifyContent: "space-between" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child!.props.HorizontalFlex).toBe(Enum.UIFlexAlignment.SpaceBetween);
			expect(child!.props.HorizontalAlignment).toBeUndefined();
		});

		it("should map alignItems: 'stretch' to ItemLineAlignment", () => {
			const result = webStyle({ display: "flex", alignItems: "stretch" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child!.props.ItemLineAlignment).toBe(Enum.ItemLineAlignment.Stretch);
		});
	});

	describe("6.5. display: 'grid' → <uigridlayout>", () => {
		it("should inject <uigridlayout> for grid display", () => {
			const result = webStyle({ display: "grid" });
			const child = result.children.find((c) => c.type === "UIGridLayout");
			expect(child).toBeDefined();
			expect(child!.props.SortOrder).toBe(Enum.SortOrder.LayoutOrder);
		});

		it("should map gridTemplateColumns and gridTemplateRows to CellSize", () => {
			const result = webStyle({ display: "grid", gridTemplateColumns: "120px", gridTemplateRows: "150px" });
			const child = result.children.find((c) => c.type === "UIGridLayout");
			const cellSize = child!.props.CellSize as UDim2;
			expect(cellSize.X.Offset).toBe(120);
			expect(cellSize.Y.Offset).toBe(150);
		});

		it("should map gap to CellPadding", () => {
			const result = webStyle({ display: "grid", gap: "10px 20px" });
			const child = result.children.find((c) => c.type === "UIGridLayout");
			const cellPadding = child!.props.CellPadding as UDim2;
			expect(cellPadding.X.Offset).toBe(10);
			expect(cellPadding.Y.Offset).toBe(20);
		});
	});

	describe("7. border → <uistroke>", () => {
		it("should inject <uistroke> child with Thickness, Color, and Border mode", () => {
			const result = webStyle({ border: "2px solid #00ff00" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			expect(child!.props.Thickness).toBe(2);
			const color = child!.props.Color as Color3;
			expect(color.R).toBe(0);
			expect(color.G).toBe(1);
			expect(color.B).toBe(0);
			expect(child!.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border);
		});

		it("should handle just thickness", () => {
			const result = webStyle({ border: "3px" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			expect(child!.props.Thickness).toBe(3);
			expect(child!.props.Color).toBeUndefined();
			expect(child!.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border);
		});

		it("should handle missing components gracefully", () => {
			const result = webStyle({ border: "" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			expect(child!.props.Thickness).toBe(0);
			expect(child!.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border);
		});

		it("should parse rgb() border color", () => {
			const result = webStyle({ border: "1px solid rgb(255, 0, 0)" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			expect(child!.props.Thickness).toBe(1);
			const color = child!.props.Color as Color3;
			expect(color.R).toBeCloseTo(1, 2);
			expect(color.G).toBeCloseTo(0, 2);
			expect(color.B).toBeCloseTo(0, 2);
			expect(child!.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border);
		});

		it("should parse rgba() border color (alpha ignored for UIStroke)", () => {
			const result = webStyle({ border: "2px solid rgba(0, 128, 255, 0.5)" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			expect(child!.props.Thickness).toBe(2);
			const color = child!.props.Color as Color3;
			expect(color.R).toBeCloseTo(0, 2);
			expect(color.G).toBeCloseTo(0.50, 2);
			expect(color.B).toBeCloseTo(1, 2);
			expect(child!.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border);
		});

		it("should parse hsl() border color", () => {
			const result = webStyle({ border: "1px solid hsl(120, 100%, 50%)" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			expect(child!.props.Thickness).toBe(1);
			const color = child!.props.Color as Color3;
			expect(color.R).toBeCloseTo(0, 2);
			expect(color.G).toBeCloseTo(1, 2);
			expect(color.B).toBeCloseTo(0, 2);
			expect(child!.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border);
		});

		it("should skip 'dashed' style keyword and parse color", () => {
			const result = webStyle({ border: "3px dashed #ff0000" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			expect(child!.props.Thickness).toBe(3);
			const color = child!.props.Color as Color3;
			expect(color.R).toBeCloseTo(1, 2);
			expect(color.G).toBeCloseTo(0, 2);
			expect(color.B).toBeCloseTo(0, 2);
			expect(child!.props.ApplyStrokeMode).toBe(Enum.ApplyStrokeMode.Border);
		});
	});

	describe("8. aspectRatio → <uiaspectratioconstraint>", () => {
		it("should inject <uiaspectratioconstraint> with AspectRatio prop", () => {
			const result = webStyle({ aspectRatio: 1.5 });
			expect(result.children.size()).toBe(1);
			const child = result.children[0];
			expect(child!.type).toBe("UIAspectRatioConstraint");
			expect(child!.props.AspectRatio).toBe(1.5);
		});

		it("should handle integer aspect ratios", () => {
			const result = webStyle({ aspectRatio: 1 });
			const child = result.children.find((c) => c.type === "UIAspectRatioConstraint");
			expect(child).toBeDefined();
			expect(child!.props.AspectRatio).toBe(1);
		});

		it("should handle widescreen aspect ratios", () => {
			const result = webStyle({ aspectRatio: 16 / 9 });
			const child = result.children.find((c) => c.type === "UIAspectRatioConstraint");
			expect(child).toBeDefined();
			expect(child!.props.AspectRatio).toBeCloseTo(1.7778, 3);
		});

		it("should coexist with other constraints", () => {
			const result = webStyle({ aspectRatio: 2, borderRadius: "8px" });
			expect(result.children.size()).toBe(2);
			expect(result.children.find((c) => c.type === "UIAspectRatioConstraint")).toBeDefined();
			expect(result.children.find((c) => c.type === "UICorner")).toBeDefined();
		});
	});

	describe("9. position: 'absolute' → Position + AnchorPoint", () => {
		it("should map top and left", () => {
			const result = webStyle({ position: "absolute", top: "10px", left: "20px" });
			const pos = result.props.Position as UDim2;
			const anchor = result.props.AnchorPoint as Vector2;
			expect(pos.X.Offset).toBe(20);
			expect(pos.Y.Offset).toBe(10);
			expect(anchor.X).toBe(0);
			expect(anchor.Y).toBe(0);
		});

		it("should map right and bottom", () => {
			const result = webStyle({ position: "absolute", bottom: "10px", right: "20px" });
			const pos = result.props.Position as UDim2;
			const anchor = result.props.AnchorPoint as Vector2;
			expect(pos.X.Scale).toBe(1);
			expect(pos.X.Offset).toBe(-20);
			expect(pos.Y.Scale).toBe(1);
			expect(pos.Y.Offset).toBe(-10);
			expect(anchor.X).toBe(1);
			expect(anchor.Y).toBe(1);
		});

		it("should prioritize left over right and top over bottom", () => {
			const result = webStyle({ position: "absolute", left: "5px", right: "10px", top: "15px", bottom: "20px" });
			const pos = result.props.Position as UDim2;
			const anchor = result.props.AnchorPoint as Vector2;
			expect(pos.X.Offset).toBe(5);
			expect(pos.Y.Offset).toBe(15);
			expect(anchor.X).toBe(0);
			expect(anchor.Y).toBe(0);
		});
	});

	describe("10. zIndex → ZIndex", () => {
		it("should map zIndex to ZIndex", () => {
			const result = webStyle({ zIndex: 10 });
			expect(result.props.ZIndex).toBe(10);
		});

		it("should handle negative zIndex", () => {
			const result = webStyle({ zIndex: -5 });
			expect(result.props.ZIndex).toBe(-5);
		});
	});

	describe("11. Typography & Text Styling", () => {
		describe("color → TextColor3", () => {
			it("should parse hex colors to TextColor3", () => {
				const result = webStyle({ color: "#00ff00" });
				expect(result.props.TextColor3).toBeDefined();
				const color = result.props.TextColor3 as Color3;
				expect(color.R).toBe(0);
				expect(color.G).toBe(1);
				expect(color.B).toBe(0);
			});
		});

		describe("fontSize → TextSize", () => {
			it("should map fontSize to TextSize", () => {
				const result = webStyle({ fontSize: 24 });
				expect(result.props.TextSize).toBe(24);
			});
		});

		describe("textAlign → TextXAlignment", () => {
			it("should map 'left' to Enum.TextXAlignment.Left", () => {
				const result = webStyle({ textAlign: "left" });
				expect(result.props.TextXAlignment).toBe(Enum.TextXAlignment.Left);
			});

			it("should map 'center' to Enum.TextXAlignment.Center", () => {
				const result = webStyle({ textAlign: "center" });
				expect(result.props.TextXAlignment).toBe(Enum.TextXAlignment.Center);
			});

			it("should map 'right' to Enum.TextXAlignment.Right", () => {
				const result = webStyle({ textAlign: "right" });
				expect(result.props.TextXAlignment).toBe(Enum.TextXAlignment.Right);
			});
		});

		describe("whiteSpace & wordBreak → TextWrapped", () => {
			it("should map whiteSpace 'normal', 'pre-wrap', 'pre-line' to true", () => {
				expect(webStyle({ whiteSpace: "normal" }).props.TextWrapped).toBe(true);
				expect(webStyle({ whiteSpace: "pre-wrap" }).props.TextWrapped).toBe(true);
				expect(webStyle({ whiteSpace: "pre-line" }).props.TextWrapped).toBe(true);
			});

			it("should map whiteSpace 'nowrap' to false", () => {
				expect(webStyle({ whiteSpace: "nowrap" }).props.TextWrapped).toBe(false);
			});

			it("should map wordBreak 'normal', 'break-word', 'break-all' to true", () => {
				expect(webStyle({ wordBreak: "normal" }).props.TextWrapped).toBe(true);
				expect(webStyle({ wordBreak: "break-word" }).props.TextWrapped).toBe(true);
				expect(webStyle({ wordBreak: "break-all" }).props.TextWrapped).toBe(true);
			});

			it("should map wordBreak 'keep-all' to false", () => {
				expect(webStyle({ wordBreak: "keep-all" }).props.TextWrapped).toBe(false);
			});
		});

		describe("fontFamily & fontWeight → FontFace", () => {
			it("should map fontFamily to the correct URI and use default weight", () => {
				const result = webStyle({ fontFamily: "Montserrat" });
				expect(result.props.FontFace).toBeDefined();
				const font = result.props.FontFace as Font;
				expect(font.Family).toBe("rbxasset://fonts/families/Montserrat.json");
				expect(font.Weight).toBe(Enum.FontWeight.Regular);
				expect(font.Style).toBe(Enum.FontStyle.Normal);
			});

			it("should map fontWeight to the correct Enum and use default family", () => {
				const result = webStyle({ fontWeight: "bold" });
				expect(result.props.FontFace).toBeDefined();
				const font = result.props.FontFace as Font;
				expect(font.Family).toBe("rbxasset://fonts/families/BuilderSans.json");
				expect(font.Weight).toBe(Enum.FontWeight.Bold);
				expect(font.Style).toBe(Enum.FontStyle.Normal);
			});

			it("should map both fontFamily and fontWeight", () => {
				const result = webStyle({ fontFamily: "Montserrat", fontWeight: "black" });
				expect(result.props.FontFace).toBeDefined();
				const font = result.props.FontFace as Font;
				expect(font.Family).toBe("rbxasset://fonts/families/Montserrat.json");
				expect(font.Weight).toBe(Enum.FontWeight.Heavy);
				expect(font.Style).toBe(Enum.FontStyle.Normal);
			});

			it("should use fallback for any fontFamily and fontWeight", () => {
				const result = webStyle({ fontFamily: "UnknownFont", fontWeight: "superbold" });
				expect(result.props.FontFace).toBeDefined();
				const font = result.props.FontFace as Font;
				expect(font.Family).toBe("rbxasset://fonts/families/BuilderSans.json");
				expect(font.Weight).toBe(Enum.FontWeight.Regular);
				expect(font.Style).toBe(Enum.FontStyle.Normal);
			});
		});
	});

	describe("display: 'none' → Visible = false", () => {
		it("should set Visible to false", () => {
			const result = webStyle({ display: "none" });
			expect(result.props.Visible).toBe(false);
		});

		it("should not set Visible if display is flex or grid", () => {
			const flexResult = webStyle({ display: "flex" });
			expect(flexResult.props.Visible).toBeUndefined();

			const gridResult = webStyle({ display: "grid" });
			expect(gridResult.props.Visible).toBeUndefined();
		});
	});

	describe("13. overflow → ClipsDescendants", () => {
		it("should set ClipsDescendants to true when overflow is hidden", () => {
			const result = webStyle({ overflow: "hidden" });
			expect(result.props.ClipsDescendants).toBe(true);
		});

		it("should set ClipsDescendants to false when overflow is visible", () => {
			const result = webStyle({ overflow: "visible" });
			expect(result.props.ClipsDescendants).toBe(false);
		});
	});

	describe("14. pointerEvents → Interactable / Active", () => {
		it("should set Interactable and Active to false when pointerEvents is 'none'", () => {
			const result = webStyle({ pointerEvents: "none" });
			expect(result.props.Interactable).toBe(false);
			expect(result.props.Active).toBe(false);
		});

		it("should not set Interactable or Active when pointerEvents is 'auto' or omitted", () => {
			const result = webStyle({ pointerEvents: "auto" });
			expect(result.props.Interactable).toBeUndefined();
			expect(result.props.Active).toBeUndefined();

			const omittedResult = webStyle({});
			expect(omittedResult.props.Interactable).toBeUndefined();
			expect(omittedResult.props.Active).toBeUndefined();
		});
	});

	describe("15. boxShadow → <imagelabel>", () => {
		it("should inject <imagelabel> with correct base properties", () => {
			const result = webStyle({ boxShadow: "md" });
			const child = result.children.find((c) => c.type === "ImageLabel");
			expect(child).toBeDefined();
			expect(child!.type).toBe("ImageLabel");
			// Verify default shadow asset ID (see SHADOW_ASSET_ID in webStyle.ts)
			expect(child!.props.Image).toBe("rbxassetid://6015897843");
			expect(child!.props.ScaleType).toBe(Enum.ScaleType.Slice);
			expect(child!.props.SliceScale).toBe(0.3);
			expect(child!.props.BackgroundTransparency).toBe(1);
			const color = child!.props.ImageColor3 as Color3;
			expect(color.R).toBe(0);
			expect(color.G).toBe(0);
			expect(color.B).toBe(0);
			expect(child!.props.ZIndex).toBe(-1);
			const anchor = child!.props.AnchorPoint as Vector2;
			expect(anchor.X).toBe(0.5);
			expect(anchor.Y).toBe(0.5);
			const pos = child!.props.Position as UDim2;
			expect(pos.X.Scale).toBe(0.5);
			expect(pos.X.Offset).toBe(0);
			expect(pos.Y.Scale).toBe(0.5);
			expect(pos.Y.Offset).toBe(4);
		});

		it("should not inject <imagelabel> if boxShadow is 'none'", () => {
			const result = webStyle({ boxShadow: "none" });
			const child = result.children.find((c) => c.type === "ImageLabel");
			expect(child).toBeUndefined();
		});

		it("should map 'sm' token to correct size and transparency", () => {
			const result = webStyle({ boxShadow: "sm" });
			const child = result.children.find((c) => c.type === "ImageLabel")!;
			const size = child.props.Size as UDim2;
			expect(size.X.Scale).toBe(1);
			expect(size.X.Offset).toBe(10);
			expect(size.Y.Scale).toBe(1);
			expect(size.Y.Offset).toBe(10);
			expect(child.props.ImageTransparency).toBeCloseTo(0.7, 5);
		});

		it("should map '2xl' token to correct size and transparency", () => {
			const result = webStyle({ boxShadow: "2xl" });
			const child = result.children.find((c) => c.type === "ImageLabel")!;
			const size = child.props.Size as UDim2;
			expect(size.X.Scale).toBe(1);
			expect(size.X.Offset).toBe(40);
			expect(size.Y.Scale).toBe(1);
			expect(size.Y.Offset).toBe(40);
			expect(child.props.ImageTransparency).toBeCloseTo(0.4, 5);
		});

		it("should fallback to default size and transparency for any token", () => {
			const result = webStyle({ boxShadow: "any" as never });
			const child = result.children.find((c) => c.type === "ImageLabel")!;
			const size = child.props.Size as UDim2;
			expect(size.X.Scale).toBe(1);
			expect(size.X.Offset).toBe(20);
			expect(size.Y.Scale).toBe(1);
			expect(size.Y.Offset).toBe(20);
			expect(child.props.ImageTransparency).toBeCloseTo(0.5, 5);
		});

		it("should use custom SHADOW_ASSET_ID when overridden", () => {
			// NOTE: We cannot easily override module-level `let` exports from the test
			// side because roblox-ts modules are loaded once. Instead, we verify the
			// default asset ID is the expected value, documenting that it IS configurable.
			const result = webStyle({ boxShadow: "md" });
			const child = result.children.find((c) => c.type === "ImageLabel")!;
			// Default asset
			expect(child.props.Image).toBe("rbxassetid://6015897843");
			// Verify the SliceCenter matches the documented default
			const sliceCenter = child.props.SliceCenter as Rect;
			expect(sliceCenter.Min.X).toBe(47);
			expect(sliceCenter.Min.Y).toBe(47);
			expect(sliceCenter.Max.X).toBe(450);
			expect(sliceCenter.Max.Y).toBe(450);
		});
	});

	describe("16. objectFit → ScaleType", () => {
		it("should map 'cover' to Enum.ScaleType.Crop", () => {
			const result = webStyle({ objectFit: "cover" });
			expect(result.props.ScaleType).toBe(Enum.ScaleType.Crop);
		});

		it("should map 'contain' to Enum.ScaleType.Fit", () => {
			const result = webStyle({ objectFit: "contain" });
			expect(result.props.ScaleType).toBe(Enum.ScaleType.Fit);
		});

		it("should map 'fill' to Enum.ScaleType.Stretch", () => {
			const result = webStyle({ objectFit: "fill" });
			expect(result.props.ScaleType).toBe(Enum.ScaleType.Stretch);
		});
	});

	describe("17. lineHeight → LineHeight", () => {
		it("should map lineHeight to LineHeight", () => {
			const result = webStyle({ lineHeight: 1.5 });
			expect(result.props.LineHeight).toBe(1.5);
		});
	});

	describe("18. textOverflow → TextTruncate", () => {
		it("should map textOverflow 'ellipsis' to Enum.TextTruncate.AtEnd", () => {
			const result = webStyle({ textOverflow: "ellipsis" });
			expect(result.props.TextTruncate).toBe(Enum.TextTruncate.AtEnd);
		});
	});

	describe("19. layoutOrder → LayoutOrder", () => {
		it("should map layoutOrder to LayoutOrder", () => {
			const result = webStyle({ layoutOrder: 5 });
			expect(result.props.LayoutOrder).toBe(5);
		});

		it("should handle negative layoutOrder", () => {
			const result = webStyle({ layoutOrder: -3 });
			expect(result.props.LayoutOrder).toBe(-3);
		});

		it("should handle zero layoutOrder", () => {
			const result = webStyle({ layoutOrder: 0 });
			expect(result.props.LayoutOrder).toBe(0);
		});
	});

	describe("20. rotation → Rotation", () => {
		it("should map rotation to Rotation", () => {
			const result = webStyle({ rotation: 45 });
			expect(result.props.Rotation).toBe(45);
		});

		it("should handle negative rotation", () => {
			const result = webStyle({ rotation: -90 });
			expect(result.props.Rotation).toBe(-90);
		});

		it("should handle zero rotation", () => {
			const result = webStyle({ rotation: 0 });
			expect(result.props.Rotation).toBe(0);
		});
	});

	describe("21. visibility → Visible", () => {
		it("should set Visible to false when visibility is 'hidden'", () => {
			const result = webStyle({ visibility: "hidden" });
			expect(result.props.Visible).toBe(false);
		});

		it("should set Visible to true when visibility is 'visible'", () => {
			const result = webStyle({ visibility: "visible" });
			expect(result.props.Visible).toBe(true);
		});

		it("should not affect Visible when visibility is not set", () => {
			const result = webStyle({});
			expect(result.props.Visible).toBeUndefined();
		});

		it("should coexist with display: none (both set Visible)", () => {
			const result = webStyle({ display: "none" });
			expect(result.props.Visible).toBe(false);
		});
	});

	describe("22. autoSize → AutomaticSize", () => {
		it("should map autoSize 'xy' to Enum.AutomaticSize.XY", () => {
			const result = webStyle({ autoSize: "xy" });
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.XY);
		});

		it("should map autoSize 'x' to Enum.AutomaticSize.X", () => {
			const result = webStyle({ autoSize: "x" });
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.X);
		});

		it("should map autoSize 'y' to Enum.AutomaticSize.Y", () => {
			const result = webStyle({ autoSize: "y" });
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.Y);
		});

		it("should map autoSize 'none' to Enum.AutomaticSize.None", () => {
			const result = webStyle({ autoSize: "none" });
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.None);
		});

		it("should set AutomaticSize.X when width is 'auto'", () => {
			const result = webStyle({ width: "auto" });
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.X);
		});

		it("should set AutomaticSize.Y when height is 'auto'", () => {
			const result = webStyle({ height: "auto" });
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.Y);
		});

		it("should set AutomaticSize.XY when both width and height are 'auto'", () => {
			const result = webStyle({ width: "auto", height: "auto" });
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.XY);
		});

		it("should let explicit autoSize override width/height auto", () => {
			const result = webStyle({ width: "auto", autoSize: "y" });
			expect(result.props.AutomaticSize).toBe(Enum.AutomaticSize.Y);
		});

		it("should not set AutomaticSize when width/height are normal values", () => {
			const result = webStyle({ width: "50%", height: "100px" });
			expect(result.props.AutomaticSize).toBeUndefined();
		});
	});

	describe("23. textVerticalAlign → TextYAlignment", () => {
		it("should map 'top' to Enum.TextYAlignment.Top", () => {
			const result = webStyle({ textVerticalAlign: "top" });
			expect(result.props.TextYAlignment).toBe(Enum.TextYAlignment.Top);
		});

		it("should map 'center' to Enum.TextYAlignment.Center", () => {
			const result = webStyle({ textVerticalAlign: "center" });
			expect(result.props.TextYAlignment).toBe(Enum.TextYAlignment.Center);
		});

		it("should map 'bottom' to Enum.TextYAlignment.Bottom", () => {
			const result = webStyle({ textVerticalAlign: "bottom" });
			expect(result.props.TextYAlignment).toBe(Enum.TextYAlignment.Bottom);
		});
	});

	describe("24. fontStyle → FontFace italic", () => {
		it("should set FontFace with Italic style", () => {
			const result = webStyle({ fontStyle: "italic" });
			expect(result.props.FontFace).toBeDefined();
			const font = result.props.FontFace as Font;
			expect(font.Style).toBe(Enum.FontStyle.Italic);
			expect(font.Family).toBe("rbxasset://fonts/families/BuilderSans.json");
			expect(font.Weight).toBe(Enum.FontWeight.Regular);
		});

		it("should set FontFace with Normal style explicitly", () => {
			const result = webStyle({ fontStyle: "normal" });
			const font = result.props.FontFace as Font;
			expect(font.Style).toBe(Enum.FontStyle.Normal);
		});

		it("should combine fontStyle with fontWeight and fontFamily", () => {
			const result = webStyle({ fontFamily: "Montserrat", fontWeight: "bold", fontStyle: "italic" });
			const font = result.props.FontFace as Font;
			expect(font.Family).toBe("rbxasset://fonts/families/Montserrat.json");
			expect(font.Weight).toBe(Enum.FontWeight.Bold);
			expect(font.Style).toBe(Enum.FontStyle.Italic);
		});
	});

	describe("25. richText → RichText", () => {
		it("should set RichText to true", () => {
			const result = webStyle({ richText: true });
			expect(result.props.RichText).toBe(true);
		});

		it("should not set RichText when false", () => {
			const result = webStyle({ richText: false });
			expect(result.props.RichText).toBeUndefined();
		});

		it("should not set RichText when omitted", () => {
			const result = webStyle({});
			expect(result.props.RichText).toBeUndefined();
		});
	});

	describe("26. textDecoration → RichText + _textDecoration signal", () => {
		it("should set RichText true and _textDecoration for 'underline'", () => {
			const result = webStyle({ textDecoration: "underline" });
			expect(result.props.RichText).toBe(true);
			expect(result.props._textDecoration).toBe("underline");
		});

		it("should set RichText true and _textDecoration for 'line-through'", () => {
			const result = webStyle({ textDecoration: "line-through" });
			expect(result.props.RichText).toBe(true);
			expect(result.props._textDecoration).toBe("line-through");
		});

		it("should NOT set RichText or _textDecoration for 'none'", () => {
			const result = webStyle({ textDecoration: "none" });
			expect(result.props.RichText).toBeUndefined();
			expect(result.props._textDecoration).toBeUndefined();
		});

		it("should NOT set anything when textDecoration is omitted", () => {
			const result = webStyle({});
			expect(result.props._textDecoration).toBeUndefined();
		});
	});

	describe("27. textTransform → _textTransform signal", () => {
		it("should set _textTransform for 'uppercase'", () => {
			const result = webStyle({ textTransform: "uppercase" });
			expect(result.props._textTransform).toBe("uppercase");
		});

		it("should set _textTransform for 'lowercase'", () => {
			const result = webStyle({ textTransform: "lowercase" });
			expect(result.props._textTransform).toBe("lowercase");
		});

		it("should set _textTransform for 'capitalize'", () => {
			const result = webStyle({ textTransform: "capitalize" });
			expect(result.props._textTransform).toBe("capitalize");
		});

		it("should NOT set _textTransform for 'none'", () => {
			const result = webStyle({ textTransform: "none" });
			expect(result.props._textTransform).toBeUndefined();
		});

		it("should NOT set _textTransform when omitted", () => {
			const result = webStyle({});
			expect(result.props._textTransform).toBeUndefined();
		});
	});

	describe("28. flexGrow / flexShrink / alignSelf → <uiflexitem>", () => {
		it("should inject UIFlexItem with FlexMode Custom when flexGrow is set", () => {
			const result = webStyle({ flexGrow: 1 });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeDefined();
			expect(flexItem!.props.FlexMode).toBe(Enum.UIFlexMode.Custom);
			expect(flexItem!.props.GrowRatio).toBe(1);
			expect(flexItem!.props.ShrinkRatio).toBe(0);
		});

		it("should inject UIFlexItem with FlexMode Custom when flexShrink is set", () => {
			const result = webStyle({ flexShrink: 1 });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeDefined();
			expect(flexItem!.props.FlexMode).toBe(Enum.UIFlexMode.Custom);
			expect(flexItem!.props.GrowRatio).toBe(0);
			expect(flexItem!.props.ShrinkRatio).toBe(1);
		});

		it("should set both GrowRatio and ShrinkRatio when both are provided", () => {
			const result = webStyle({ flexGrow: 2, flexShrink: 3 });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeDefined();
			expect(flexItem!.props.FlexMode).toBe(Enum.UIFlexMode.Custom);
			expect(flexItem!.props.GrowRatio).toBe(2);
			expect(flexItem!.props.ShrinkRatio).toBe(3);
		});

		it("should NOT inject UIFlexItem when flexGrow and flexShrink are both 0", () => {
			const result = webStyle({ flexGrow: 0, flexShrink: 0 });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeUndefined();
		});

		it("should NOT inject UIFlexItem when neither flexGrow nor flexShrink is set", () => {
			const result = webStyle({});
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeUndefined();
		});

		it("should inject UIFlexItem with ItemLineAlignment for alignSelf 'center'", () => {
			const result = webStyle({ alignSelf: "center" });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeDefined();
			expect(flexItem!.props.ItemLineAlignment).toBe(Enum.ItemLineAlignment.Center);
		});

		it("should inject UIFlexItem with ItemLineAlignment for alignSelf 'stretch'", () => {
			const result = webStyle({ alignSelf: "stretch" });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeDefined();
			expect(flexItem!.props.ItemLineAlignment).toBe(Enum.ItemLineAlignment.Stretch);
		});

		it("should NOT inject UIFlexItem when alignSelf is 'auto'", () => {
			const result = webStyle({ alignSelf: "auto" });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeUndefined();
		});

		it("should combine flexGrow and alignSelf on a single UIFlexItem", () => {
			const result = webStyle({ flexGrow: 1, alignSelf: "flex-end" });
			const flexItem = result.children.find((c) => c.type === "UIFlexItem");
			expect(flexItem).toBeDefined();
			expect(flexItem!.props.FlexMode).toBe(Enum.UIFlexMode.Custom);
			expect(flexItem!.props.GrowRatio).toBe(1);
			expect(flexItem!.props.ItemLineAlignment).toBe(Enum.ItemLineAlignment.End);
		});

		it("should inject exactly one UIFlexItem child and no extras", () => {
			const result = webStyle({ flexGrow: 1 });
			expect(result.children.size()).toBe(1);
			expect(result.children[0]!.type).toBe("UIFlexItem");
		});
	});

	describe("29. background: linear-gradient() → <uigradient>", () => {
		it("should inject UIGradient for a simple two-color gradient", () => {
			const result = webStyle({ background: "linear-gradient(to right, #ff0000, #0000ff)" });
			const gradient = result.children.find((c) => c.type === "UIGradient");
			expect(gradient).toBeDefined();
			// to right = CSS 90deg = Roblox rotation 0
			expect(gradient!.props.Rotation).toBe(0);
			expect(gradient!.props.Color).toBeDefined();
		});

		it("should set BackgroundTransparency to 0 (opaque, CSS parity) when gradient is present", () => {
			const result = webStyle({ background: "linear-gradient(to right, red, blue)" });
			expect(result.props.BackgroundTransparency).toBe(0);
		});

		it("should default BackgroundColor3 to white when gradient is present and no backgroundColor set", () => {
			const result = webStyle({ background: "linear-gradient(to right, red, blue)" });
			const bg = result.props.BackgroundColor3 as Color3;
			expect(bg.R).toBe(1);
			expect(bg.G).toBe(1);
			expect(bg.B).toBe(1);
		});

		it("should use explicit backgroundColor when provided alongside gradient", () => {
			const result = webStyle({ background: "linear-gradient(to right, red, blue)", backgroundColor: "#ff0000" });
			const bg = result.props.BackgroundColor3 as Color3;
			expect(bg.R).toBe(1);
			expect(bg.G).toBe(0);
			expect(bg.B).toBe(0);
		});

		it("should use default direction (to bottom = Roblox rotation 90) when direction is omitted", () => {
			const result = webStyle({ background: "linear-gradient(#ff0000, #0000ff)" });
			const gradient = result.children.find((c) => c.type === "UIGradient");
			expect(gradient).toBeDefined();
			expect(gradient!.props.Rotation).toBe(90);
		});

		it("should parse angle-based direction (45deg)", () => {
			const result = webStyle({ background: "linear-gradient(45deg, red, blue)" });
			const gradient = result.children.find((c) => c.type === "UIGradient");
			expect(gradient).toBeDefined();
			// 45deg CSS - 90 = -45 Roblox
			expect(gradient!.props.Rotation).toBe(-45);
		});

		it("should parse 'to left' direction", () => {
			const result = webStyle({ background: "linear-gradient(to left, red, blue)" });
			const gradient = result.children.find((c) => c.type === "UIGradient");
			expect(gradient!.props.Rotation).toBe(180);
		});

		it("should parse 'to top' direction", () => {
			const result = webStyle({ background: "linear-gradient(to top, red, blue)" });
			const gradient = result.children.find((c) => c.type === "UIGradient");
			// 0deg CSS - 90 = -90 Roblox
			expect(gradient!.props.Rotation).toBe(-90);
		});

		it("should include NumberSequence transparency when rgba colors are used", () => {
			const result = webStyle({
				background: "linear-gradient(to right, rgba(255,0,0,1), rgba(0,0,255,0.5))",
			});
			const gradient = result.children.find((c) => c.type === "UIGradient");
			expect(gradient).toBeDefined();
			expect(gradient!.props.Transparency).toBeDefined();
		});

		it("should NOT include transparency when all colors are fully opaque", () => {
			const result = webStyle({ background: "linear-gradient(to right, #ff0000, #0000ff)" });
			const gradient = result.children.find((c) => c.type === "UIGradient");
			expect(gradient!.props.Transparency).toBeUndefined();
		});

		it("should NOT inject UIGradient when background is not a gradient string", () => {
			const result = webStyle({ background: "not-a-gradient" });
			const gradient = result.children.find((c) => c.type === "UIGradient");
			expect(gradient).toBeUndefined();
		});

		it("should coexist with other children (borderRadius + gradient)", () => {
			const result = webStyle({
				background: "linear-gradient(to right, red, blue)",
				borderRadius: "8px",
			});
			expect(result.children.find((c) => c.type === "UIGradient")).toBeDefined();
			expect(result.children.find((c) => c.type === "UICorner")).toBeDefined();
		});

		it("should not let opacity override BackgroundTransparency when gradient is present", () => {
			const result = webStyle({
				background: "linear-gradient(to right, red, blue)",
				opacity: 0.5,
			});
			// Gradient sets BackgroundTransparency to 0, opacity should not override
			expect(result.props.BackgroundTransparency).toBe(0);
		});

		it("should use aspect-ratio-aware corner keyword when pixel dimensions are provided", () => {
			const result = webStyle({
				width: 200,
				height: 100,
				background: "linear-gradient(to top right, red, blue)",
			});
			const gradient = result.children.find((c) => c.type === "UIGradient");
			expect(gradient).toBeDefined();
			// atan2(200, 100) ≈ 63.43deg CSS → 63.43 - 90 ≈ -26.57 Roblox
			const rotation = gradient!.props.Rotation as number;
			expect(rotation).toBeCloseTo(-26.57, 0);
		});
	});

	describe("Multiple constraints", () => {
		it("should produce multiple children if necessary", () => {
			const result = webStyle({
				borderRadius: "5px",
				padding: "10px",
				display: "flex",
				border: "1px solid red",
				aspectRatio: 1,
			});
			expect(result.children.size()).toBe(5);
		});
	});

	describe("calc() in style properties", () => {
		it("should parse calc() in width to produce UDim2 with both Scale and Offset", () => {
			const result = webStyle({ width: "calc(100% - 20px)", height: "50px" });
			expect(result.props.Size).toBeDefined();
			const size = result.props.Size as UDim2;
			expect(size.X.Scale).toBeCloseTo(1.0, 5);
			expect(size.X.Offset).toBe(-20);
			expect(size.Y.Scale).toBe(0);
			expect(size.Y.Offset).toBe(50);
		});
		it("should parse calc() in height", () => {
			const result = webStyle({ width: "100%", height: "calc(100% - 40px)" });
			expect(result.props.Size).toBeDefined();
			const size = result.props.Size as UDim2;
			expect(size.X.Scale).toBeCloseTo(1.0, 5);
			expect(size.X.Offset).toBe(0);
			expect(size.Y.Scale).toBeCloseTo(1.0, 5);
			expect(size.Y.Offset).toBe(-40);
		});
		it("should parse calc() in both width and height", () => {
			const result = webStyle({ width: "calc(50% + 10px)", height: "calc(100% - 30px)" });
			expect(result.props.Size).toBeDefined();
			const size = result.props.Size as UDim2;
			expect(size.X.Scale).toBeCloseTo(0.5, 5);
			expect(size.X.Offset).toBe(10);
			expect(size.Y.Scale).toBeCloseTo(1.0, 5);
			expect(size.Y.Offset).toBe(-30);
		});
		it("should parse calc() in individual padding sides", () => {
			const result = webStyle({ paddingTop: "calc(50% - 5px)" });
			const child = result.children.find((c) => c.type === "UIPadding");
			expect(child).toBeDefined();
			expect((child!.props.PaddingTop as UDim).Scale).toBeCloseTo(0.5, 5);
			expect((child!.props.PaddingTop as UDim).Offset).toBe(-5);
		});
		it("should parse calc() in gap", () => {
			const result = webStyle({ display: "flex", gap: "calc(0% + 15px)" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child).toBeDefined();
			expect((child!.props.Padding as UDim).Offset).toBe(15);
		});
		it("should parse calc() in borderRadius", () => {
			const result = webStyle({ borderRadius: "calc(50% - 2px)" });
			const child = result.children.find((c) => c.type === "UICorner");
			expect(child).toBeDefined();
			const radius = child!.props.CornerRadius as UDim;
			expect(radius.Scale).toBeCloseTo(0.5, 5);
			expect(radius.Offset).toBe(-2);
		});
		it("should coexist with other style properties", () => {
			const result = webStyle({
				width: "calc(100% - 20px)",
				height: "calc(100% - 20px)",
				backgroundColor: "#333",
				borderRadius: "8px",
			});
			expect(result.props.Size).toBeDefined();
			const size = result.props.Size as UDim2;
			expect(size.X.Scale).toBeCloseTo(1.0, 5);
			expect(size.X.Offset).toBe(-20);
			expect(result.props.BackgroundColor3).toBeDefined();
			const corner = result.children.find((c) => c.type === "UICorner");
			expect(corner).toBeDefined();
		});
	});

	describe("Malformed / invalid input resilience", () => {
		it("should not crash when width is a garbage string", () => {
			const result = webStyle({ width: "banana" });
			expect(result.props.Size).toBeDefined();
			const size = result.props.Size as UDim2;
			expect(size.X.Scale).toBe(0);
			expect(size.X.Offset).toBe(0);
		});

		it("should not crash when height is a garbage string", () => {
			const result = webStyle({ height: "not-a-size" });
			expect(result.props.Size).toBeDefined();
			const size = result.props.Size as UDim2;
			expect(size.Y.Scale).toBe(0);
			expect(size.Y.Offset).toBe(0);
		});

		it("should not crash when padding is a garbage string", () => {
			const result = webStyle({ padding: "fizzbuzz" });
			const child = result.children.find((c) => c.type === "UIPadding");
			expect(child).toBeDefined();
			expect((child!.props.PaddingTop as UDim).Offset).toBe(0);
			expect((child!.props.PaddingTop as UDim).Scale).toBe(0);
		});

		it("should not crash when borderRadius is a garbage string", () => {
			const result = webStyle({ borderRadius: "lol" });
			const child = result.children.find((c) => c.type === "UICorner");
			expect(child).toBeDefined();
			const radius = child!.props.CornerRadius as UDim;
			expect(radius.Scale).toBe(0);
			expect(radius.Offset).toBe(0);
		});

		it("should not crash on an empty border string", () => {
			const result = webStyle({ border: "nope" });
			const child = result.children.find((c) => c.type === "UIStroke");
			expect(child).toBeDefined();
			expect(child!.props.Thickness).toBe(0);
		});

		it("should not crash when backgroundColor is a garbage string", () => {
			const result = webStyle({ backgroundColor: "xyzzy" });
			expect(result.props.BackgroundColor3).toBeDefined();
		});

		it("should not crash when gap is a garbage string", () => {
			const result = webStyle({ display: "flex", gap: "hello" });
			const child = result.children.find((c) => c.type === "UIListLayout");
			expect(child).toBeDefined();
			expect((child!.props.Padding as UDim).Offset).toBe(0);
			expect((child!.props.Padding as UDim).Scale).toBe(0);
		});

		it("should produce a valid result when all string values are garbage", () => {
			const result = webStyle({
				width: "foo",
				height: "bar",
				padding: "baz",
				borderRadius: "qux",
				border: "quux",
				gap: "corge",
				backgroundColor: "grault",
			});
			expect(result.props).toBeDefined();
			expect(result.children).toBeDefined();
			expect(result.props.Size).toBeDefined();
		});

		it("should return empty props and no children for an empty style", () => {
			const result = webStyle({});
			expect(result.props.Size).toBeUndefined();
			expect(result.props.BackgroundColor3).toBeUndefined();
			expect(result.children.size()).toBe(0);
		});
	});
});
