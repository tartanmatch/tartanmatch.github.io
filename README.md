# TartanMatch Project Website

Static project website for **TartanMatch: Towards Universal Dense Matching Across Modalities**, with a visual style inspired by the MAC-I² project page. The site uses figures and animations from the paper and presentation slides, with no third-party runtime dependencies.

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

- A title background with eight same-modal and cross-modal matching examples, labeled source and target inputs, and both warp directions. The full abstract follows the title section.
- A 5 × 5 modality matrix with larger selection cells, matching colors for modality labels and markers, and animations for all 25 ordered pairs.
- Real-world DSERT-RoLL comparisons across six pairs, showing MINIMA, MatchAnything, and TartanMatch with synchronized replay.
- An expandable architecture figure, modality representations, two-stage training, and the training data mixture.
- Cross-modal, same-modal, and relative-pose charts with exact values and baseline tables.
- Summary metrics with labels above the values, an enlarged runtime comparison, and a copyable BibTeX citation.
- Dark and light themes, responsive layouts, keyboard navigation, and reduced-motion support.

## Project files

- `index.html`: page structure and paper content.
- `styles.css`: styling, themes, and responsive layouts.
- `app.js`: video selection, interactive charts, and citation copying.
- `assets/`: extracted and compressed media, fonts, and the paper PDF, ready for deployment (approximately 39 MB).
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
5. DM Sans and Space Grotesk are hosted locally, so previewing the site does not require requests to Google Fonts. Their license files are included in `assets/licenses/`.

The 61.9% and 49.6% reductions are reported in the paper's abstract. Charts select the strongest dense baseline separately for each evaluation setting and retain settings where TartanMatch is not the best-performing method. Runtime values of 27.8, 27.6, 206.4, and 262.4 ms come from Table II; the displayed speedup over MatchAnything is 7.4×. Transfer examples illustrate qualitative behavior without making quantitative performance claims.

The supplied PDF contains submission-template placeholders. The website does not assign an unconfirmed venue, DOI, arXiv identifier, or code repository. BibTeX uses a manuscript entry that can be updated with the final publication details.

Asset extraction requires Python 3.11 and `Pillow`, `pymupdf`, and `imageio-ffmpeg`. The extraction scripts are provided for reference and regeneration from the original source files; normal preview and build operations only require Node.js.

## Warp directions and interpretation

- The full paper abstract precedes the interactive 25-pair and real-world demonstrations.
- The 25-pair and real-world videos preserve all three original panels: a fixed source on the left, a changing target in the middle, and the source warped into the current target view on the right. Captions direct viewers to compare panel 3 with panel 2.
- On slide 82 of `tartanmatch_pre_final (4) (1).pptx`, retinal inputs are `image98` and `image99`; `image101` is target → source, and `image100` is source → target. Satellite inputs are `image102` and `image103`; `image104` is target → source, and `image105` is source → target. These supplementary assets are retained in `assets/` but are not displayed on the current page.
- Animations of fixed image pairs transition from the original image to the predicted alignment; they are distinct from videos with a changing target view. Title-background posters show the final alignment for the static fallback and reduced-motion mode.
- The header and footer use the TartanMatch wordmark.

## Title background video

The background uses eight matching groups from slides 1, 81, and 82 of `tartanmatch_talk_finalized.pptx` in a continuous grid.

- Same-modal pairs: Depth/Depth and sparse Depth/Depth.
- Cross-modal pairs: RGB/Depth, RGB/Thermal, Depth/RGB, RGB/Event, LiDAR/RGB, and sparse RGB/Depth.
- Each group shows source and target inputs above target → source and source → target warps. The Depth/RGB group from slide 81 is reordered to follow this convention.
- Desktop video: 1920 × 960, arranged in four columns and two rows. Mobile video: 900 × 1800, arranged in two columns and four rows. Both loop silently for 12 seconds.
- `scripts/prepare_hero_video.py` reads the finalized presentation and generates the videos and final-alignment posters. `assets/hero-media-sources.json` records the mapping between each group and the original slide media.
- Author names use 18 px text on desktop and 14 px on mobile. The affiliation appears below the contribution notes, at 18 px on desktop and 16 px on mobile.
- Background playback pauses automatically offscreen and uses a static poster for reduced-motion preferences. Demo videos retain their native playback controls.
