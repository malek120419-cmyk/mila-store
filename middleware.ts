import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/@vite/client") {
    return new NextResponse(`// Vite client stub
export default {};
`, { headers: { "content-type": "application/javascript" }, status: 200 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/@vite/client"],
};
