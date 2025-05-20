// src/components/admin/shared/AdminSearchBar.tsx
import { useState } from "react";
import { FaSearch } from "react-icons/fa";

interface AdminSearchBarProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
}

const AdminSearchBar: React.FC<AdminSearchBarProps> = ({
  onSearch,
  placeholder = "Search...",
}) => {
  const [term, setTerm] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(term);
  };

  return (
    <form onSubmit={handleSubmit} className="join w-full md:max-w-md">
      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        className="input input-bordered join-item w-full focus:ring-primary focus:border-primary bg-zinc-700 border-zinc-600 placeholder-zinc-500"
        placeholder={placeholder}
      />
      <button type="submit" className="btn btn-primary join-item">
        <FaSearch />
      </button>
    </form>
  );
};

export default AdminSearchBar;
