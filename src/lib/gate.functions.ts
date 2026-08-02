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

export const getGateStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { isUnlocked, isAdmin } = await import("./gate.server");
  return { unlocked: await isUnlocked(), admin: await isAdmin() };
});

export const requireAdminSession = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./gate.server");
  await requireAdmin();
  return { ok: true as const };
});

export const changeSitePassword = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        adminPasswort: z.string().min(1).max(200),
        neuesPasswort: z.string().min(12).max(200),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { changeTeamPassword } = await import("./gate.server");
    return changeTeamPassword(data.adminPasswort, data.neuesPasswort);
  });
