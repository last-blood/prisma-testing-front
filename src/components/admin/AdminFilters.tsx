// src/components/admin/shared/AdminFilters.tsx
import React from "react";
import { FaFilter } from "react-icons/fa";

interface FilterOption {
  name: string;
  options: string[];
  defaultValue: string;
}

interface AdminFiltersProps {
  filters: FilterOption[];
  onApplyFilters: (selectedFilters: Record<string, string>) => void;
}

const AdminFilters: React.FC<AdminFiltersProps> = ({
  filters,
  onApplyFilters,
}) => {
  const [currentFilters, setCurrentFilters] = React.useState<
    Record<string, string>
  >(() => {
    const initial: Record<string, string> = {};
    filters.forEach((f) => (initial[f.name] = f.defaultValue));
    return initial;
  });

  const handleChange = (filterName: string, value: string) => {
    setCurrentFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const handleApply = () => {
    onApplyFilters(currentFilters);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-center">
      {filters.map((filter) => (
        <select
          key={filter.name}
          value={currentFilters[filter.name]}
          onChange={(e) => handleChange(filter.name, e.target.value)}
          className="select select-bordered select-sm w-full sm:w-auto focus:ring-primary focus:border-primary bg-zinc-700 border-zinc-600"
        >
          {filter.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ))}
      <button
        onClick={handleApply}
        className="btn btn-outline btn-primary btn-sm w-full sm:w-auto"
      >
        <FaFilter className="mr-1" /> Apply
      </button>
    </div>
  );
};

export default AdminFilters;
