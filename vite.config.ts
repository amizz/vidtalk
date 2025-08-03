import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { readFileSync } from "fs";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    // Plugin to handle SQL file imports as text
    {
      name: 'sql-loader',
      load(id) {
        if (id.endsWith('.sql')) {
          const sql = readFileSync(id, 'utf-8');
          return `export default ${JSON.stringify(sql)};`;
        }
      }
    }
  ],
});
