import { Weight, Hash, Zap, Flame, Footprints, Clock } from "lucide-react";
import { StatTile } from "./StatTile";

export const StatGrid = ({ today, week }: { today: any; week: any }) => {
  return (
    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatTile
        icon={<Weight size={16} />}
        label="Volume"
        todayValue={today?.total_volume}
        weekValue={week?.total_volume}
        unit="kg"
      />
      <StatTile
        icon={<Hash size={16} />}
        label="Sets"
        todayValue={today?.total_sets}
        weekValue={week?.total_sets}
      />
      <StatTile
        icon={<Zap size={16} />}
        label="Reps"
        todayValue={today?.total_reps}
        weekValue={week?.total_reps}
      />
      <StatTile
        icon={<Flame size={16} />}
        label="Calories"
        todayValue={today?.calories}
        weekValue={week?.calories}
        unit="kcal"
      />
      <StatTile
        icon={<Footprints size={16} />}
        label="Steps"
        todayValue={today?.total_steps}
        weekValue={week?.total_steps}
      />
      <StatTile
        icon={<Clock size={16} />}
        label="Time"
        todayValue={today?.total_duration_min}
        weekValue={week?.total_duration_min}
        isTime
      />
    </section>
  );
};
