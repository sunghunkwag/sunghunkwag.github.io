# Intelligence Research Project

English-language website for [Intelligence Research Project independent AI research](https://sunghunkwag.github.io/), intended for a worldwide audience.

- [Homepage](https://sunghunkwag.github.io/): project introduction, project evidence, retractions, and research support.
- [Research areas](https://sunghunkwag.github.io/research/): recursive self-improvement, neural architecture search, attention-free sequence models, and validation-gated program synthesis.

## Development

Static HTML and CSS with an optional, dependency-free motion script. No build step, external font request, or package installation is required. Serve the repository root using any static HTTP server. Internal URLs are root-relative, as required for this GitHub Pages user site. Shared styles are in assets/site.css.

Preserve evidence links and scope limitations when updating results. A synthetic benchmark result must not be presented as general language-model superiority. The failure log is part of the research record.

## Search setup

All indexable pages have a unique English title and description, an absolute canonical URL, Open Graph / Twitter metadata, and linked WebSite, WebPage, and ResearchProject JSON-LD. The existing Google verification token is preserved. robots.txt allows crawling and advertises sitemap.xml. The custom 404 is noindex.

No regional targeting or Korean-language page is configured. English content is available globally. Google does not use the keywords meta tag for ranking, so keyword stuffing is deliberately avoided.

### After deployment: Search Console

1. Open the verified URL-prefix property for https://sunghunkwag.github.io/ in Google Search Console. A verification meta tag alone does not prove the signed-in account owns the property.
2. Submit sitemap.xml through the Sitemaps screen.
3. Use URL Inspection on / and /research/, run a live test, then request indexing if available.
4. Review indexing and search performance over time. Compare relevant English queries such as recursive self-improvement research, attention-free sequence models, and validation-gated program synthesis.

Search Console submission requires the owner's Google session; it is not performed by a repository commit. Crawling, indexing, ranking, and rich-result display are controlled by Google. No immediate indexing or first-place ranking is guaranteed.

Update sitemap lastmod only when a page's substantive content changes. Add new canonical pages to the sitemap as they are published. Keep structured data aligned with visible content; do not add invented affiliations, publications, awards, or ratings.

References: [Google SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

## Research notes and regression checks

The [attention-free sequence model note](https://sunghunkwag.github.io/research/attention-free-sequence-model/) includes a task-level results table, downloadable CSV, pinned source links, a reproducibility guide, and explicit interpretation limits. These are reported project results, not a new independent benchmark run.

Run `node --test tests/*.test.mjs` with Node.js 22 or later. A read-only GitHub Actions workflow checks page metadata, internal links and fragments, sitemap coverage, structured-data references, content visibility, and motion lifecycle behavior on each pull request and push. These checks prevent technical regressions; they do not measure ranking or prove Google indexing.

Before adding a research note, include primary evidence and clearly distinguish a reported result, a calculation, and a planned experiment. Update the sitemap and link the note from an existing page. Use meaningful titles for readers; do not create near-duplicate pages for keyword variants.

## Project identity

Use **Intelligence Research Project** as the public identity and homepage heading. Do not introduce the owner’s personal name into visible copy, page titles, social metadata, or structured data. Keep the existing repository and contact destinations. The visual system uses dark forest charcoal, warm ivory, restrained brass accents, editorial serif headings, and a code-native research-loop illustration.

## Motion

The hero renders a high-resolution sculptural knot and orbital ring using WebGL, procedural jade/champagne materials, studio lighting, specular reflections, and tone mapping. It is conceptual artwork, not research data. Geometry is uploaded once; fine pointers adjust the view with eased movement. A visible control pauses and resumes it, reduced-motion preferences start it paused, and offscreen or background tabs suspend rendering. A 2D projected torus and the original SVG provide fallbacks; WebGL context restoration rebuilds GPU resources. Research text remains visible if JavaScript fails. Intersection-triggered entrances use the Web Animations API without hidden-content classes; section navigation uses native smooth scrolling.

## Citable research library

Three notes connect architecture-search results, RSI-Bench methods, and matched-compute RSI results to immutable sources. BibTeX and CSL JSON cite the explanatory webpages, distinct from software authorship. CSV downloads preserve reported values and limitations.

The RSI-Bench note records one verified external bibliographic mention from Mindverse (August 23, 2026; checked September 23, 2026). It is not described as peer review, independent replication, endorsement, or a verified clickable backlink. Do not turn mentions or mirrored repository pages into invented scientific validation.
