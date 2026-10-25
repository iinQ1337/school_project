import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// GitHub Pages отдаёт сайт из подпапки https://<user>.github.io/<repo>/,
// поэтому в сборке пути делаем относительными — так сайт работает
// при любом имени репозитория. Для dev-сервера остаётся корень "/".
export default defineConfig(({ command }) => ({
  base: command === "build" ? "./" : "/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // две страницы: главная и страница форта (fort/?n=1…9)
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("index.html", import.meta.url)),
        fort: fileURLToPath(new URL("fort/index.html", import.meta.url)),
      },
    },
  },
}));
