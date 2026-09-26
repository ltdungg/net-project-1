declare namespace Cloudflare {
  interface Env {
    FILES: R2Bucket;
    APP_ENV?: string;
    LOCAL_AUTH_BYPASS?: string;
    LOCAL_AUTH_EMAIL?: string;
    ADMIN_EMAILS?: string;
    MANAGER_EMAILS?: string;
    PAYMENT_WEBHOOK_SECRET?: string;
    PUBLIC_ASSET_ORIGIN?: string;
    COMMERCE_API_URL?: string;
    COMMERCE_PUBLIC_ORIGIN?: string;
  }
}
