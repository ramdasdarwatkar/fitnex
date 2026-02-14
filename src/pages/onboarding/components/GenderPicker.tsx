import { User, UserCircle, Users } from "lucide-react";
import type { GenderType } from "../../../types/database.types";

interface GenderPickerProps {
  value: GenderType;
  onChange: (v: GenderType) => void;
}

export const GenderPicker = ({ value, onChange }: GenderPickerProps) => {
  const options = [
    { id: "male" as GenderType, label: "Male", icon: <User size={32} /> },
    {
      id: "female" as GenderType,
      label: "Female",
      icon: <UserCircle size={32} />,
    },
    { id: "other" as GenderType, label: "Other", icon: <Users size={32} /> },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 w-full">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`flex items-center gap-6 p-6 rounded-3xl border-2 transition-all active:scale-95 ${
            value === opt.id
              ? "border-brand bg-brand/10 text-brand"
              : "border-slate-800 bg-slate-900/50 text-slate-500"
          }`}
        >
          <div
            className={`p-4 rounded-2xl ${value === opt.id ? "bg-brand text-white shadow-lg shadow-brand/30" : "bg-slate-800"}`}
          >
            {opt.icon}
          </div>
          <span className="text-xl font-bold uppercase tracking-tight">
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
};
