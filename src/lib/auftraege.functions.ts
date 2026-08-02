import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const fachSchema = z.enum([
  "Neurologie",
  "Neuropsychologie",
  "Neurophysiologie",
  "EEG",
  "Orthopädie",
  "Psychiatrie",
  "Sonstiges",
]);

const phaseSchema = z.enum([
  "Auftragseingang",
  "Terminiert",
  "Untersuchung erfolgt",
  "In Bearbeitung",
  "Versandt",
  "Abgerechnet",
]);

const zusatzSchema = z.array(
  z.object({
    fach: fachSchema,
    beauftragtAm: z.string().max(20).nullable(),
    eingegangen: z.boolean(),
  }),
);

const neuSchema = z.object({
  aktenzeichen: z.string().trim().min(1).max(80),
  auftraggeber: z.enum(["Gericht", "Versicherung", "Berufsgenossenschaft", "Sonstige"]),
  fach: fachSchema,
  gutachterKuerzel: z.string().trim().min(1).max(20),
  auftragEingangAm: z.string().max(20),
  terminAm: z.string().max(20).nullable(),
  fristAm: z.string().max(20),
  phase: phaseSchema,
  zusatz: zusatzSchema,
  abrechnungsdatenKomplett: z.boolean(),
  fristverlaengerungen: z.number().int().min(0).max(50),
  notiz: z.string().max(1000),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  patch: neuSchema.partial(),
});

export const getAuftraege = createServerFn({ method: "GET" }).handler(async () => {
  const { listAuftraege } = await import("./auftraege.server");
  return listAuftraege();
});

export const addAuftrag = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => neuSchema.parse(data))
  .handler(async ({ data }) => {
    const { createAuftrag } = await import("./auftraege.server");
    return createAuftrag(data);
  });

export const patchAuftrag = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => patchSchema.parse(data))
  .handler(async ({ data }) => {
    const { updateAuftrag } = await import("./auftraege.server");
    return updateAuftrag(data.id, data.patch);
  });

export const removeAuftrag = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { deleteAuftrag } = await import("./auftraege.server");
    await deleteAuftrag(data.id);
    return { ok: true as const };
  });
