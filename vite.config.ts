import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import pkg from "./package.json";

const version = pkg.version;
const now = Math.round(Date.now() / 6000).toString(36);

process.env.VITE_APP_VERSION = `${version}-${now}`;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    vue(),
    vueDevTools(),
    VitePWA({
      registerType: "prompt",
      manifest: {
        name: "Calculadora Renda Fixa",
        short_name: "Renda Fixa",
        description: "Calculadora de juros compostos para renda fixa",
        theme_color: "#0f172a",
        lang: "pt-BR",
        orientation: "portrait",
        icons: [
          {
            src: "/icons/icon-192x192.webp",
            sizes: "192x192",
            type: "image/webp",
            purpose: "any",
          },
          {
            src: "/icons/icon-512x512.webp",
            sizes: "512x512",
            type: "image/webp",
            purpose: "any",
          },
          {
            src: "/icons/icon-512x512.webp",
            sizes: "512x512",
            type: "image/webp",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
