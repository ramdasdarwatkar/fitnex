import { SubPageLayout } from "../../components/layout/SubpageLayout";

export const ProfileDetails = () => {
  return (
    <SubPageLayout title="Profile Details">
      <div className="space-y-4">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-white/5 flex items-center px-4"
          >
            Details {i + 1}
          </div>
        ))}
      </div>
    </SubPageLayout>
  );
};
