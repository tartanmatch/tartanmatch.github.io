# TartanMatch Project Website

Static project website for **TartanMatch: Towards Universal Dense Correspondence Across Modalities**, with a visual style inspired by the MAC-I² project page. The site uses figures and animations from the paper and presentation slides, with no third-party runtime dependencies.

## Local preview

Requires Node.js 18 or later. No npm dependency installation is needed. The repository is public and can be cloned without signing in.

```bash
git clone https://github.com/tartanmatch/tartanmatch.github.io.git
cd tartanmatch.github.io
npm run dev
```

Open http://localhost:3000. To use another port:

```bash
npm run dev -- --port 3001
```

When working on a remote machine over SSH, forward port 3000 to your computer using SSH or your editor's port-forwarding feature, then open the local address in your browser.

## Page content

- A title block (title, authors, affiliation, paper and BibTeX links) centered over the dimmed eight-pair warping video, with a caption below explaining the tiles.
- The full paper abstract, then three short overview blocks: why cross-sensor matching matters (heavy-snow observations from four sensors), what TartanMatch predicts (a switchable source / target / warped-source example), and the key results written as full sentences.
- A 5 × 5 source/target selector for all 25 ordered pairs. Each cell is drawn as the crossing of the source (row) and target (column) colors.
- Real-world DSERT-RoLL comparisons across six pairs. The source and target are shown once, followed by the outputs of TartanMatch, MatchAnything, and MINIMA side by side. Each panel crops one third of the original three-panel video, and a shared 10 fps clock steps every video to the same frame so they stay in sync.
- An expandable architecture figure, sensor inputs, shared matcher, two-stage training, and the training data mixture.
- Results in three labeled blocks: accuracy (cross-modal, same-modal, and relative-pose charts with exact values in a table), joint training (a per-pair chart of Table VII comparing one model per pair with the jointly trained model), and speed.
- Light and dark themes (following the system setting by default), responsive layouts, keyboard navigation, and reduced-motion support.

## Design notes

- Modality colors follow the paper's teaser figure: RGB blue, event purple, thermal green, depth orange, LiDAR red. They are used only where a sensor is named.
- Body text is Source Serif 4 at 18 px; interface text, labels, and figure captions use Atkinson Hyperlegible Next at 15 px or larger. Secondary text keeps a contrast ratio above 7:1 in both themes.
- The title text sits over the background video behind a radial dark shade, with text shadows for contrast.
- Key results show each finding as its own panel with a short title, a sentence, a small chart, and a link to the details. The accuracy chart shows mean endpoint error over the tests in Tables II and V (the averages behind the 61.9% and 49.6% figures); the joint-training chart shows the Table VII averages (34.1% and 17.8%), measured on TartanAir V2 validation data.
- Section headings sit in a left column; text and figures fill the column to the right. Wide media (teaser, demos, architecture, charts) span the full width.

## Project files

- `index.html`: page structure and paper content.
- `styles.css`: styling, themes, and responsive layouts.
- `app.js`: video selection, interactive charts, and citation copying.
- `assets/`: extracted and compressed media, fonts (`assets/fonts/`), and the paper PDF, ready for deployment (approximately 39 MB).
- `scripts/serve.mjs`: local Node server with HTTP Range support for videos.
- `scripts/build.mjs`: copies the static site into `dist/`.
- `scripts/prepare_assets.py`: extracts and converts media from the original presentations and PDF; not needed for normal use.
- `scripts/prepare_hero_video.py`: generates the title background videos and posters from the finalized presentation.
- `.work/`: local extraction files, check results, and screenshots; excluded from version control and deployment.

## Build

```bash
npm run build
```

This creates a standalone `dist/` directory suitable for static hosting, including GitHub Pages. The production site is hosted on GitHub Pages at https://tartanmatch.github.io/.

The repository includes all assets required to run and build the website. Original presentations, the root-level paper copy, `.work/`, and `dist/` are excluded from version control. To regenerate assets, place the original source files in the project root.

## GitHub Pages deployment

The `gh-pages` branch contains only the built website and a `.nojekyll` file. In repository settings, enable **Pages → Deploy from a branch**, select **gh-pages**, and use the root directory (`/`). GitHub publishes updates pushed to this branch.

