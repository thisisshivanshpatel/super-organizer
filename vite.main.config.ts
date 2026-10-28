import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      // Built into Electron's Node runtime; must not be bundled
      external: ["node:sqlite"],
    },
  },
});
