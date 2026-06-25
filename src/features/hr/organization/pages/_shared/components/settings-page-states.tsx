import { Card, CardContent } from '@/components/ui/card';

export function SettingsPageLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-[72px] rounded-xl border border-border bg-muted/30" />
      <div className="h-12 rounded-xl border border-border bg-muted/30" />
      <div className="h-80 rounded-xl border border-border bg-muted/30" />
    </div>
  );
}

export function SettingsPageEmpty({ message }: { message: string }) {
  return (
    <Card className="border-dashed shadow-none">
      <CardContent className="py-12 text-center text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  );
}

export function SettingsPageError({ message }: { message: string }) {
  return (
    <Card className="border-destructive/30 bg-destructive/5 shadow-none">
      <CardContent className="py-10 text-center text-sm text-destructive">{message}</CardContent>
    </Card>
  );
}
