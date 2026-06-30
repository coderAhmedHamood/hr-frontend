import { Toaster } from 'sonner';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors position="top-right" dir="rtl" closeButton />
    </>
  );
}
