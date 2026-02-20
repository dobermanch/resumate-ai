/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API keys are now handled server-side only
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
