/**
 * Public type surface for the content-internationalization plugin.
 */

export interface ContentI18nOptions {
  /**
   * BCP-47 locale codes for which to maintain translations. The site's
   * `configuration.locale` is always added implicitly as the default locale.
   * Accepts both `de-DE` and `de_DE` forms; normalized to dashed form.
   */
  locales: string[];

  /**
   * Locales (BCP-47) that read right-to-left. Pages whose locale matches will
   * render with `dir="rtl"` and a swapped sidebar layout.
   */
  rtlLocales: string[];

  /**
   * When `true`, translations not yet present for the current page are removed
   * from the switcher. When `false` (default), they are shown but disabled.
   */
  hideUnavailableLocales: boolean;

  /** Layout position for the switcher component. */
  position: "left" | "right" | "header" | "beforeBody";

  /** Layout priority within the chosen position. */
  priority: number;

  /** Optional layout group (e.g. `"toolbar"`). */
  group?: string;
}

export type {
  BuildCtx,
  ChangeEvent,
  CSSResource,
  JSResource,
  ProcessedContent,
  QuartzEmitterPlugin,
  QuartzEmitterPluginInstance,
  QuartzTransformerPlugin,
  QuartzTransformerPluginInstance,
  StaticResources,
  QuartzPluginData,
  QuartzComponent,
  QuartzComponentProps,
  QuartzComponentConstructor,
  FullSlug,
  FilePath,
  GlobalConfiguration,
  QuartzConfig,
} from "@quartz-community/types";
