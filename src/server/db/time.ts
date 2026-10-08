// Server clock, equivalent to public.operational_time() (Postgres now()). Receiving windows
// and the NGO daily capacity use America/Sao_Paulo, like the original functions.
export const TIME_ZONE = "America/Sao_Paulo";

export function operationalTime(): Date {
  return new Date();
}

const parts = (date: Date) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  ) as Record<"year" | "month" | "day" | "hour" | "minute" | "second", string>;

// Local São Paulo wall clock as `HH:MM:SS`, comparable with `HH:MM:00` window bounds.
export function saoPauloClock(date: Date) {
  const p = parts(date);
  return `${p.hour}:${p.minute}:${p.second}`;
}

function offsetMinutes(date: Date) {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, timeZoneName: "longOffset" })
    .formatToParts(date)
    .find((p) => p.type === "timeZoneName")!.value;
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
}

// [start, end) of the São Paulo calendar day containing `date`, as ISO UTC strings.
export function saoPauloDay(date: Date) {
  const p = parts(date);
  const midnightUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day));
  const start = new Date(midnightUtc - offsetMinutes(new Date(midnightUtc)) * 60000);
  const next = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day) + 1);
  const end = new Date(next - offsetMinutes(new Date(next)) * 60000);
  return { start: start.toISOString(), end: end.toISOString() };
}
