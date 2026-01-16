import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", async (c, next) => {
  const origin = c.req.header("Origin") || "*";
  
  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, x-trpc-source, Accept, Origin, content-type",
        "Access-Control-Max-Age": "86400",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }
  
  await next();
  
  c.res.headers.set("Access-Control-Allow-Origin", origin);
  c.res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD");
  c.res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-trpc-source, Accept, Origin, content-type");
  c.res.headers.set("Access-Control-Allow-Credentials", "true");
});

app.use(
  "/api/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "Restaurant API is running", 
    timestamp: new Date().toISOString(),
    version: "1.0.2"
  });
});

export default app;
