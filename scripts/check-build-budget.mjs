import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const buildManifestPath = path.join(projectRoot, ".next", "build-manifest.json");
const defaultBudgetBytes = 950_000;

function getBudgetBytes() {
    const rawValue = process.env.BUILD_ROOT_JS_BUDGET_BYTES;

    if (!rawValue) {
        return defaultBudgetBytes;
    }

    const parsedValue = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(parsedValue) || parsedValue < 1) {
        throw new Error("BUILD_ROOT_JS_BUDGET_BYTES tidak valid.");
    }

    return parsedValue;
}

function formatBytes(value) {
    if (value < 1024) {
        return `${value} B`;
    }

    if (value < 1024 * 1024) {
        return `${(value / 1024).toFixed(1)} KB`;
    }

    return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

async function readBuildManifest() {
    const rawContent = await readFile(buildManifestPath, "utf8");
    return JSON.parse(rawContent);
}

async function getAssetSizes(assetPaths) {
    const uniqueAssets = [...new Set(assetPaths.filter((assetPath) => assetPath.endsWith(".js")))];

    return Promise.all(
        uniqueAssets.map(async (assetPath) => {
            const absolutePath = path.join(projectRoot, ".next", assetPath);
            const assetStat = await stat(absolutePath);

            return {
                assetPath,
                size: assetStat.size,
            };
        }),
    );
}

async function main() {
    const budgetBytes = getBudgetBytes();
    const buildManifest = await readBuildManifest();
    const assetSizes = await getAssetSizes([...(buildManifest.rootMainFiles ?? []), ...(buildManifest.polyfillFiles ?? [])]);
    const totalBytes = assetSizes.reduce((sum, asset) => sum + asset.size, 0);

    console.log(`Budget JS fondasi: ${formatBytes(totalBytes)} / ${formatBytes(budgetBytes)}`);

    assetSizes
        .sort((left, right) => right.size - left.size)
        .forEach((asset) => {
            console.log(`- ${asset.assetPath}: ${formatBytes(asset.size)}`);
        });

    if (totalBytes > budgetBytes) {
        throw new Error("JS fondasi melebihi build budget.");
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});
