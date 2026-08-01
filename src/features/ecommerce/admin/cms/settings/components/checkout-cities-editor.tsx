'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Plus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/shared/utils';

type Props = {
  cities: string[];
  defaultCity: string;
  onChange: (next: { cities: string[]; defaultCity: string }) => void;
};

function normalizeCityName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function CheckoutCitiesEditor({ cities, defaultCity, onChange }: Props) {
  const t = useTranslations('ecommerceAdmin.settings');
  const [draftName, setDraftName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  function commit(nextCities: string[], nextDefault = defaultCity) {
    const cleaned = nextCities.map(normalizeCityName).filter(Boolean);
    const unique: string[] = [];
    for (const city of cleaned) {
      if (!unique.some((item) => item.localeCompare(city, 'ar', { sensitivity: 'base' }) === 0)) {
        unique.push(city);
      }
    }
    const resolvedDefault =
      unique.length === 0
        ? ''
        : unique.some((city) => city === nextDefault)
          ? nextDefault
          : unique[0]!;
    onChange({ cities: unique, defaultCity: resolvedDefault });
  }

  function addCity() {
    const name = normalizeCityName(draftName);
    if (!name) {
      setError(t('citiesAddRequired'));
      return;
    }
    if (cities.some((city) => city.localeCompare(name, 'ar', { sensitivity: 'base' }) === 0)) {
      setError(t('citiesDuplicate'));
      return;
    }
    setError(null);
    setDraftName('');
    commit([...cities, name], defaultCity || name);
  }

  function removeCity(city: string) {
    commit(
      cities.filter((item) => item !== city),
      defaultCity === city ? '' : defaultCity,
    );
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="space-y-1">
        <Label className="text-sm font-medium text-foreground">{t('cities')}</Label>
        <p className="text-xs text-muted-foreground">{t('citiesHint')}</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={draftName}
          onChange={(event) => {
            setDraftName(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addCity();
            }
          }}
          placeholder={t('citiesAddPlaceholder')}
          className="h-11 rounded-xl"
          aria-invalid={Boolean(error)}
        />
        <Button type="button" className="h-11 shrink-0 gap-1.5 rounded-xl px-4" onClick={addCity}>
          <Plus className="h-4 w-4" />
          {t('citiesAdd')}
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {cities.length === 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
            <MapPin className="h-4 w-4" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-foreground">{t('citiesEmptyTitle')}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{t('citiesEmptyHint')}</p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70">
          {cities.map((city) => {
            const isDefault = city === defaultCity;
            return (
              <li
                key={city}
                className="flex items-center gap-3 bg-card px-3 py-2.5 sm:px-4"
              >
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 text-sm font-medium text-foreground">{city}</span>
                <Button
                  type="button"
                  variant={isDefault ? 'secondary' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-8 shrink-0 gap-1 rounded-full px-2.5 text-xs',
                    isDefault && 'border-primary/30 bg-primary/10 text-primary',
                  )}
                  onClick={() => commit(cities, city)}
                  disabled={isDefault}
                >
                  <Star className={cn('h-3.5 w-3.5', isDefault && 'fill-current')} />
                  {isDefault ? t('citiesDefaultBadge') : t('citiesSetDefault')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeCity(city)}
                  aria-label={t('citiesRemove')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {cities.length > 0 && defaultCity ? (
        <p className="text-[11px] text-muted-foreground">
          {t('citiesDefaultHint', { city: defaultCity })}
        </p>
      ) : null}
    </div>
  );
}
