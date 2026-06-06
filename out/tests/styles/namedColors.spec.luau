-- Compiled with roblox-ts v3.0.0
local _jestGlobals = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("node_modules"):WaitForChild("@rbxts"):WaitForChild("jest-globals"):WaitForChild("src"))
local _binding = _jestGlobals
local describe = _binding.describe
local expect = _binding.expect
local it = _binding.it
describe("namedColors types", function()
	local robloxCSS = game:GetService("ReplicatedStorage"):WaitForChild("roblox-css")
	local stylesFolder = robloxCSS:WaitForChild("styles")
	local namedColorsModule = require(stylesFolder:WaitForChild("namedColors"))
	describe("NAMED_COLORS", function()
		it("should exist and be a table", function()
			expect(namedColorsModule.NAMED_COLORS).toBeDefined()
			local _nAMED_COLORS = namedColorsModule.NAMED_COLORS
			expect(type(_nAMED_COLORS) == "table").toBe(true)
		end)
		it("should contain standard CSS colors", function()
			expect(namedColorsModule.NAMED_COLORS.red ~= nil).toBe(true)
			expect(namedColorsModule.NAMED_COLORS.blue ~= nil).toBe(true)
			expect(namedColorsModule.NAMED_COLORS.green ~= nil).toBe(true)
			expect(namedColorsModule.NAMED_COLORS.white ~= nil).toBe(true)
			expect(namedColorsModule.NAMED_COLORS.black ~= nil).toBe(true)
		end)
		it("should return correct RGB values for colors", function()
			local red = namedColorsModule.NAMED_COLORS.red
			expect(red).toBeDefined()
			expect(red[1]).toBe(255)
			expect(red[2]).toBe(0)
			expect(red[3]).toBe(0)
			local white = namedColorsModule.NAMED_COLORS.white
			expect(white).toBeDefined()
			expect(white[1]).toBe(255)
			expect(white[2]).toBe(255)
			expect(white[3]).toBe(255)
		end)
		it("should not contain any colors", function()
			expect(namedColorsModule.NAMED_COLORS.unknowncolor ~= nil).toBe(false)
			expect(namedColorsModule.NAMED_COLORS.madeup ~= nil).toBe(false)
		end)
		it("should be case-sensitive based on lowercase keys", function()
			-- The map uses lowercase keys, so uppercase should not exist directly on the map
			expect(namedColorsModule.NAMED_COLORS.Red ~= nil).toBe(false)
			expect(namedColorsModule.NAMED_COLORS.RED ~= nil).toBe(false)
		end)
	end)
end)
