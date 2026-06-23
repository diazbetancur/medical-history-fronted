import { spawnSync } from "node:child_process";

const vercelEnv = process.env.VERCEL_ENV;
const forcedConfiguration = process.env.ANGULAR_CONFIGURATION?.trim().toLowerCase();

const configByEnv = {
  production: "production",
  preview: "qa",
  development: "development",
};

const configAliases = {
  dev: "development",
  development: "development",
  qa: "qa",
  pdn: "production",
  prod: "production",
  production: "production",
};

const configuration =
  (forcedConfiguration ? configAliases[forcedConfiguration] : undefined) ??
  configByEnv[vercelEnv] ??
  "qa";

if (!["development", "qa", "production"].includes(configuration)) {
  console.error(
    `[vercel-build] ANGULAR_CONFIGURATION invalido: ${forcedConfiguration}. Usa development, qa o production.`,
  );
  process.exit(1);
}

console.log(
  `[vercel-build] VERCEL_ENV=${vercelEnv ?? "undefined"} ANGULAR_CONFIGURATION=${forcedConfiguration ?? "undefined"} -> Angular configuration=${configuration}`,
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
