import { createApp } from './app';

const PORT = Number(process.env.PORT) || 4000;

createApp().listen(PORT, '0.0.0.0', () => {
  console.log(`health-app auth server listening on http://0.0.0.0:${PORT}`);
});
