// Prisma client stub — replace with real client once schema is set up
// This allows the app to build without a database connection

const handler = {
  get(_target: unknown, prop: string): unknown {
    // Return a chainable proxy for any model access (e.g. prisma.project.findUnique)
    return new Proxy(
      {},
      {
        get(_t: unknown, method: string) {
          return async (..._args: unknown[]) => {
            console.warn(
              `[prisma stub] ${prop}.${method}() called — no database configured`
            );
            return null;
          };
        },
      }
    );
  },
};

export const prisma = new Proxy({}, handler) as any;
