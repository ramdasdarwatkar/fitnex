import { SubPageLayout } from "../../components/layout/SubpageLayout";

export const ProfileMetrics = () => {
  return (
    <SubPageLayout title="Measurements">
      <div className="space-y-4">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-white/5 flex items-center px-4"
          >
            Metric {i + 1}
          </div>
        ))}
      </div>
    </SubPageLayout>
  );
};
