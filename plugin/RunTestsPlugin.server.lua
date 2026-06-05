--[[
	Test Runner Plugin for roblox-css
	Runs @rbxts/jest tests with Plugin capabilities (debug.loadmodule access).
	
	Install by copying this file into Studio's local Plugins folder
	(Plugins tab → Plugins Folder button) and restarting Studio.
	OR build with: rojo build test-runner.project.json -o ~/Documents/Roblox/Plugins/TestRunner.rbxm
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerScriptService = game:GetService("ServerScriptService")
local RunService = game:GetService("RunService")

if not RunService:IsStudio() then return end

-- Wait for Rojo sync to populate the tree
local rbxtsInclude = ReplicatedStorage:WaitForChild("rbxts_include", 30)
if not rbxtsInclude then
	warn("[Jest] Could not find ReplicatedStorage.rbxts_include - is Rojo syncing?")
	return
end

-- Use the roblox-ts RuntimeLib for module resolution
local TS = require(rbxtsInclude:WaitForChild("RuntimeLib"))

local runCLI = TS.import(
	script,
	ReplicatedStorage,
	"rbxts_include", "node_modules", "@rbxts", "jest", "src"
).runCLI

-- Toolbar button to trigger tests
local toolbar = plugin:CreateToolbar("roblox-css Tests")
local runButton = toolbar:CreateButton("Run Tests", "Run @rbxts/jest test suite", "rbxassetid://4458901886")

local isRunning = false

local function runTests()
	if isRunning then
		warn("[Jest] Tests already running, please wait...")
		return
	end
	isRunning = true
	runButton.Enabled = false

	task.spawn(function()
		local ok, err = pcall(function()
			-- Find the test root in ServerScriptService
			local testRoot = ServerScriptService:WaitForChild("tests", 10)
			if not testRoot then
				warn("[Jest] Could not find ServerScriptService.tests - is Rojo syncing?")
				return
			end

			-- Clone config with the exact name Jest expects
			local originalConfig = testRoot:FindFirstChild("jestConfig")
			if not originalConfig then
				warn("[Jest] Could not find jestConfig module in tests root")
				return
			end

			-- Remove any previous clone
			local existing = testRoot:FindFirstChild("jest.config")
			if existing then existing:Destroy() end

			local jestConfig = originalConfig:Clone()
			jestConfig.Name = "jest.config"
			jestConfig.Parent = testRoot

			print("[Jest] Starting test run...")
			runCLI(testRoot, { verbose = true, ci = false }, { testRoot })
				:andThen(function(status)
					print("[Jest] " .. (if status.results.success then "SUCCESS ✅" else "FAILED ❌"))
					print(("[Jest] %d suites, %d tests total"):format(
						status.results.numPassedTestSuites + status.results.numFailedTestSuites,
						status.results.numPassedTests + status.results.numFailedTests
					))
				end)
				:catch(function(runErr)
					warn("[Jest] Error: " .. tostring(runErr))
				end)
				:finally(function()
					isRunning = false
					runButton.Enabled = true
				end)
		end)

		if not ok then
			warn("[Jest] Failed to start: " .. tostring(err))
			isRunning = false
			runButton.Enabled = true
		end
	end)
end

runButton.Click:Connect(runTests)
print("[Jest Plugin] Loaded. Click 'Run Tests' in the toolbar.")
