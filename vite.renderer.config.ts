import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
  server: {
    hmr: {
      port: 24678,
      host: "localhost",
    },
  },
  clearScreen: false,
});
