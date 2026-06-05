export { BuildCtx, CSSResource, ChangeEvent, FilePath, FullSlug, GlobalConfiguration, JSResource, ProcessedContent, QuartzComponent, QuartzComponentConstructor, QuartzComponentProps, QuartzConfig, QuartzEmitterPlugin, QuartzEmitterPluginInstance, QuartzPluginData, QuartzTransformerPlugin, QuartzTransformerPluginInstance, StaticResources } from '@quartz-community/types';

/**
 * Public type surface for the content-internationalization plugin.
 */
interface ContentI18nOptions {
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
}

export type { ContentI18nOptions };
