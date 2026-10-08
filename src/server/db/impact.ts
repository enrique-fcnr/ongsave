// Same result as private.impact_for_weight(numeric). Postgres numeric rounds half away from
// zero on exact decimals; the exponent trick avoids binary float noise (1.005 → 1.01).
const round = (value: number, digits = 0) => {
  const exact = Number(value.toPrecision(12));
  return Number(`${Math.round(Number(`${exact}e${digits}`))}e-${digits}`);
};

export function impactForWeight(weight: number) {
  return {
    food_saved_kg: weight,
    estimated_meals: round(weight * 2),
    estimated_disposal_savings: round(weight * 7.72, 2),
    estimated_co2_avoided_kg: round(weight * 1.43, 2),
    estimated_water_saved_liters: round(weight * 250),
  };
}
export type Impact = ReturnType<typeof impactForWeight>;
