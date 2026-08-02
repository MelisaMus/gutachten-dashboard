import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const unlockSite = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ password: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data }) => {
    const { unlock } = await import("./gate.server");
    return unlock(data.password);
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

export const getAuditLog = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./gate.server");
  await requireAdmin();
  const { leseProtokoll } = await import("./audit.server");
  return { eintraege: await leseProtokoll(100) };
});

export const getPasswordChangeHistory = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./gate.server");
  await requireAdmin();
  const { lesePasswortHistorie } = await import("./audit.server");
  return { eintraege: await lesePasswortHistorie(20) };
});

export const createPasswordResetGrant = createServerFn({ method: "POST" }).handler(async () => {
  const { createResetGrant } = await import("./gate.server");
  return createResetGrant();
});

export const checkPasswordResetGrant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data }) => {
    const { checkResetGrant } = await import("./gate.server");
    return checkResetGrant(data.token);
  });

export const redeemPasswordResetGrant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string().min(1).max(200),
        neuesPasswort: z.string().min(12).max(200),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { redeemResetGrant } = await import("./gate.server");
    return redeemResetGrant(data.token, data.neuesPasswort);
  });
