import type { Context, MiddlewareHandler } from "hono";
export declare function createCorsOriginHandler(allowedOrigins: string[]): (origin: string, c: Context) => string | undefined;
export declare function corsMiddleware(allowedOrigins: string[]): MiddlewareHandler;