Live website: https://tartanmatch.github.io/.

To update the site, run `npm run build`, copy the contents of `dist/` into a checkout of `gh-pages`, preserve `.nojekyll`, then commit and push that branch.

The repository is public. GitHub Pages publishes the root of `gh-pages` over HTTPS.

## Media and data sources

1. `mmufm_paper (18).pdf`: paper title, author order, abstract, architecture (Figure 2), cross-modal results (Table II), relative-pose results (Table III), heavy-snow results (Table IV), same-modal results (Table V), and joint-training results (Table VII).
2. `Modality_pairs_demo_video_new2 (2).pptx`: the 25-pair animations on slide 9 and real-sensor comparisons on slides 11–14. Original GIFs are converted to H.264 MP4, with their top labels replaced by clear column headings on the webpage.
3. `tartanmatch_pre_final (4) (1).pptx`: author affiliation, heavy-snow sensor observations, and qualitative examples from unseen image domains.
4. `tartanmatch_talk_finalized.pptx`: the eight matching groups used in the title background, from slides 1, 81, and 82.
5. Source Serif 4 and Atkinson Hyperlegible Next are hosted locally in `assets/fonts/`, so previewing the site does not require requests to Google Fonts. DM Sans (`assets/dm-sans.ttf`) is kept only for `scripts/prepare_hero_video.py`, which draws the labels in the teaser video. License files are included in `assets/licenses/`.

The 61.9% and 49.6% reductions are reported in the paper's abstract. Charts select the strongest dense baseline separately for each evaluation setting and retain settings where TartanMatch is not the best-performing method. Runtime values of 27.8, 27.6, 206.4, and 262.4 ms come from Table II; the displayed speedup over MatchAnything is 7.4×. Transfer examples illustrate qualitative behavior without making quantitative performance claims.

The supplied PDF contains submission-template placeholders. The website does not assign an unconfirmed venue, DOI, arXiv identifier, or code repository. BibTeX uses a manuscript entry that can be updated with the final publication details.

Asset extraction requires Python 3.11 and `Pillow`, `pymupdf`, and `imageio-ffmpeg`. The extraction scripts are provided for reference and regeneration from the original source files; normal preview and build operations only require Node.js.

## Warp directions and interpretation

- The overview example uses the `intro-*` still images: source, target, and source → target (`*-to-target.webp`). The heavy-snow figure uses `snow-*.webp`.
- The 25-pair and real-world videos preserve all three original panels: a fixed source on the left, a changing target in the middle, and the source warped into the current target view on the right. Column labels sit above each panel, and the section text tells viewers to compare the right panel with the middle one.
- On slide 82 of `tartanmatch_pre_final (4) (1).pptx`, retinal inputs are `image98` and `image99`; `image101` is target → source, and `image100` is source → target. Satellite inputs are `image102` and `image103`; `image104` is target → source, and `image105` is source → target. These supplementary assets are retained in `assets/` but are not displayed on the current page.
- Animations of fixed image pairs transition from the original image to the predicted alignment; they are distinct from videos with a changing target view. Title-background posters show the final alignment for the static fallback and reduced-motion mode.
- The header and footer use the TartanMatch wordmark.

## Title background video

The title background uses eight matching groups from slides 1, 81, and 82 of `tartanmatch_talk_finalized.pptx` in a continuous grid.

- Same-modal pairs: Depth/Depth and sparse Depth/Depth.
- Cross-modal pairs: RGB/Depth, RGB/Thermal, Depth/RGB, RGB/Event, LiDAR/RGB, and sparse RGB/Depth.
- Each group shows source and target inputs above target → source and source → target warps. The Depth/RGB group from slide 81 is reordered to follow this convention.
- Desktop video: 1920 × 960, arranged in four columns and two rows. Mobile video: 900 × 1800, arranged in two columns and four rows. Both loop silently for 12 seconds.
- `scripts/prepare_hero_video.py` reads the finalized presentation and generates the videos and final-alignment posters. `assets/hero-media-sources.json` records the mapping between each group and the original slide media.
- Author names use 19 px text on desktop and 17 px on mobile. The contribution notes follow the affiliation.
- Background playback pauses automatically offscreen and uses a static poster for reduced-motion preferences. Demo videos retain their native playback controls.
