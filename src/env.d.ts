declare module '@pagefind/default-ui' {
  declare class PagefindUI {
    constructor(arg: unknown)
  }

  interface ImportMetaEnv {
    readonly PUBLIC_REACTIONS_ENDPOINT?: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}
