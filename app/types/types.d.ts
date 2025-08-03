export interface CloudflareContext {
  cloudflare: {
    env: Env;
    ctx: ExecutionContext;
  };
}