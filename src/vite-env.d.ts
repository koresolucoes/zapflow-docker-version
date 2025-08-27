/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_URL: string;
  readonly VITE_API_URL: string;
  readonly VITE_GEMINI_API_KEY?: string;
  // add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
