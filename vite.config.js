import {defineConfig,loadEnv} from 'vite'; import react from '@vitejs/plugin-react'; import tailwind from '@tailwindcss/vite'
export default ({mode})=>{const env=loadEnv(mode,process.cwd(),'')
  return defineConfig({plugins:[react(),tailwind()],server:{proxy:{'/api':{target:env.VITE_API_URL||'http://localhost:8000',changeOrigin:true,secure:false,rewrite:p=>p.replace(/^\/api/,'')}}}})}
