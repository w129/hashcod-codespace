# Recommendation card beneath Files

`center-empty-state-build/RecommendationCard.jsx` renders the supplied Beautiful UI example beneath the uploaded Files tree, independently of file loading or an empty vault. Its scoped atoms and styles are bundled into the existing center workspace assets; no remote stylesheet or new dependency is required.

- Alternatives expands a separate animated drawer. Choosing a row promotes that option and clears the accepted state.
- The primary action marks the current option Accepted. Repeated acceptance is disabled until another option is selected.
- The supplied restock copy is retained pending the owner's next content instructions. These interactions are local UI state, not external orders, payments, file authorization, or shared records.
- Optional `options`, `labels`, and `onAccept(option)` props provide the extension point for future product behavior. An empty options list renders nothing; selection is keyed so replacing/reordering options does not select a different option by index.
- Collapsed alternatives are inert and hidden from assistive technology. Acceptance has a live status. Reduced motion skips animation; narrow layouts wrap actions and use 44px touch targets.

Root runtime source is shared by hosted and Windows builds. Both rebuild `center-empty-state-build`; the cache identifier is `20261006-recommendation-card1`. Existing explorer integration tests exercise selection/acceptance on hosted and loopback origins, while Chromium verifies placement and width at 320px and 1440px and produces screenshots.
