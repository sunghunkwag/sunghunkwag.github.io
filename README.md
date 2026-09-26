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

The hero depicts a conceptual AI search landscape as an 8-by-8 field of translucent monochrome beveled 3D bars. Continuous wave functions animate their heights on the GPU above a graphite platform, with neutral reflections, Fresnel edge light, a faint halo, and a dark platform. It does not show measured benchmark scores. Transparent surfaces use additive blending with depth writes disabled over an opaque platform; this is a stylized glass effect, not a refraction simulation. Static geometry uploads once; height deformation corrects surface normals. Pointer movement subtly changes the viewing angle. Pause, reduced-motion preferences, offscreen suspension, and context restoration remain supported. The canvas and SVG fallbacks also depict bars. Research text remains visible if JavaScript fails. Intersection-triggered entrances use the Web Animations API without hidden-content classes; section navigation uses native smooth scrolling.

## Recursive self-improvement guide

[/research/recursive-self-improvement/](https://sunghunkwag.github.io/research/recursive-self-improvement/) is the site's main page for the query *recursive self-improvement*. It gives a plain definition, a sourced history (I. J. Good 1965 through 2026 systems), a confound-and-control checklist, and links to the project's own RSI notes. The homepage, research hub, RSI-Bench, and matched-control notes link to it with descriptive anchor text.

External results on that page are summaries of their authors' reports, each linked to the source. Recheck them when a source is revised, and keep the distinction between bounded and open-ended RSI. Do not add claims that this project has demonstrated open-ended RSI.

## Motion and interactive figures (v2)

- **Hero:** a 14 × 14 field of translucent bars, explored by a search probe with a fading six-point trail. It also has an evaluation beam that sweeps the field, rising particles at the probe, and a local lift under the pointer. It is a conceptual illustration, not measured data. The hero stays monochrome through the existing grayscale filter.
- **Site-wide motion:** headings rise out of a mask when they enter view, the homepage figures count up, and cards tilt with a soft glare on fine pointers. Buttons lean toward the cursor, and dark bands carry a faint light that follows the pointer. Pages cross-fade through CSS view transitions, the history timeline on the RSI guide draws itself as it scrolls, and the hero drifts back while the page scrolls. Everything stops under `prefers-reduced-motion` and with the pause control.
- **Figures (`assets/charts.js`):** matched-compute contrasts (lollipop plot), task-level accuracy (grouped bars), an interactive RSI-Bench calculator (six sliders, a radar and both means), the compute-matched control, and the recursive loop. Each figure reads its numbers from the page's own table and starts `hidden`, so the table remains the no-JS and print view. Tooltips work on hover and keyboard focus.
- **Palette:** chart colors are brass `#bb8733` and blue `#3b8fc7`. They pass the categorical lightness, chroma, colour-blindness separation and contrast checks on both dark surfaces.

## Support

The homepage support section leads with email, which opens a prefilled message, and keeps GitHub Sponsors as a secondary option. It sets out three concrete ways to help: fund the GPU laptop, sponsor the real-scale validation run, or reproduce, critique and cite the research. Every research page ends with a support band that links to the same email and to `/#support`, because search visitors usually land on a research note rather than on the homepage. Do not add payment methods or funding totals that have not been confirmed.

## Citable research library

Three notes connect architecture-search results, RSI-Bench methods, and matched-compute RSI results to immutable sources. BibTeX and CSL JSON cite the explanatory webpages, distinct from software authorship. CSV downloads preserve reported values and limitations.

The RSI-Bench note records one verified external bibliographic mention from Mindverse (August 23, 2026; checked September 23, 2026). It is not described as peer review, independent replication, endorsement, or a verified clickable backlink. Do not turn mentions or mirrored repository pages into invented scientific validation.
