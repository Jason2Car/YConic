import { router } from "../init";
import { projectRouter } from "./project";
import { moduleRouter } from "./module";
import { sessionRouter } from "./session";
import { enrollmentRouter } from "./enrollment";

export const appRouter = router({
  project: projectRouter,
  module: moduleRouter,
  session: sessionRouter,
  enrollment: enrollmentRouter,
});

export type AppRouter = typeof appRouter;
