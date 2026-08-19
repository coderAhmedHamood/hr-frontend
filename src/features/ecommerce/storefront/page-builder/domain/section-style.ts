export const SECTION_THEMES = ['light', 'dark', 'system'] as const;

export type SectionTheme = (typeof SECTION_THEMES)[number];

export type SectionVisibility = {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
};

/** Shown on all breakpoints when CMS / backend omits device visibility. */
export const DEFAULT_SECTION_VISIBILITY: SectionVisibility = {
  mobile: true,
  tablet: true,
  desktop: true,
};

export function withDefaultSectionVisibility<T extends { visibility?: SectionVisibility }>(
  style: T,
): T & { visibility: SectionVisibility } {
  return {
    ...style,
    visibility: {
      ...DEFAULT_SECTION_VISIBILITY,
      ...(style.visibility ?? {}),
    },
  };
}

export type SectionStyleBase<TLayout extends string = string> = {
  theme: SectionTheme;
  layout: TLayout;
  visibility: SectionVisibility;
};
