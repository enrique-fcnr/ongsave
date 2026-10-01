import type { SurplusAnalysis } from "./types";
export const demoAnalysis: SurplusAnalysis = {
  title: "Hortifrúti misto",
  category: "produce",
  items: [
    { name: "Banana", estimated_quantity: 24, confidence: 0.92 },
    { name: "Tomate", estimated_quantity: 30, confidence: 0.87 },
    { name: "Alface", estimated_quantity: 12, confidence: 0.89 },
    { name: "Maçã", estimated_quantity: 20, confidence: 0.9 },
  ],
  estimated_weight_kg: 38,
  estimated_weight_range: { min: 32, max: 44 },
  visual_condition: "acceptable",
  pickup_priority: "high",
  recommended_pickup_hours: 8,
  confidence: 0.89,
  warnings: [
    "Análise simulada para apresentação. Revise todos os itens e o peso.",
    "A análise visual não substitui a avaliação da equipe responsável pelo alimento.",
  ],
};
