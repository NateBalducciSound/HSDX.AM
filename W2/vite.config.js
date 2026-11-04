import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'glb-mime',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.endsWith('.glb')) {
            res.setHeader('Content-Type', 'model/gltf-binary');
          }
          next();
        });
      },
    },
  ],
})
