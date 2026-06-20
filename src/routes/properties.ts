import { Hono } from "hono";
import { z } from "zod";
import {
  getPropertyBySlug,
  getSimilarProperties,
  listProperties,
} from "../db/index.js";
import type { PropertyBadge } from "../types/property.js";

const badgeSchema = z.enum(["DESTAQUE", "LANÇAMENTO"]);

const listQuerySchema = z.object({
  q: z.string().optional(),
  badge: badgeSchema.optional(),
  location: z.string().optional(),
  minBeds: z.coerce.number().int().min(0).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const propertiesRouter = new Hono();

propertiesRouter.get("/", (c) => {
  const parsed = listQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: "Invalid query parameters", details: parsed.error.flatten() }, 400);
  }

  const properties = listProperties({
    ...parsed.data,
    badge: parsed.data.badge as PropertyBadge | undefined,
  });

  return c.json({ data: properties, total: properties.length });
});

propertiesRouter.get("/:slug/similar", (c) => {
  const slug = c.req.param("slug");
  const limit = Number(c.req.query("limit") ?? 3);

  if (!getPropertyBySlug(slug)) {
    return c.json({ error: "Property not found" }, 404);
  }

  const similar = getSimilarProperties(slug, Number.isFinite(limit) ? limit : 3);
  return c.json({ data: similar });
});

propertiesRouter.get("/:slug", (c) => {
  const property = getPropertyBySlug(c.req.param("slug"));
  if (!property) {
    return c.json({ error: "Property not found" }, 404);
  }
  return c.json({ data: property });
});
