function originMatchesPattern(origin, pattern) {
    if (pattern === "*")
        return true;
    if (pattern === origin)
        return true;
    if (!pattern.includes("*"))
        return false;
    const regex = new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`);
    return regex.test(origin);
}
export function createCorsOriginHandler(allowedOrigins) {
    return (origin) => {
        if (!origin)
            return allowedOrigins[0];
        for (const allowed of allowedOrigins) {
            if (originMatchesPattern(origin, allowed))
                return origin;
        }
        return undefined;
    };
}
export function corsMiddleware(allowedOrigins) {
    const resolveOrigin = createCorsOriginHandler(allowedOrigins);
    return async (c, next) => {
        const origin = c.req.header("Origin");
        if (c.req.method === "OPTIONS") {
            const allowed = resolveOrigin(origin ?? "", c);
            if (allowed) {
                c.header("Access-Control-Allow-Origin", allowed);
                c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                c.header("Access-Control-Allow-Headers", "Content-Type");
                c.header("Access-Control-Max-Age", "86400");
            }
            return c.body(null, 204);
        }
        await next();
        const allowed = resolveOrigin(origin ?? "", c);
        if (allowed) {
            c.header("Access-Control-Allow-Origin", allowed);
            c.header("Vary", "Origin");
        }
    };
}
