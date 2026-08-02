export const SECTION_THEMES = ['light', 'dark', 'system'] as const;

export type SectionTheme = (typeof SECTION_THEMES)[number];

export type SectionVisibility = {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
};

export type SectionStyleBase<TLayout extends string = string> = {
  theme: SectionTheme;
  layout: TLayout;
  visibility: SectionVisibility;
};
