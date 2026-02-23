import { Weight, Hash, Zap, Flame, Footprints, Clock } from "lucide-react";
import { StatTile } from "./StatTile";
import type { CustomizedStats } from "../../../types/database.types";

interface StatGridProps {
  today: Partial<CustomizedStats> | null;
  week: CustomizedStats;
}

export const StatGrid = ({ today, week }: StatGridProps) => {
  return (
    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatTile
        icon={<Weight size={16} />}
        label="Volume"
        todayValue={today?.total_volume || 0}
        weekValue={week.total_volume || 0}
        unit="kg"
      />
      <StatTile
        icon={<Hash size={16} />}
        label="Sets"
        todayValue={today?.total_sets || 0}
        weekValue={week.total_sets || 0}
      />
      <StatTile
        icon={<Zap size={16} />}
        label="Reps"
        todayValue={today?.total_reps || 0}
        weekValue={week.total_reps || 0}
      />
      <StatTile
        icon={<Flame size={16} />}
        label="Calories"
        todayValue={today?.calories || 0}
        weekValue={week.calories || 0}
        unit="kcal"
      />
      <StatTile
        icon={<Footprints size={16} />}
        label="Steps"
        todayValue={today?.total_steps || 0}
        weekValue={week.total_steps || 0}
      />
      <StatTile
        icon={<Clock size={16} />}
        label="Time"
        todayValue={today?.total_duration_min || 0}
        weekValue={week.total_duration_min || 0}
        isTime
      />
    </section>
  );
};
