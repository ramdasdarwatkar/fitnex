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
        icon={<Weight size={18} />}
        label="Volume"
        todayValue={today?.total_volume || 0}
        weekValue={week.total_volume || 0}
        unit="kg"
      />
      <StatTile
        icon={<Hash size={18} />}
        label="Sets"
        todayValue={today?.total_sets || 0}
        weekValue={week.total_sets || 0}
        unit="sets"
      />
      <StatTile
        icon={<Zap size={18} />}
        label="Intensity"
        todayValue={today?.total_reps || 0}
        weekValue={week.total_reps || 0}
        unit="reps"
      />
      <StatTile
        icon={<Flame size={18} />}
        label="Burn"
        todayValue={today?.calories || 0}
        weekValue={week.calories || 0}
        unit="kcal"
      />
      <StatTile
        icon={<Footprints size={18} />}
        label="Movement"
        todayValue={today?.total_steps || 0}
        weekValue={week.total_steps || 0}
        unit="steps"
      />
      <StatTile
        icon={<Clock size={18} />}
        label="Duration"
        todayValue={today?.total_duration_min || 0}
        weekValue={week.total_duration_min || 0}
        isTime
      />
    </section>
  );
};
