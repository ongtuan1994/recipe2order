import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    // Keep dynamic pages in the client router cache so back/forward and
    // re-visits within the window reuse the rendered RSC payload instead
    // of round-tripping to the server. revalidatePath in server actions
    // still busts this when data actually changes.
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
};

export default withNextIntl(nextConfig);
