import { z } from "zod";
import { categories } from "../domain";
export const analysisSchema = z
  .object({
    title: z.string().min(3).max(120),
    category: z.enum(categories),
    items: z
      .array(
        z.object({
          name: z.string().min(1).max(80),
          estimated_quantity: z.number().nonnegative(),
          confidence: z.number().min(0).max(1),
        }),
      )
      .max(30),
    estimated_weight_kg: z.number().positive().max(5000),
    estimated_weight_range: z.object({ min: z.number().nonnegative(), max: z.number().positive() }),
    visual_condition: z.enum(["acceptable", "attention", "not_recommended", "inconclusive"]),
    pickup_priority: z.enum(["low", "medium", "high", "urgent"]),
    recommended_pickup_hours: z.number().int().min(1).max(72),
    confidence: z.number().min(0).max(1),
    warnings: z.array(z.string().max(500)).max(20),
  })
  .refine(
    (x) =>
      x.estimated_weight_range.min <= x.estimated_weight_kg &&
      x.estimated_weight_kg <= x.estimated_weight_range.max,
    "O peso deve estar dentro da faixa estimada.",
  );
export const publicationSchema = z.object({
  title: z.string().min(3).max(120),
  category: z.enum(categories),
  description: z.string().max(1000),
  estimated_weight_kg: z.coerce.number().positive().max(5000),
  pickup_priority: z.enum(["low", "medium", "high", "urgent"]),
  recommended_pickup_hours: z.coerce.number().int().min(1).max(72),
  visual_condition: z.enum(["acceptable", "attention", "not_recommended", "inconclusive"]),
  user_confirmed: z.literal(true),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        estimated_quantity: z.number().nonnegative(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .max(30),
});
