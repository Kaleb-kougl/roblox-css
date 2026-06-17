import { describe, expect, it } from "@rbxts/jest-globals";
import { webStyle } from "../../src/styles/webStyle";

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
		
		const paddingEl = result.children.find((c: any) => c.props.key === "uipadding");
		expect(paddingEl).toBeDefined();
		expect((paddingEl as any).props.PaddingTop.Offset).toBe(30);
		expect((paddingEl as any).props.PaddingBottom.Offset).toBe(30);
		expect((paddingEl as any).props.PaddingRight.Offset).toBe(20);
		expect((paddingEl as any).props.PaddingLeft.Offset).toBe(40);
	});

	it("outline injects UIStroke like border", () => {
		const result = webStyle({ outline: "2px solid #FF0000" });
		const strokeEl = result.children.find((c: any) => c.props.key === "uistroke");
		expect(strokeEl).toBeDefined();
		expect((strokeEl as any).props.Thickness).toBe(2);
		expect((strokeEl as any).props.Color).toBeDefined();
	});

	it("placeItems and placeContent map correctly", () => {
		const result = webStyle({ display: "flex", flexDirection: "column", placeItems: "center stretch", placeContent: "flex-end space-between" });
		const layoutEl = result.children.find((c: any) => c.props.key === "uilistlayout");
		expect(layoutEl).toBeDefined();
		expect((layoutEl as any).props.ItemLineAlignment).toBe(Enum.ItemLineAlignment.Stretch);
		expect((layoutEl as any).props.VerticalFlex).toBe(Enum.UIFlexAlignment.SpaceBetween);
	});

	it("flexFlow maps to FillDirection and Wraps", () => {
		const result = webStyle({ display: "flex", flexFlow: "row wrap" });
		const layoutEl = result.children.find((c: any) => c.props.key === "uilistlayout");
		expect(layoutEl).toBeDefined();
		expect((layoutEl as any).props.FillDirection).toBe(Enum.FillDirection.Horizontal);
		expect((layoutEl as any).props.Wraps).toBe(true);
	});

	it("borderRadius degradation", () => {
		const result = webStyle({ borderRadius: "10px 5px" });
		const cornerEl = result.children.find((c: any) => c.props.key === "uicorner");
		expect(cornerEl).toBeDefined();
		expect((cornerEl as any).props.CornerRadius.Offset).toBe(10);
	});

	it("backgroundSize cover maps to Crop", () => {
		const result = webStyle({ backgroundImage: "url('rbxassetid://123')", backgroundSize: "cover" });
		const imageEl = result.children.find((c: any) => c.props.key === "uibackgroundimage");
		expect(imageEl).toBeDefined();
		expect((imageEl as any).props.ScaleType).toBe(Enum.ScaleType.Crop);
	});
});
