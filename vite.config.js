import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Port 5500 on 127.0.0.1 matches the CORS origin allowed in the FastAPI main.py
export default defineConfig({ plugins: [react()], server: { host: '127.0.0.1', port: 5500, strictPort: true } })
