import { redirect } from "next/navigation";
import { operationalData } from "@/lib/data";
import { MissionBoard } from "@/components/mission-board";
export default async function Missions() {
  const { client, profile, rescues, orgs } = await operationalData();
  if (profile.role !== "DRIVER") redirect("/home");
  const { data: d, error } = await client
    .from("drivers")
    .select("*")
    .eq("profile_id", profile.id)
    .single();
  if (error) throw new Error(error.message);
  return (
    <div className="stack">
      <div className="title-block">
        <span className="eyebrow muted">Cada trajeto importa</span>
        <h1>Olá, {profile.name.split(" ")[0]}.</h1>
        <p>Encontre sua próxima missão de resgate.</p>
      </div>
      <MissionBoard
        rescues={rescues.filter((r) => !["DELIVERED", "CANCELLED"].includes(r.status))}
        orgs={orgs}
        position={[d.mock_longitude, d.mock_latitude]}
      />
    </div>
  );
}
