const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_USER_AGENT = 'junggu-trash-map/1.0 changcitto@gmail.com';

type JsonRecord = Record<string, unknown>;

export type NominatimResult = {
  place_id: number;
  licence?: string;
  osm_type?: string;
  osm_id?: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank?: number;
  importance?: number;
  addresstype?: string;
  name?: string;
  display_name: string;
  boundingbox?: string[];
};

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function toOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function toOptionalString(value: unknown): string | undefined {
  return isString(value) ? value : undefined;
}

function toNominatimResult(value: unknown): NominatimResult | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const record = value as JsonRecord;
  if (
    typeof record.place_id !== 'number' ||
    !isString(record.display_name) ||
    !isString(record.lat) ||
    !isString(record.lon) ||
    !isString(record.type) ||
    !isString(record.class)
  ) {
    return null;
  }

  return {
    place_id: record.place_id,
    licence: toOptionalString(record.licence),
    osm_type: toOptionalString(record.osm_type),
    osm_id: toOptionalNumber(record.osm_id),
    lat: record.lat,
    lon: record.lon,
    class: record.class,
    type: record.type,
    place_rank: toOptionalNumber(record.place_rank),
    importance: toOptionalNumber(record.importance),
    addresstype: toOptionalString(record.addresstype),
    name: toOptionalString(record.name),
    display_name: record.display_name,
    boundingbox: isStringArray(record.boundingbox)
      ? record.boundingbox
      : undefined,
  };
}

export async function searchNominatim(query: string): Promise<NominatimResult[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const params = new URLSearchParams({
    format: 'json',
    countrycodes: 'kr',
    viewbox: '126.95,37.58,127.02,37.55',
    bounded: '1',
    limit: '5',
    q: trimmedQuery,
  });

  const response = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
    cache: 'no-store',
    headers: {
      'User-Agent': NOMINATIM_USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim search failed: ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Invalid Nominatim response');
  }

  return data
    .map((item) => toNominatimResult(item))
    .filter((item): item is NominatimResult => item !== null);
}
