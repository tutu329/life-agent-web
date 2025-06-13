import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    cors: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'powerai.cc',
      '.powerai.cc'
    ],
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
      'Access-Control-Allow-Headers': '*'
    },
    // HTTPS配置
    ...(process.env.NODE_ENV === 'production' || process.env.VITE_HTTPS === 'true' ? {
      https: {
        key: fs.existsSync('/home/tutu/ssl/powerai.key') ? fs.readFileSync('/home/tutu/ssl/powerai.key') : undefined,
        cert: fs.existsSync('/home/tutu/ssl/powerai_public.crt') ? fs.readFileSync('/home/tutu/ssl/powerai_public.crt') : undefined,
        ca: fs.existsSync('/home/tutu/ssl/powerai_chain.crt') ? fs.readFileSync('/home/tutu/ssl/powerai_chain.crt') : undefined
      }
    } : {})
  }
}) 