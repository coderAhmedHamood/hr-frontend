import Link from 'next/link';
import { ArrowLeft, ArrowRight, ExternalLink, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GuidePage } from '@/features/hr/guide/types';
import { getAdjacentGuidePages, getCategoryLabel } from '@/features/hr/guide/constants/project-guide-content';

function FieldTable({ fields }: { fields: NonNullable<GuidePage['blocks'][0]['fields']> }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-right">
            <th className="px-4 py-2.5 font-semibold">الحقل</th>
            <th className="px-4 py-2.5 font-semibold">الوصف</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <tr key={field.name} className="border-b border-border/60 last:border-0">
              <td className="px-4 py-3 align-top font-medium whitespace-nowrap">
                {field.name}
                {field.required ? <span className="ms-1 text-destructive">*</span> : null}
              </td>
              <td className="px-4 py-3 align-top text-muted-foreground leading-relaxed">{field.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProjectGuideArticle({ page }: { page: GuidePage }) {
  const { prev, next } = getAdjacentGuidePages(page.slug);
  const categoryLabel = getCategoryLabel(page.categoryId);

  return (
    <article className="min-w-0">
      <header className="mb-8 space-y-4 border-b border-border pb-6">
        <p className="text-sm font-bold text-primary">{categoryLabel}</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">{page.title}</h1>

        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-xs font-semibold text-primary mb-1">لماذا هذه الخطوة؟</p>
          <p className="text-sm leading-relaxed text-foreground/90">{page.why}</p>
        </div>

        {page.prerequisites?.length ? (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">يتطلب إكمال: </span>
            {page.prerequisites.join(' · ')}
          </div>
        ) : null}

        {page.systemHref ? (
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href={page.systemHref}>
              <ExternalLink className="h-3.5 w-3.5" />
              {page.systemHrefLabel ?? 'فتح الصفحة في النظام'}
            </Link>
          </Button>
        ) : null}
      </header>

      <div className="prose-guide space-y-10">
        {page.blocks.map((block) => (
          <section key={block.id} id={block.id} className="scroll-mt-28">
            <h2 className="mb-3 text-xl font-semibold tracking-tight">{block.title}</h2>
            <div className="space-y-3">
              {block.paragraphs?.map((p) => (
                <p key={p} className="text-sm leading-7 text-foreground/90">{p}</p>
              ))}
            </div>
            {block.bullets?.length ? (
              <ul className="mt-4 space-y-2">
                {block.bullets.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/85">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {block.fields?.length ? (
              <div className="mt-4">
                <FieldTable fields={block.fields} />
              </div>
            ) : null}
            {block.note ? (
              <div className="mt-4 flex gap-2 rounded-lg border border-gold/30 bg-gold/5 px-3 py-2.5 text-xs leading-relaxed text-foreground/85">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>{block.note}</span>
              </div>
            ) : null}
          </section>
        ))}
      </div>

      {(prev || next) ? (
        <footer className="mt-12 flex items-center justify-between gap-4 border-t border-border pt-6">
          {prev ? (
            <Link
              href={`/hr/guide/${prev.slug}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
            >
              <ArrowRight className="h-4 w-4" />
              السابق: {prev.title}
            </Link>
          ) : <span />}
          {next ? (
            <Link
              href={`/hr/guide/${next.slug}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              التالي: {next.title}
              <ArrowLeft className="h-4 w-4" />
            </Link>
          ) : null}
        </footer>
      ) : null}
    </article>
  );
}
