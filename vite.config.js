import { defineConfig, loadEnv } from 'vite';
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const api = (env.VITE_PUBLIC_API_URL || '').trim().replace(/\/$/, '');
  if (api && !api.startsWith('https://')) throw new Error('VITE_PUBLIC_API_URL must use HTTPS');
  return {base:'./', plugins:[{name:'public-api-config',transformIndexHtml(html){return html.replace('<head>', '<head><script>window.GDECHEAPLY_API_BASE='+JSON.stringify(api).replace(/</g,'\\u003c')+';</script>');}}], server:{proxy:{'/api/public':'http://127.0.0.1:8000'}}};
});
