import "server-only";

type QueryValue = string | number | boolean | null | undefined | Array<string | number>;

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  query?: object;
  next?: { revalidate?: number | false; tags?: string[] };
}

export class TopDukaApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "TopDukaApiError";
  }
}

function getConfig() {
  const apiKey = process.env.TOPDUKA_API_KEY || process.env.NEXT_TOPDUKA_API_KEY;
  if (!apiKey) {
    throw new TopDukaApiError(
      "TOPDUKA_API_KEY is missing. Copy .env.example to .env.local and add your store API key.",
      500,
    );
  }

  const configuredUrl = process.env.TOPDUKA_API_URL || process.env.NEXT_TOPDUKA_API_URL;
  if (!configuredUrl) {
    throw new TopDukaApiError(
      "TOPDUKA_API_URL is missing. Use the port 8080 endpoint from your TopDuka ScaleApp.",
      500,
    );
  }

  const origin = configuredUrl.replace(/\/$/, "");

  return {
    apiKey,
    apiUrl: origin.endsWith("/pb/v1") ? origin : `${origin}/pb/v1`,
  };
}

function addQuery(url: URL, query?: object) {
  if (!query) return;

  for (const [key, value] of Object.entries(query) as Array<[string, QueryValue]>) {
    if (value === undefined || value === null || value === "") continue;
    const values = Array.isArray(value) ? value : [value];
    values.forEach((item) => url.searchParams.append(key, String(item)));
  }
}

export async function topdukaRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { apiKey, apiUrl } = getConfig();
  const url = new URL(`${apiUrl}${path}`);
  addQuery(url, options.query);

  const response = await fetch(url, {
    ...options,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: options.cache ?? (options.next ? undefined : "no-store"),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String(payload.message)
        : `TopDuka API request failed with status ${response.status}`;
    throw new TopDukaApiError(message, response.status, payload);
  }

  return payload as T;
}
