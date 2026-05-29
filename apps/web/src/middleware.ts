import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    // Inyectar Correlation ID en la petición
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-request-id", requestId);

    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    let response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    if (token) {
      const userRole = (token as any)?.role || "viewer";
      
      // 1. Rutas reservadas para Administrador o Compliance (ej: configuraciones críticas)
      const adminRoutes = ["/configuracion", "/agentes", "/logs"];
      const isAdminRoute = adminRoutes.some(route => path.startsWith(route));

      if (isAdminRoute && userRole !== "admin" && userRole !== "compliance") {
        response = NextResponse.redirect(new URL("/dashboard", req.url));
      } else {
        // 2. Rutas operativas de Trading (requiere trader, advisor, compliance o admin)
        const tradingRoutes = ["/operaciones", "/portafolios/rebalancear"];
        const isTradingRoute = tradingRoutes.some(route => path.startsWith(route));

        if (isTradingRoute && userRole === "viewer") {
          response = NextResponse.redirect(new URL("/dashboard", req.url));
        }
      }
    }

    // Añadir headers de observabilidad a la respuesta
    response.headers.set("x-request-id", requestId);
    response.headers.set("x-response-time", `${Date.now() - startTime}ms`);

    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/portafolios/:path*",
    "/operaciones/:path*",
    "/analisis/:path*",
    "/agentes/:path*",
    "/configuracion/:path*",
  ],
};
