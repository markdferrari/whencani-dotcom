import { type NextRequest, NextResponse } from 'next/server'

const BOT_UA_PATTERN =
  /bot|crawler|spider|scraper|crawling|GPTBot|ClaudeBot|Bytespider|Applebot|FacebookBot|Googlebot|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|facebot|ia_archiver/i

export function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') ?? ''

  if (BOT_UA_PATTERN.test(ua) && request.nextUrl.pathname !== '/') {
    return new NextResponse(null, { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|txt|xml|json)).*)',
  ],
}
