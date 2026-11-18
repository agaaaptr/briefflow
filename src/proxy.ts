import { NextResponse, type NextRequest } from "next/server";

// Next 16: middleware.ts diganti proxy.ts. Ini hanya cek kasar ada-tidaknya
// cookie sesi (UX redirect); keputusan otoritatif tetap di requireAuth()
// pada layout dashboard dan tiap Server Action.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("briefflow_session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
