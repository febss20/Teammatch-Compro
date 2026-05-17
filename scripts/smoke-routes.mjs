const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";

const checks = [
    { path: "/", statuses: [200] },
    { path: "/about", statuses: [200] },
    { path: "/services", statuses: [200] },
    { path: "/services/tech", statuses: [200] },
    { path: "/services/missing", statuses: [404] },
    { path: "/gallery", statuses: [200] },
    { path: "/contact", statuses: [200] },
    { path: "/robots.txt", statuses: [200] },
    { path: "/sitemap.xml", statuses: [200] },
    { path: "/manifest.webmanifest", statuses: [200] },
    { path: "/dashboard", statuses: [302, 303, 307, 308] },
];

function assertHeaderIncludes(response, headerName, expectedValue, failures, path) {
    const actualValue = response.headers.get(headerName);

    if (!actualValue || !actualValue.includes(expectedValue)) {
        failures.push(
            `${path} -> expected header ${headerName} to include "${expectedValue}" but received "${actualValue ?? "missing"}"`,
        );
    }
}

function assertHeaderMissing(response, headerName, failures, path) {
    const actualValue = response.headers.get(headerName);

    if (actualValue !== null) {
        failures.push(`${path} -> expected header ${headerName} to be absent but received "${actualValue}"`);
    }
}

async function run() {
    const failures = [];

    for (const check of checks) {
        const response = await fetch(`${baseUrl}${check.path}`, {
            redirect: "manual",
        });

        if (!check.statuses.includes(response.status)) {
            failures.push(`${check.path} -> expected ${check.statuses.join("/")} but received ${response.status}`);
        }

        if (check.path === "/") {
            assertHeaderIncludes(response, "content-security-policy", "default-src 'self'", failures, check.path);
            assertHeaderIncludes(response, "x-content-type-options", "nosniff", failures, check.path);
            assertHeaderIncludes(response, "x-frame-options", "DENY", failures, check.path);
            assertHeaderIncludes(response, "referrer-policy", "strict-origin-when-cross-origin", failures, check.path);
            assertHeaderMissing(response, "x-powered-by", failures, check.path);
        }
    }

    if (failures.length > 0) {
        console.error("Smoke route failures:");
        failures.forEach((failure) => {
            console.error(`- ${failure}`);
        });
        process.exit(1);
    }

    console.log(`Smoke route checks passed for ${baseUrl}`);
}

run().catch((error) => {
    console.error("Smoke route check failed to execute.", error);
    process.exit(1);
});
