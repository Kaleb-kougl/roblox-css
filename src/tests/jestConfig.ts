import type { Config } from "@rbxts/jest";

export = identity<Config>({
	testMatch: ["**/*.spec"],
	testPathIgnorePatterns: ["/node_modules/"],
	setupFiles: [script.Parent!.WaitForChild("setup") as ModuleScript],
});
