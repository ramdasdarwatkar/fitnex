import { User, UserCircle, Users } from "lucide-react";
import type { GenderType } from "../../../types/database.types";

interface GenderPickerProps {
  value: GenderType;
  onChange: (v: GenderType) => void;
}

export const GenderPicker = ({ value, onChange }: GenderPickerProps) => {
  const options = [
    { id: "male" as GenderType, label: "Male", icon: <User size={24} /> },
    {
      id: "female" as GenderType,
      label: "Female",
      icon: <UserCircle size={24} />,
    },
    { id: "other" as GenderType, label: "Other", icon: <Users size={24} /> },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 w-full">
      {options.map((opt) => {
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex items-center gap-6 p-5 rounded-xl border transition-all active:scale-[0.98] ${
              isActive
                ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                : "border-border-color bg-bg-surface text-text-muted"
            }`}
          >
            <div
              className={`p-4 rounded-xl transition-colors ${
                isActive
                  ? "bg-brand-primary text-bg-main shadow-md shadow-brand-primary/10"
                  : "bg-bg-main text-text-muted"
              }`}
            >
              {opt.icon}
            </div>
            <span className="text-[13px] font-black uppercase italic tracking-widest">
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
