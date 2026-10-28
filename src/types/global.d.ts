import type { targetsAPI } from "./target/target.types";

declare global {
  interface Window {
    electronAPI: {
      targets: targetsAPI;
      platform: NodeJS.Platform;
    };
  }
}
