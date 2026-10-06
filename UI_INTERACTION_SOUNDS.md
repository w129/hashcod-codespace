# Interaction sounds

`components/ui-interaction-sounds.js` recreates the native Web Audio timbres
used by [Beautiful UI](https://www.beautifului.dev/): press, tick, release,
page and pulse. The synthesis parameters match its interaction sound presets,
including the 0.32 master volume. The implementation is independent; it does
not import Beautiful UI's JavaScript engine or request external audio assets.

The canonical entry (`mldsa-access.php`) and shared HTML renderer (`l8-html.php`)
load the same versioned module. Desktop packaging includes this tracked source
through the existing parity check. A single capture-phase click listener covers
buttons, links, form controls and accessible interactive roles, including React
dialogs added after page load. Native mouse, keyboard and touch clicks produce
one sound each. Audio initializes only after a trusted interaction; disabled,
inert and programmatically clicked controls are silent. Audio failures never
cancel an action and emit one browser debug message.

Controls can select `data-sound="press|tick|release|page|pulse"`, and a
`data-sound-silent` ancestor opts out. Otherwise control semantics and English
or Spanish action labels choose the preset. `HashcodUiSounds.setEnabled(false)`
immediately mutes feedback and persists the preference in `hashcod:ui-sounds`;
`setEnabled(true)` restores it. Storage restrictions leave session muting usable.

Verification:

- `tests/e2e/test_ui_interaction_sounds.js`: timbre parameters, node cleanup,
  delegation, disabled/inert controls, mute, initialization and audio fallback.
- `tests/e2e/test_ui_interaction_sounds_browser.js`: actual Chromium audio samples,
  mouse, phone, Enter/Space, dynamic buttons, duplicate loading and loopback URLs.

The universal workflow runs both checks; Windows release runs the synthesis and
delegation regression before packaging the installer.
