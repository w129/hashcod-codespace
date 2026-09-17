# Hashcod God’s Eye View — Orbitron-style satellite tracking

God’s Eye View includes an in-platform orbital tracker that renders public satellite element sets from CelesTrak without opening another browser window or starting a localhost sidecar.

## Data source

The tracker uses CelesTrak General Perturbations data in CCSDS OMM JSON format:

- Base endpoint: `https://celestrak.org/NORAD/elements/gp.php`
- Format: `FORMAT=JSON`
- Built-in groups: space stations, bright/visual, weather, GPS, Galileo, BeiDou, geosynchronous, science, amateur radio, and OneWeb.
- Search: numeric queries use `CATNR`; text searches use `NAME`.

CelesTrak asks clients not to download unchanged GP data more than once per update. Hashcod therefore keeps a two-hour browser cache for each query and falls back to stale cached data if the upstream request is temporarily unavailable.

## Visualization

`components/gods-eye-satellite-orbits.js` adds an Orbitron-style map inside the existing God’s Eye View stage. It provides:

- an equirectangular orbital map;
- current markers for the loaded satellite group;
- a one-orbit ground track for the selected object;
- name and NORAD catalog search;
- latitude and longitude of the current sub-satellite point;
- altitude, estimated orbital velocity, period, inclination, and element epoch;
- a `Focus globe` action that centers the main God’s Eye View globe on the selected satellite’s subpoint.

The feature exposes `window.HashcodSatelliteOrbits` for diagnostics and programmatic selection.

## Propagation and accuracy

The display propagator derives short-term coordinates from current OMM mean elements using Keplerian motion, secular J2 precession, Greenwich sidereal rotation, and WGS84 geodetic conversion. This is suitable for the visual tracker and coordinate readout, but it is deliberately labeled `Kepler-J2-display` and `operationalGrade: false`.

CelesTrak recommends a validated SGP4 implementation such as satellite.js for precision ephemeris work. Hashcod does not present the current visual propagator as operational-grade tracking.

## Repository references

- CelesTrak GP/OMM documentation and current element sets.
- `shashwatak/satellite-js` as the reference JavaScript SGP4/SDP4 implementation (MIT).
- SatNOGS DB as an additional public catalog/TLE reference source.
