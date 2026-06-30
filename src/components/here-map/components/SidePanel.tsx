"use client";

import { useState } from "react";
import { PanelRightOpen, X } from "lucide-react";
import { TOOLS, MULTI_CLICK_MODES, MIN_VERTICES_TO_CLOSE } from "../constants/constants";
import { ToolButton } from "./ToolButton";
import type { SidePanelProps } from "../types/types";

// ─────────────────────────────────────────────────────────────────────────────
// SidePanel — collapsible control panel
// ─────────────────────────────────────────────────────────────────────────────

export function SidePanel({
  drawMode, setDrawMode, drawingStatus, savedShapeCount,
  isActivelyDrawing, placedVertexCount, isMapReady, mapLoadError,
  searchQuery, searchResults, isSearching, searchErrorMessage,
  onSearchInput, onSearchSelect, onFinishShape, onUndoVertex,
  onClearAllShapes,
  isDark = true,
}: SidePanelProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const drawTools   = TOOLS.filter((tool) => tool.group === "draw");
  const actionTools = TOOLS.filter((tool) => tool.group === "action");
  const isMultiClickMode = MULTI_CLICK_MODES.has(drawMode);

  const finishButtonMinVertices =
    drawMode === "line"
      ? MIN_VERTICES_TO_CLOSE.line
      : MIN_VERTICES_TO_CLOSE.polygon;

  return (
    <aside
      className={[
        "flex flex-col border-l z-10 shadow-2xl",
        "transition-all duration-300 overflow-hidden",
        isPanelOpen ? "w-60" : "w-12",
        isDark ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-white",
      ].join(" ")}
    >
      {isPanelOpen ? (
        <header
          dir="rtl"
          className={[
            "flex h-11 w-full flex-shrink-0 items-center justify-between gap-2 border-b px-2.5",
            isDark ? "border-slate-700/80 bg-slate-800/80" : "border-gray-200 bg-white",
          ].join(" ")}
        >
          <h1
            className={`min-w-0 flex-1 truncate text-right text-sm font-bold text-primary`}
          >
            رسم الخرائط
          </h1>
          <button
            type="button"
            onClick={() => setIsPanelOpen(false)}
            className={[
              "group flex size-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0",
              "active:scale-95",
              isDark
                ? "text-slate-400 hover:bg-slate-700/80 hover:text-white"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
            ].join(" ")}
            title="إخفاء اللوحة"
            aria-label="إخفاء اللوحة"
          >
            <X
              className="size-[18px] transition-colors group-hover:text-primary"
              strokeWidth={2.25}
            />
          </button>
        </header>
      ) : (
        <button
          type="button"
          onClick={() => setIsPanelOpen(true)}
          className={[
            "group relative flex h-11 w-full flex-shrink-0 items-center justify-center border-b",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0",
            "active:scale-[0.98]",
            isDark
              ? "border-slate-700/80 bg-slate-800/80 hover:bg-slate-700/40"
              : "border-gray-200 bg-white hover:bg-gray-50",
          ].join(" ")}
          title="إظهار اللوحة"
          aria-label="إظهار اللوحة"
          aria-expanded={false}
        >
          <span
            className={[
              "flex size-9 items-center justify-center rounded-lg transition-all duration-200",
              "group-hover:scale-105",
              isDark
                ? "bg-slate-700/60 text-slate-300 shadow-inner shadow-black/20 group-hover:bg-slate-600/80 group-hover:text-white"
                : "bg-gray-100 text-gray-600 shadow-sm group-hover:bg-gray-200 group-hover:text-gray-900",
            ].join(" ")}
            aria-hidden="true"
          >
            <PanelRightOpen
              className="size-[18px] shrink-0 transition-colors group-hover:text-primary"
              strokeWidth={2.25}
            />
          </span>
        </button>
      )}

      {isPanelOpen && (
        <div className="flex flex-col gap-2 p-3 overflow-y-auto flex-1">

          <section aria-label="البحث عن موقع">
            <div className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => onSearchInput(event.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                placeholder="ابحث عن مدينة أو موقع…"
                aria-label="البحث عن مدينة"
                className={`w-full rounded-md border px-2.5 py-2 text-xs focus:outline-none focus:border-primary/60 text-right ${isDark
                  ? "border-slate-600 bg-slate-700 text-slate-200 placeholder-slate-500"
                  : "border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400"
                  }`}
              />
              {isSearching && (
                <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-[10px] animate-pulse ${isDark ? "text-slate-400" : "text-gray-500"
                  }`}>
                  جار البحث…
                </span>
              )}
            </div>
            {searchErrorMessage && (
              <p className={`text-[10px] mt-1 ${isDark ? "text-red-400" : "text-red-600"}`} role="alert">
                {searchErrorMessage}
              </p>
            )}
            {searchResults.length > 0 && (
              <ul
                className={`mt-1 rounded-md border overflow-hidden ${isDark ? "border-slate-600 bg-slate-700" : "border-gray-200 bg-white"
                  }`}
                role="listbox"
                aria-label="نتائج البحث"
              >
                {searchResults.map((result, index) => (
                  <li key={index} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onClick={() => onSearchSelect(result)}
                      className={`w-full text-right px-2.5 py-1.5 text-[11px] transition-colors border-b last:border-0 ${isDark
                        ? "text-slate-200 hover:bg-primary hover:text-white border-slate-600"
                        : "text-gray-700 hover:bg-primary hover:text-primary border-gray-200"
                        }`}
                    >
                      {result.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="الإجراءات">
            <p className={`text-[9px] uppercase tracking-widest mb-1.5 ${isDark ? "text-slate-500" : "text-gray-500"}`}>
              الإجراءات
            </p>
            <nav className="flex flex-col gap-1">
              {actionTools.map((tool) => (
                <ToolButton
                  key={tool.mode}
                  tool={tool}
                  isActive={drawMode === tool.mode}
                  onClick={() => setDrawMode(tool.mode)}
                  isDark={isDark}
                />
              ))}
            </nav>
          </section>

          <section aria-label="أدوات الرسم">
            <p className={`text-[9px] uppercase tracking-widest mb-1.5 ${isDark ? "text-slate-500" : "text-gray-500"}`}>
              أدوات الرسم
            </p>
            <nav className="flex flex-col gap-1">
              {drawTools.map((tool) => (
                <ToolButton
                  key={tool.mode}
                  tool={tool}
                  isActive={drawMode === tool.mode}
                  onClick={() => setDrawMode(tool.mode)}
                  isDark={isDark}
                />
              ))}
            </nav>
          </section>

          <footer className={`mt-auto flex flex-col gap-2 pt-2 border-t ${isDark ? "border-slate-700" : "border-gray-200"}`}>

            <div
              className={`rounded-md border p-2.5 ${isDark
                ? "border-slate-600 bg-slate-700/40"
                : "border-gray-200 bg-gray-50"
                }`}
              aria-live="polite"
              aria-label="حالة الرسم"
            >
              <p className={`text-[9px] uppercase tracking-widest mb-1 ${isDark ? "text-slate-500" : "text-gray-500"}`}>
                الحالة
              </p>
              <p className={`text-[11px] leading-relaxed ${isDark ? "text-slate-200" : "text-gray-700"}`}>
                {drawingStatus}
              </p>
            </div>

            {isMultiClickMode && isActivelyDrawing && (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={onUndoVertex}
                  disabled={placedVertexCount === 0}
                  aria-label="التراجع عن آخر نقطة"
                  className={`flex-1 rounded-md border px-2 py-1.5 text-[11px] transition-colors disabled:opacity-30 disabled:pointer-events-none ${isDark
                    ? "border-amber-700 bg-amber-900/30 text-amber-300 hover:bg-amber-800/50 hover:text-white"
                    : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-900"
                    }`}
                >
                  ↩ تراجع
                </button>
                <button
                  type="button"
                  onClick={onFinishShape}
                  disabled={placedVertexCount < finishButtonMinVertices}
                  aria-label="إنهاء الشكل"
                  className={`flex-1 rounded-md border px-2 py-1.5 text-[11px] transition-colors disabled:opacity-30 disabled:pointer-events-none ${isDark
                    ? "border-green-700 bg-green-900/30 text-green-300 hover:bg-green-800/50 hover:text-white"
                    : "border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-900"
                    }`}
                >
                  ✓ إنهاء
                </button>
              </div>
            )}

            {savedShapeCount > 0 && onClearAllShapes && (
              <button
                type="button"
                onClick={onClearAllShapes}
                aria-label="مسح الشكل وإعادة الرسم"
                className={`w-full rounded-md border px-2 py-1.5 text-[11px] transition-colors ${isDark
                  ? "border-red-700 bg-red-900/30 text-red-300 hover:bg-red-800/50 hover:text-white"
                  : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-900"
                  }`}
              >
                🗑 مسح الشكل وإعادة الرسم
              </button>
            )}

            {!isMapReady && !mapLoadError && (
              <p className={`text-[10px] animate-pulse ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                جار تحميل الخريطة…
              </p>
            )}
            {mapLoadError && (
              <p className={`text-[10px] break-words ${isDark ? "text-red-400" : "text-red-600"}`} role="alert">
                ⚠ {mapLoadError}
              </p>
            )}
          </footer>
        </div>
      )}
    </aside>
  );
}
