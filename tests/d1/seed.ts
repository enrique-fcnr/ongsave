import { demoUserStatements } from "../../scripts/create-demo-users";
import { organizationStatements, seedStatements } from "../../scripts/seed-d1";

// Same SQL the demo scripts apply to the local/remote D1.
export async function seedDemo(d1: D1Database, now = new Date()) {
  const statements = [
    ...organizationStatements(),
    ...(await demoUserStatements()),
    ...seedStatements(now),
  ];
  await d1.batch(statements.map((s) => d1.prepare(s)));
}
