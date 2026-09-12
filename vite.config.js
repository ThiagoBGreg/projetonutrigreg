import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import handler from './api/gerar-plano.js';

/**
 * Middleware para desenvolvimento local do endpoint /api/gerar-plano
 */
function localApiPlugin() {
  return {
    name: 'local-api-gerar-plano',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/gerar-plano' || req.url?.startsWith('/api/gerar-plano?')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }

          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Método não permitido. Utilize POST.' }));
            return;
          }

          let bodyStr = '';
          req.on('data', chunk => {
            bodyStr += chunk;
          });

          req.on('end', async () => {
            try {
              let body = {};
              if (bodyStr) {
                try {
                  body = JSON.parse(bodyStr);
                } catch (e) {}
              }

              // Mock req and res objects for the serverless handler
              const mockReq = {
                method: req.method,
                body,
                headers: req.headers
              };

              const mockRes = {
                statusCode: 200,
                headers: {},
                setHeader(k, v) {
                  this.headers[k] = v;
                  try {
                    res.setHeader(k, v);
                  } catch (e) {}
                },
                status(code) {
                  this.statusCode = code;
                  res.statusCode = code;
                  return this;
                },
                json(data) {
                  res.statusCode = this.statusCode || 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                  return this;
                },
                end(data) {
                  res.end(data);
                  return this;
                }
              };

              await handler(mockReq, mockRes);
            } catch (err) {
              console.error('Erro no endpoint dev /api/gerar-plano:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({
                error: 'Falha ao processar plano alimentar.',
                message: err.message || 'Erro interno no servidor.'
              }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    localApiPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'maskable-icon-512x512.png', 'logo.png'],
      manifest: {
        name: 'Nutri Rodrigues — Gestão Nutricional & Portal do Paciente',
        short_name: 'Nutri Rodrigues',
        description: 'Plataforma moderna para nutricionistas e acompanhamento exclusivo de pacientes.',
        theme_color: '#10b981',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}']
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  }
});
