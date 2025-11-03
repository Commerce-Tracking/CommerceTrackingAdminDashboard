import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { getPort } from "get-port-please"; // ✅ import correct

// https://vite.dev/config/
export default defineConfig(async () => {
  // Trouve automatiquement un port libre à partir de 5173
  const port = await getPort({ port: 5173 });

  // console.log(`✅ Port libre trouvé pour le projet : ${port}`);

  return {
    plugins: [
      react(),
      svgr({
        svgrOptions: {
          icon: true,
          exportType: "named",
          namedExport: "ReactComponent",
        },
      }),
    ],
    server: {
      host: true, // permet d'accéder via le réseau local
      port,       // utilise le port libre trouvé
      strictPort: false, // autorise le changement automatique
    },
  };
});
