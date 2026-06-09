import { optimizeDriveBlocks } from "../solver/placement.js";

self.addEventListener("message", (event) => {
  const { type, task } = event.data ?? {};
  if (type !== "optimize") {
    return;
  }

  try {
    const result = optimizeDriveBlocks(task, (progress) => {
      self.postMessage({
        type: "progress",
        progress
      });
    });
    self.postMessage({
      type: "result",
      result
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});
