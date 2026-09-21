# Intelligence Research Project

English-language website for [Sung Hun Kwag's independent AI research](https://sunghunkwag.github.io/), intended for a worldwide audience.

- [Homepage](https://sunghunkwag.github.io/): researcher introduction, project evidence, retractions, and research support.
- [Research areas](https://sunghunkwag.github.io/research/): recursive self-improvement, neural architecture search, attention-free sequence models, and validation-gated program synthesis.

## Development

Static HTML and CSS, with no build step, JavaScript dependency, external font request, or package installation required. Serve the repository root using any static HTTP server. Internal URLs are root-relative, as required for this GitHub Pages user site. Shared styles are in assets/site.css.

Preserve evidence links and scope limitations when updating results. A synthetic benchmark result must not be presented as general language-model superiority. The failure log is part of the research record.

## Search setup

Both indexable pages have a unique English title and description, an absolute canonical URL, Open Graph / Twitter metadata, and linked WebSite, WebPage, and Person JSON-LD. The existing Google verification token is preserved. robots.txt allows crawling and advertises sitemap.xml. The custom 404 is noindex.

No regional targeting or Korean-language page is configured. English content is available globally. Google does not use the keywords meta tag for ranking, so keyword stuffing is deliberately avoided.

### After deployment: Search Console

1. Open the verified URL-prefix property for https://sunghunkwag.github.io/ in Google Search Console. A verification meta tag alone does not prove the signed-in account owns the property.
2. Submit sitemap.xml through the Sitemaps screen.
3. Use URL Inspection on / and /research/, run a live test, then request indexing if available.
4. Review indexing and search performance over time. Compare relevant English queries such as recursive self-improvement research, attention-free sequence models, and validation-gated program synthesis.

Search Console submission requires the owner's Google session; it is not performed by a repository commit. Crawling, indexing, ranking, and rich-result display are controlled by Google. No immediate indexing or first-place ranking is guaranteed.

Update sitemap lastmod only when a page's substantive content changes. Add new canonical pages to the sitemap as they are published. Keep structured data aligned with visible content; do not add invented affiliations, publications, awards, or ratings.

References: [Google SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).
