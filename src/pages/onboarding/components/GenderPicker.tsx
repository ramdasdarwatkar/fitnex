import { User, UserCircle, Users } from "lucide-react";
import type { GenderType } from "../../../types/database.types";

interface GenderPickerProps {
  value: GenderType;
  onChange: (v: GenderType) => void;
}

export const GenderPicker = ({ value, onChange }: GenderPickerProps) => {
  const options = [
    { id: "male" as GenderType, label: "Male", icon: <User size={20} /> },
    {
      id: "female" as GenderType,
      label: "Female",
      icon: <UserCircle size={20} />,
    },
    { id: "other" as GenderType, label: "Other", icon: <Users size={20} /> },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 w-full">
      {options.map((opt) => {
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex flex-col items-center gap-2 py-3 px-1 rounded-xl border transition-all active:scale-95 ${
              isActive
                ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                : "border-border-color bg-bg-surface text-text-muted"
            }`}
          >
            <div
              className={`p-2 rounded-xl ${isActive ? "bg-brand-primary text-bg-main" : "bg-bg-main text-text-muted"}`}
            >
              {opt.icon}
            </div>
            <span className="text-[10px] font-black uppercase italic tracking-widest leading-none">
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
