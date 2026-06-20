export type PropertyBadge = "DESTAQUE" | "LANÇAMENTO";

export type PropertyFeatureIcon =
  | "pool"
  | "gourmet"
  | "security"
  | "ac"
  | "gym"
  | "garden"
  | "wifi"
  | "parking"
  | "elevator"
  | "balcony";

export type PropertyFeature = {
  label: string;
  icon: PropertyFeatureIcon;
};

export type Property = {
  slug: string;
  title: string;
  location: string;
  address: string;
  badge?: PropertyBadge;
  image: string;
  gallery: string[];
  beds: number;
  baths: number;
  parking: number;
  area: number;
  price: string;
  priceValue: number;
  description: string[];
  features: PropertyFeature[];
};

export type PropertyFilters = {
  q?: string;
  badge?: PropertyBadge;
  location?: string;
  minBeds?: number;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
};
