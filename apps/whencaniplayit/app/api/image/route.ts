const CACHE_SECONDS = 60 * 60 * 24;
const ALLOWED_HOSTS = new Set([
  "images.igdb.com",
  "img.opencritic.com",
  "opencritic.com",
  "www.opencritic.com",
  "opencritic-cdn.b-cdn.net",
  "p3.opencritic.com",
]);

function buildCacheControlHeader() {
  return `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new Response("Missing url", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(target.hostname)) {
    console.error(`Image proxy blocked hostname: ${target.hostname} from URL: ${url}`);
    return new Response(`Invalid host: ${target.hostname}`, { status: 400 });
  }

  const upstream = await fetch(target.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; WhencaniBot/1.0; +https://whencaniplayit.com)",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
  });

  if (!upstream.ok) {
    return new Response("Upstream error", { status: upstream.status });
  }

  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }
  headers.set("cache-control", buildCacheControlHeader());

  return new Response(upstream.body ?? (await upstream.arrayBuffer()), {
    status: 200,
    headers,
  });
}
