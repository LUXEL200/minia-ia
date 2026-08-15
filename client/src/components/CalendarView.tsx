import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarClock, CalendarDays, Image as ImageIcon, Pencil, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isoWeekKey(d: Date): string {
  return `week-${isoDate(d)}`;
}

function toLocalDatetime(iso: string | Date): string {
  const dt = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export function useCountdownTick() {
  const [, setTick] = useState(0);
  useMemo(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
}

type ViewMode = "month" | "week";

interface EditTarget {
  id: number;
  youtubeTitle: string;
  scheduledAt: Date;
}

// Thème-aware : styles différents en light/dark
const CARD = "bg-[#181818] border border-white/5";
const CELL = "border-white/5 bg-[#121212] hover:border-white/15";
const TEXT_MUTED = "text-zinc-500";
const TEXT_SUB = "text-zinc-400";
const BTN = "border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 transition-colors";
const EVT = "bg-orange-400/15 text-orange-300 hover:bg-cyan-500/25";
const TODAY = "border-orange-400/50 bg-orange-400/5";

export default function CalendarView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [mode, setMode] = useState<ViewMode>("month");
  const [weekStart, setWeekStart] = useState<Date>(now);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  useCountdownTick();

  const utils = trpc.useUtils();
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

  const monthGrid = useMemo(() => {
    const first = new Date(year, month - 1, 1);
    const startDow = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month - 1, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const weekDays = useMemo(() => {
    // Lundi de la semaine courante
    const d = new Date(weekStart);
    d.setHours(0, 0, 0, 0);
    const dow = (d.getDay() + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - dow);
    const arr: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const dd = new Date(monday);
      dd.setDate(monday.getDate() + i);
      arr.push(dd);
    }
    return arr;
  }, [weekStart]);

  const updateNav = (dir: number) => {
    if (mode === "month") {
      if (month + dir > 12) { setYear(y => y + 1); setMonth(1); }
      else if (month + dir < 1) { setYear(y => y - 1); setMonth(12); }
      else setMonth(m => m + dir);
    } else {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + dir * 7);
      setWeekStart(d);
      // Synchroniser la query : on recharge le mois contenant le lundi
      setYear(d.getFullYear());
      setMonth(d.getMonth() + 1);
    }
  };

  const label = mode === "month"
    ? `${MONTHS_FR[month - 1]} ${year}`
    : `Semaine du ${weekDays[0].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;

  const todayKey = toKey(now);
  const visibleDates = mode === "month" ? monthGrid.filter(Boolean) as Date[] : weekDays;
  const visibleCount = visibleDates.length;

  // Cellules semaine : une colonne haute avec créneaux horaires
  const eventsFor = (key: string) => daysByDate.get(key) ?? [];

  const deleteSchedule = trpc.schedules.delete.useMutation({
    onSuccess: () => {
      toast.success("Publication retirée du calendrier");
      utils.schedules.listMonth.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-orange-400" /> Calendrier de publication
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-white/10 overflow-hidden">
            <button
              onClick={() => setMode("month")}
              className={`px-2 py-1 text-[11px] font-medium flex items-center gap-1 transition-colors ${mode === "month" ? "bg-cyan-500/20 text-orange-300" : "text-zinc-400 hover:text-white"}`}
              aria-label="Vue mois"
            >
              <CalendarClock className="w-3.5 h-3.5" /> Mois
            </button>
            <button
              onClick={() => setMode("week")}
              className={`px-2 py-1 text-[11px] font-medium flex items-center gap-1 transition-colors ${mode === "week" ? "bg-cyan-500/20 text-orange-300" : "text-zinc-400 hover:text-white"}`}
              aria-label="Vue semaine"
            >
              <CalendarDays className="w-3.5 h-3.5" /> Semaine
            </button>
          </div>
          <button
            onClick={() => updateNav(-1)}
            className={`p-1.5 rounded-lg ${BTN}`}
            aria-label="Précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-white min-w-32 text-center">{label}</span>
          <button
            onClick={() => updateNav(1)}
            className={`p-1.5 rounded-lg ${BTN}`}
            aria-label="Suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={`${CARD} rounded-xl p-3 overflow-x-auto`}>
        {mode === "month" ? (
          <div className="min-w-[560px]">
            <div className="grid grid-cols-7 mb-1">
              {DAYS_FR.map(d => (
                <div key={d} className={`text-center text-[10px] font-semibold uppercase py-1.5 ${TEXT_MUTED}`}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthGrid.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="aspect-[4/3]" />;
                const key = toKey(day);
                const events = eventsFor(key);
                const isToday = key === todayKey;
                return (
                  <div
                    key={key}
                    className={`aspect-[4/3] rounded-lg border p-1 flex flex-col gap-0.5 overflow-hidden ${
                      isToday ? TODAY : `${CELL} transition-colors`
                    }`}
                  >
                    <span className={`text-[10px] font-semibold ${isToday ? "text-orange-400" : TEXT_SUB}`}>
                      {day.getDate()}
                    </span>
                    {isLoading ? (
                      <div className="h-5 w-full animate-pulse rounded bg-white/5" />
                    ) : events.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setEditing({ id: s.id, youtubeTitle: s.youtubeTitle, scheduledAt: s.scheduledAt })}
                        title={`${s.youtubeTitle} — ${new Date(s.scheduledAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`}
                        className={`flex items-center gap-1 rounded px-1 py-px text-[9px] truncate transition-colors ${EVT}`}
                      >
                        <ImageIcon className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="truncate">{s.youtubeTitle}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="min-w-[700px]">
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(day => {
                const key = toKey(day);
                const events = eventsFor(key);
                const isToday = key === todayKey;
                return (
                  <div key={key} className={`rounded-lg border flex flex-col ${isToday ? TODAY : `${CELL} transition-colors`}`}>
                    <div className={`px-2 pt-2 pb-1 text-center border-b border-white/5 ${isToday ? "text-orange-400" : TEXT_SUB}`}>
                      <div className="text-[10px] font-semibold uppercase">{DAYS_FR[(day.getDay() + 6) % 7]}</div>
                      <div className="text-sm font-bold">{day.getDate()}</div>
                    </div>
                    <div className="p-1.5 flex flex-col gap-1.5 min-h-40">
                      {isLoading ? (
                        <div className="h-5 w-full animate-pulse rounded bg-white/5" />
                      ) : events.length === 0 ? (
                        <span className={`text-[9px] ${TEXT_MUTED} text-center pt-2`}>Libre</span>
                      ) : events.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setEditing({ id: s.id, youtubeTitle: s.youtubeTitle, scheduledAt: s.scheduledAt })}
                          title={`${s.youtubeTitle} — ${new Date(s.scheduledAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`}
                          className={`flex flex-col gap-1 rounded-lg border border-white/5 p-2 text-left transition-colors hover:border-orange-400/40`}
                        >
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-white">
                            <ImageIcon className="w-3 h-3 text-orange-400 flex-shrink-0" />
                            <span className="truncate">{s.youtubeTitle}</span>
                          </span>
                          <span className={`flex items-center gap-1 text-[9px] ${TEXT_SUB}`}>
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(s.scheduledAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {s.imageUrl && (
                            <img src={s.imageUrl} alt={s.youtubeTitle} className="w-full rounded aspect-video object-cover" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {(!isLoading && (schedules ?? []).length === 0) && (
          <p className={`text-center text-[10px] ${TEXT_MUTED} mt-3 pb-1`}>
            Aucune publication planifiée. Planifie une miniature depuis le Dashboard.
          </p>
        )}
      </div>

      {/* Dialog d'édition d'une publication */}
      <ScheduleEditDialog
        target={editing}
        onClose={() => setEditing(null)}
        onDeleted={() => { setEditing(null); utils.schedules.listMonth.invalidate(); }}
      />
    </div>
  );
}

/** Dialog édition (titre + date/heure) d'une publication planifiée */
function ScheduleEditDialog({ target, onClose, onDeleted }: {
  target: EditTarget | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState("");
  const [datetime, setDatetime] = useState("");
  const [open, setOpen] = useState(false);

  // Synchroniser l'état quand le target change
  useMemo(() => {
    if (target) {
      setTitle(target.youtubeTitle);
      setDatetime(toLocalDatetime(target.scheduledAt as Date));
      setOpen(true);
    } else {
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.id]);

  const updateMut = trpc.schedules.update.useMutation({
    onSuccess: () => {
      toast.success("Publication mise à jour");
      utils.schedules.listMonth.invalidate();
      onClose();
    },
    onError: e => toast.error(e.message),
  });

  const deleteMut = trpc.schedules.delete.useMutation({
    onSuccess: () => {
      toast.success("Publication retirée du calendrier");
      utils.schedules.listMonth.invalidate();
      onDeleted();
    },
    onError: e => toast.error(e.message),
  });

  const submit = () => {
    if (!target) return;
    const dt = new Date(datetime);
    if (isNaN(dt.getTime())) { toast.error("Date et heure invalides"); return; }
    if (dt.getTime() < Date.now()) { toast.error("La date doit être dans le futur"); return; }
    updateMut.mutate({ id: target.id, youtubeTitle: title.trim() || target.youtubeTitle, scheduledAt: dt.toISOString() });
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-base">Modifier la publication</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Titre YouTube</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={200}
              placeholder="Titre de la vidéo"
              className="bg-transparent border-white/10 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Date et heure de publication</label>
            <Input
              type="datetime-local"
              value={datetime}
              onChange={e => setDatetime(e.target.value)}
              className="bg-transparent border-white/10 text-white"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            onClick={() => target && deleteMut.mutate({ id: target.id })}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Retirer
          </Button>
          <Button variant="outline" size="sm" className="border-white/10 text-zinc-300 hover:text-white" onClick={onClose}>
            Annuler
          </Button>
          <Button size="sm" onClick={submit} disabled={updateMut.isPending || deleteMut.isPending}>
            <Pencil className="w-3.5 h-3.5 mr-1" /> Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
