import { z } from 'zod';
export const creationSchema = z
  .object({
    premise: z.string().trim().min(20).max(1000),
    difficulty: z.enum(['easy', 'medium', 'hard']),
  })
  .strict();
export const accusationSchema = z.object({ suspectId: z.string().min(1).max(40) }).strict();
export const emptySchema = z.object({}).strict();
