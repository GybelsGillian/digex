import { loadEnv } from 'vite';
import ViteRestart from 'vite-plugin-restart';

export default ({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const HTTP_PORT = 3000;
  const HTTPS_PORT = 3000;

  return {
    base: command === 'serve' ? '' : '/dist/',
    build: {
      manifest: true,
      outDir: 'web/dist/',
      rollupOptions: {
        input: {
          app: 'src/js/app.js',
          home: 'src/js/pages/home.js',
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
      origin: env.PRIMARY_SITE_URL + ':' + HTTPS_PORT,
      cors: true,
    },
  };
};
