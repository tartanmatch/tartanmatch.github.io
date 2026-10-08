# TartanMatch Project Page

Source for https://tartanmatch.github.io/, the project page of
**TartanMatch: Towards Universal Dense Correspondence Across Modalities**.

Code: https://github.com/castacks/tartanmatch · Weights: https://huggingface.co/theairlabcmu/TartanMatch

## Local preview

Requires Node.js 18 or later; there are no npm dependencies.

```bash
npm run dev    # http://localhost:3000
```

## Deploy

GitHub Pages serves the `gh-pages` branch. Run `npm run build`, copy the contents of `dist/` into a checkout
of `gh-pages` (keep `.nojekyll`), then commit and push that branch.
