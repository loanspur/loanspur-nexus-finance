/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    readonly VITE_IS_DEVELOPMENT: string
    readonly VITE_APP_VERSION: string
    readonly VITE_APP_NAME: string
    readonly DEV: boolean
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }