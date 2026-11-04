/**
 * Minimal shapes for the Contentful Delivery API responses these stores read.
 *
 * Only the fields actually used are declared; Contentful returns a great deal
 * more. Declaring the subset keeps the annotations honest without pretending
 * to model the whole API.
 */

export interface ContentfulAsset {
  sys: { id: string };
  fields: { file: { url: string } };
}

/** A reference to an asset as it appears inside an entry's own fields. */
export interface ContentfulAssetLink {
  sys?: { id?: string };
}

export interface ContentfulEntry<TFields> {
  sys: { id: string };
  fields: TFields;
}

/**
 * The envelope these stores write to AsyncStorage and read back with
 * JSON.parse, which otherwise yields `any`.
 */
export interface CacheEnvelope<T> {
  data: T[];
  timestamp: number;
}
