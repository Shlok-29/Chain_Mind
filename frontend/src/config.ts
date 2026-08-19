/**
 * ChainMind API Configuration Helper
 * Dynamic API_BASE for local development & Vercel serverless deployment
 */

export const API_BASE = import.meta.env.VITE_API_BASE ?? (import.meta.env.DEV ? 'http://localhost:8000' : '');
