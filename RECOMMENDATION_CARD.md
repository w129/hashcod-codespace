# Recommendation card beneath Files

`center-empty-state-build/RecommendationCard.jsx` renders the supplied Beautiful UI example beneath the uploaded Files tree, independently of file loading or an empty vault. Its scoped atoms and styles are bundled into the existing center workspace assets; no remote stylesheet or new dependency is required.

- Alternatives expands a separate animated drawer. Choosing a row promotes that option and clears the accepted state.
- The primary action marks the current option Accepted. Repeated acceptance is disabled until another option is selected.
- The supplied restock copy is retained pending the owner's next content instructions. These interactions are local UI state, not external orders, payments, file authorization, or shared records.
- Optional `options`, `labels`, and `onAccept(option)` props provide the extension point for future product behavior. An empty options list renders nothing; selection is keyed so replacing/reordering options does not select a different option by index.
- Collapsed alternatives are inert and hidden from assistive technology. Acceptance has a live status. Reduced motion skips animation; narrow layouts wrap actions and use 44px touch targets.

The recommendation is a sibling of EmptyState. On desktop it starts below the existing workspace without contributing to its vertically centered height, so adding/expanding it cannot lift the icons or Files. Its bottom spacing allows the native page scrollbar to reach the complete card above the fixed privacy footer. On phones it joins the existing normal document flow.

Root runtime source is shared by hosted and Windows builds. Both rebuild `center-empty-state-build`; the cache identifier is `20261008-access-drawer2`. Existing explorer integration tests exercise selection/acceptance on hosted and loopback origins, while Chromium verifies placement, stable desktop positioning, and native page scrolling at short viewport heights.

The review conversation uses its own `.hrc-review-card` class. Its fixed 288px height must never apply to this access card, whose height follows its content. Chromium regression coverage opens and closes Alternatives twice on mobile and desktop, checks visible option text and complete drawer bounds, and verifies that collapsing restores the compact height without blank space. Active access periods remain locked.
