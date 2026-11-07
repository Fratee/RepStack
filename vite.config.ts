import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { handleApiRequest } from './server/api.js'

function gymApiPlugin(): Plugin {
  return {
    name: 'gym-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/')) {
          try {
            await handleApiRequest(req, res);
          } catch (err) {
            console.error('API Middleware Error:', err);
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Internal server error' }));
            }
          }
          return;
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    basicSsl(),
    gymApiPlugin(),
  ],
  server: {
    host: true,
    port: 5173,
    watch: {
      ignored: ['**/data/**', '**/*.db*'],
    },
  },
  preview: {
    host: true,
    port: 4173,
  },
})
