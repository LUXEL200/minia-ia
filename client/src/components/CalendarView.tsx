import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarClock, Image as ImageIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useCountdownTick() {
  const [tick, setTick] = useState(0);
  useMemo(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return tick;
}

function countdownOf(scheduledAt: Date): string {
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff <= 0) return "En retard !";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `dans ${d}j ${h}h`;
  if (h > 0) return `dans ${h}h ${m}m`;
  return `dans ${m}m`;
}

interface CalendarViewProps {
  /** Callback quand l'utilisateur clique sur un événement (optionnel : navigation) */
  onEventClick?: (scheduleId: number) => void;
}

export default function CalendarView({ onEventClick }: CalendarViewProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  useCountdownTick();

  const { data: schedules, isLoading } = trpc.schedules.listMonth.useQuery(
    { year, month },
  );

  const daysByDate = useMemo(() => {
    const map = new Map<string, typeof schedules>();
    for (const s of schedules ?? []) {
      const key = toKey(new Date(s.scheduledAt));
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return map;
  }, [schedules]);

  const grid = useMemo(() => {
    const first = new Date(year, month - 1, 1);
    // Ligne ISO : 0 = dimanche → décaler pour que lundi = 0
    const startDow = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month - 1, d));
    // Compléter jusqu'à un multiple de 7
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const todayKey = toKey(now);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-cyan-400" /> Calendrier de publication
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-white min-w-32 text-center">
            {MONTHS_FR[month - 1]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Mois suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-[#181818] border border-white/5 rounded-xl p-3 overflow-x-auto">
        <div className="min-w-[560px]">
          {/* En-tête jours */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_FR.map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-zinc-500 uppercase py-1.5">
                {d}
              </div>
            ))}
          </div>
          {/* Grille */}
          <div className="grid grid-cols-7 gap-1">
            {grid.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="aspect-[4/3]" />;
              const key = toKey(day);
              const events = daysByDate.get(key) ?? [];
              const isToday = key === todayKey;
              return (
                <div
                  key={key}
                  className={`aspect-[4/3] rounded-lg border p-1 flex flex-col gap-0.5 overflow-hidden ${
                    isToday
                      ? "border-cyan-500/50 bg-cyan-500/5"
                      : "border-white/5 bg-[#121212] hover:border-white/15"
                  } transition-colors`}
                >
                  <span className={`text-[10px] font-semibold ${isToday ? "text-cyan-400" : "text-zinc-400"}`}>
                    {day.getDate()}
                  </span>
                  {isLoading ? (
                    <div className="h-5 w-full animate-pulse rounded bg-white/5" />
                  ) : (
                    events.map(s => (
                      <button
                        key={s.id}
                        onClick={() => onEventClick?.(s.id)}
                        title={`${s.youtubeTitle} — ${new Date(s.scheduledAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`}
                        className="flex items-center gap-1 rounded px-1 py-px bg-cyan-500/15 text-[9px] text-cyan-300 truncate hover:bg-cyan-500/25 transition-colors"
                      >
                        <ImageIcon className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="truncate">{s.youtubeTitle}</span>
                      </button>
                    ))
                  )}
                </div>
              );
            })}
          </div>
          {(!isLoading && (schedules ?? []).length === 0) && (
            <p className="text-center text-[10px] text-zinc-500 mt-3 pb-1">
              Aucune publication planifiée ce mois-ci. Planifie une miniature depuis le Dashboard.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
