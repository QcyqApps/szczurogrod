// Zod schemas + DTO types for the survivor router. Imported by both the
// server (validation in `routers/survivor.ts`) and client (response typing
// flows through tRPC inference, but client uses these names for hub display).

import { z } from 'zod';

export const startRunInputSchema = z.object({
  stageId: z.number().int().min(1).max(99),
});
export type StartRunInput = z.infer<typeof startRunInputSchema>;

export const startRunResponseSchema = z.object({
  runId: z.string().uuid(),
  stageId: z.number().int().min(1),
  seed: z.number().int(),
});
export type StartRunResponse = z.infer<typeof startRunResponseSchema>;

export const finishRunInputSchema = z.object({
  runId: z.string().uuid(),
  kills: z.number().int().min(0).max(100_000),
  bossKilled: z.boolean(),
  durationMs: z.number().int().min(0).max(20 * 60 * 1000),
});
export type FinishRunInput = z.infer<typeof finishRunInputSchema>;

export const finishRunResponseSchema = z.object({
  accepted: z.boolean(),
  reason: z.string().nullable(),
  okruchyEarned: z.number().int().min(0),
  unlockedStage: z.number().int().min(1).nullable(),
  newOkruchyTotal: z.number().int().min(0),
  newMaxStageUnlocked: z.number().int().min(1),
});
export type FinishRunResponse = z.infer<typeof finishRunResponseSchema>;

export const unlockSkillInputSchema = z.object({
  nodeId: z.string().min(1).max(64),
});
export type UnlockSkillInput = z.infer<typeof unlockSkillInputSchema>;

export const skillProgressionEntrySchema = z.object({
  nodeId: z.string(),
  level: z.number().int().min(0),
});
export type SkillProgressionEntry = z.infer<typeof skillProgressionEntrySchema>;

export const survivorMetaSchema = z.object({
  okruchy: z.number().int().min(0),
  maxStageUnlocked: z.number().int().min(1),
  totalRuns: z.number().int().min(0),
  totalKills: z.number().int().min(0),
});
export type SurvivorMetaDTO = z.infer<typeof survivorMetaSchema>;

export const getHubResponseSchema = z.object({
  meta: survivorMetaSchema,
  skillProgression: z.array(skillProgressionEntrySchema),
});
export type GetHubResponse = z.infer<typeof getHubResponseSchema>;
