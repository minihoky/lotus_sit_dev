import { Hono } from "hono";
import { z } from "zod";
import { createInquiry, getPropertyBySlug } from "../db/index.js";

const inquirySchema = z.object({
  propertySlug: z.string().min(1).optional(),
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z.string().trim().min(8, "Telefone inválido"),
  email: z.string().trim().email("E-mail inválido"),
  message: z.string().trim().optional(),
});

export const inquiriesRouter = new Hono();

inquiriesRouter.post("/", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const { propertySlug, name, phone, email, message } = parsed.data;

  if (propertySlug && !getPropertyBySlug(propertySlug)) {
    return c.json({ error: "Property not found" }, 404);
  }

  const inquiry = createInquiry({ propertySlug, name, phone, email, message });

  return c.json(
    {
      data: {
        id: inquiry.id,
        message: "Mensagem enviada com sucesso. Entraremos em contato em breve.",
      },
    },
    201,
  );
});
