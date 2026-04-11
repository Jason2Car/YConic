import { router } from "../init";
import { projectRouter } from "./project";
import { moduleRouter } from "./module";
import { sessionRouter } from "./session";

export const appRouter = router({
  project: projectRouter,
  module: moduleRouter,
  session: sessionRouter,
});

export type AppRouter = typeof appRouter;
