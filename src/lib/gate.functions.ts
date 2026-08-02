import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const unlockSite = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ password: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data }) => {
    const { unlock } = await import("./gate.server");
    return { ok: await unlock(data.password) };
  });

export const lockSite = createServerFn({ method: "POST" }).handler(async () => {
  const { lock } = await import("./gate.server");
  await lock();
  return { ok: true as const };
});
