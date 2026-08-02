/** Minimal chrome-free shell for embeddable print views (mobile WebView). */
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-foreground" dir="rtl">
      {children}
    </div>
  );
}
