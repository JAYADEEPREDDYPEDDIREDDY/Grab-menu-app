import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange }) {
  return (
    <div className="mx-auto w-full max-w-[838px] px-2 md:px-3">
      <label className="flex h-[66px] w-full items-center rounded-full border border-white/[0.03] bg-[#1A1715] px-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_14px_30px_rgba(0,0,0,0.18)] transition-all duration-300 focus-within:border-[#FF8C2B]/20 focus-within:shadow-[0_18px_36px_rgba(255,140,43,0.10)]">
        <Search size={18} className="mr-4 shrink-0 text-[#6F6A63]" />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search for dishes, drinks..."
          className="h-full w-full appearance-none border-0 bg-transparent p-0 text-[15px] text-white outline-none ring-0 placeholder:text-[#8C8379] focus:outline-none focus:ring-0"
        />
      </label>
    </div>
  );
}
