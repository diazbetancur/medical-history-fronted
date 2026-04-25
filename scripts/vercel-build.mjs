import { spawnSync } from "node:child_process";

const vercelEnv = process.env.VERCEL_ENV;

const configByEnv = {
  production: "production",
  preview: "qa",
  development: "development",
};

const configuration = configByEnv[vercelEnv] ?? "qa";

console.log(
  `[vercel-build] VERCEL_ENV=${vercelEnv ?? "undefined"} -> Angular configuration=${configuration}`,
);

const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["ng", "build", "--configuration", configuration],
  { stdio: "inherit", shell: false },
);

if (result.error) {
  console.error("[vercel-build] Error ejecutando build:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
