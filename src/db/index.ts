import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CREATE_INQUIRIES_TABLE,
  CREATE_PROPERTIES_TABLE,
  rowToProperty,
  type PropertyRow,
} from "./schema.js";
import type { Property, PropertyFilters } from "../types/property.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "..", "data");
const dbPath = process.env.DATABASE_PATH ?? join(dataDir, "lotus.db");

mkdirSync(dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");
db.exec(CREATE_PROPERTIES_TABLE);
db.exec(CREATE_INQUIRIES_TABLE);

export function listProperties(filters: PropertyFilters = {}): Property[] {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters.q) {
    conditions.push(
      "(title LIKE ? OR location LIKE ? OR address LIKE ? OR description LIKE ?)",
    );
    const term = `%${filters.q}%`;
    params.push(term, term, term, term);
  }

  if (filters.badge) {
    conditions.push("badge = ?");
    params.push(filters.badge);
  }

  if (filters.location) {
    conditions.push("location LIKE ?");
    params.push(`%${filters.location}%`);
  }

  if (filters.minBeds !== undefined) {
    conditions.push("beds >= ?");
    params.push(filters.minBeds);
  }

  if (filters.minPrice !== undefined) {
    conditions.push("price_value >= ?");
    params.push(filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    conditions.push("price_value <= ?");
    params.push(filters.maxPrice);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters.limit !== undefined ? `LIMIT ${Math.max(1, filters.limit)}` : "";

  const stmt = db.prepare(`SELECT * FROM properties ${where} ORDER BY price_value DESC ${limit}`);
  const rows = stmt.all(...params) as PropertyRow[];

  return rows.map(rowToProperty);
}

export function getPropertyBySlug(slug: string): Property | undefined {
  const stmt = db.prepare("SELECT * FROM properties WHERE slug = ?");
  const row = stmt.get(slug) as PropertyRow | undefined;
  return row ? rowToProperty(row) : undefined;
}

export function getSimilarProperties(slug: string, limit = 3): Property[] {
  const stmt = db.prepare(
    `SELECT * FROM properties WHERE slug != ? ORDER BY ABS(price_value - (
      SELECT price_value FROM properties WHERE slug = ?
    )) LIMIT ?`,
  );
  const rows = stmt.all(slug, slug, limit) as PropertyRow[];
  return rows.map(rowToProperty);
}

export function createInquiry(input: {
  propertySlug?: string;
  name: string;
  phone: string;
  email: string;
  message?: string;
}): { id: number } {
  const stmt = db.prepare(
    `INSERT INTO inquiries (property_slug, name, phone, email, message)
     VALUES (?, ?, ?, ?, ?)`,
  );
  const result = stmt.run(
    input.propertySlug ?? null,
    input.name,
    input.phone,
    input.email,
    input.message ?? null,
  );

  return { id: Number(result.lastInsertRowid) };
}

export function propertyCount(): number {
  const row = db.prepare("SELECT COUNT(*) as count FROM properties").get() as {
    count: number;
  };
  return row.count;
}

export { db };
