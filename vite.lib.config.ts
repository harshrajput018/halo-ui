import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Library build: ESM bundle + CSS, React left as a peer dependency
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist-lib",
    lib: { entry: "src/lib/index.ts", formats: ["es"], fileName: "halo", cssFileName: "halo" },
    rollupOptions: { external: ["react", "react-dom", "react/jsx-runtime"] },
  },
});
