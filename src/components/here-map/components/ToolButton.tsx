"use client";

import type { Tool, DrawMode, ToolButtonProps } from "../types/types";

// ─────────────────────────────────────────────────────────────────────────────
// ToolButton — single toolbar item
// ─────────────────────────────────────────────────────────────────────────────

export function ToolButton({ tool, isActive, onClick, isDark = true }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center gap-2 rounded-md px-2.5 py-2 text-right text-xs transition-all border w-full",
        isActive
          ? isDark
            ? "bg-primary border-primary text-white shadow-md shadow-primary/50"
            : "bg-primary border-primary text-white shadow-md shadow-primary/20"
          : isDark
            ? "bg-slate-700/60 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white"
            : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:text-gray-900",
      ].join(" ")}
    >
      <span className="flex flex-col flex-1 min-w-0 text-right">
        <span className="font-semibold leading-none">{tool.labelAr}</span>
        <span className={`text-[9px] opacity-55 mt-0.5 truncate ${isDark ? "" : "opacity-70"}`}>{tool.descriptionAr}</span>
      </span>
      <span className="w-5 text-center text-sm leading-none flex-shrink-0">
        {tool.icon}
      </span>
    </button>
  );
}
