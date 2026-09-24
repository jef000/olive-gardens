import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// GitHub Pages serves the site from https://<owner>.github.io/<repo>/, so
// production builds running inside GitHub Actions are based at the repo name.
// Local builds (dev, preview, other hosts) keep the root base.
const repoName = (process.env.GITHUB_REPOSITORY || "").split("/")[1];
const pagesBase =
  process.env.GITHUB_ACTIONS === "true" && repoName ? `/${repoName}/` : "/";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: pagesBase,
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
