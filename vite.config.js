import { loadEnv } from 'vite';
import ViteRestart from 'vite-plugin-restart';

export default ({ command, mode }) => {
  // Match ports in .ddev/config.yaml and config/vite.php
  const env = loadEnv(mode, process.cwd(), '');
  const HTTP_PORT = 3000;
  const HTTPS_PORT = 3000;

  return {
    // In dev mode, we serve assets at the root of https://my.ddev.site:3000
    //  In production, files live in the /dist directory
    base: command === 'serve' ? '' : '/dist/',
    build: {
      manifest: true,
      outDir: 'web/dist/',
      rollupOptions: {
        input: {
          // The entry point for Vite, we'll create this file soon
          app: 'src/js/app.js',
        },
      },
    },
    plugins: [
      ViteRestart({
        reload: ['templates/**/*'],
      }),
    ],
    server: {
      host: '0.0.0.0',
      port: HTTP_PORT,
      // Setting a specific origin ensures that your fonts & images load
      // correctly. Assumes you're accessing the front-end over https
      origin: env.PRIMARY_SITE_URL + ':' + HTTPS_PORT,
      cors: true, // Allow cross-origin requests,
    },
  };
};
