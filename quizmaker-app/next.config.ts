import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	eslint: {
		// Disable ESLint during builds - allows development to continue
		ignoreDuringBuilds: true,
	},
	typescript: {
		// Disable TypeScript errors during builds - allows development to continue
		ignoreBuildErrors: true,
	},
};

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
