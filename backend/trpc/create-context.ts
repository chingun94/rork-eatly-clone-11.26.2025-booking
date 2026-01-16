import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const authHeader = opts.req.headers.get('authorization');
  const adminToken = authHeader?.replace('Bearer ', '');
  
  return {
    req: opts.req,
    adminToken,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const isAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.adminToken || !ctx.adminToken.startsWith('admin_token_')) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Admin access required' });
  }
  return next({
    ctx: {
      ...ctx,
      isAdmin: true,
    },
  });
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const adminProcedure = t.procedure.use(isAdmin);
