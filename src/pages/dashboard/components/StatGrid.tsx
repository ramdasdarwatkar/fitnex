import { Weight, Hash, Zap, Flame, Footprints, Clock } from "lucide-react";
import { StatTile } from "./StatTile";
import type { LocalCustomizedStats } from "../../../types/database.types";

interface StatGridProps {
  today: LocalCustomizedStats;
  week: LocalCustomizedStats;
}

export const StatGrid = ({ today, week }: StatGridProps) => {
  return (
    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatTile
        icon={<Weight size={18} strokeWidth={2.5} />}
        label="Volume"
        todayValue={today?.total_volume || 0}
        weekValue={week.total_volume || 0}
        unit="kg"
        themeColor="blue"
      />
      <StatTile
        icon={<Hash size={18} strokeWidth={2.5} />}
        label="Sets"
        todayValue={today?.total_sets || 0}
        weekValue={week.total_sets || 0}
        unit="sets"
        themeColor="brand"
      />
      <StatTile
        icon={<Zap size={18} strokeWidth={2.5} />}
        label="Intensity"
        todayValue={today?.total_reps || 0}
        weekValue={week.total_reps || 0}
        unit="reps"
        themeColor="yellow"
      />
      <StatTile
        icon={<Flame size={18} strokeWidth={2.5} />}
        label="Burn"
        todayValue={today?.calories || 0}
        weekValue={week.calories || 0}
        unit="kcal"
        themeColor="orange"
      />
      <StatTile
        icon={<Footprints size={18} strokeWidth={2.5} />}
        label="Movement"
        todayValue={today?.total_steps || 0}
        weekValue={week.total_steps || 0}
        unit="steps"
        themeColor="emerald"
      />
      <StatTile
        icon={<Clock size={18} strokeWidth={2.5} />}
        label="Duration"
        todayValue={today?.total_duration_min || 0}
        weekValue={week.total_duration_min || 0}
        isTime
        themeColor="violet"
      />
    </section>
  );
};
