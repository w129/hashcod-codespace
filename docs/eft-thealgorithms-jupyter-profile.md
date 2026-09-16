# EFT Algorithm Profile — TheAlgorithms/Jupyter reference

The Hashcod EFT editor keeps its own format (`HASHCOD-EFT-1`) and CoffeeScript-only source policy, but its algorithm workflow is informed by the contribution model documented by `TheAlgorithms/Jupyter`.

Reference repository: https://github.com/TheAlgorithms/Jupyter

## Source concepts used

The upstream project asks new algorithms to include:

- source code with comments and readable naming;
- mathematical explanation;
- a Jupyter demo notebook showing how the algorithm is applied.

EFT adapts those ideas to one CoffeeScript + IPYNB document rather than copying upstream Python notebooks or algorithms.

## EFT mapping

`THEALGORITHMS-JUPYTER-1` maps the workflow into three CoffeeScript code-cell roles:

1. `definition` — algorithm name, purpose, input/output, and math/formula explanation in CoffeeScript comments;
2. `implementation` — commented CoffeeScript implementation with readable identifiers;
3. `demo` — CoffeeScript example showing how the algorithm is used.

The downloaded `.eft` remains Jupyter Notebook `nbformat` 4.5 JSON and stores the profile under `metadata.hashcod.algorithm_profile`.

The editor performs a lightweight structural check for four items: comments, readable naming, math explanation, and demo. This check does not execute, compile, or evaluate CoffeeScript.

## Attribution and license

`TheAlgorithms/Jupyter` is MIT licensed. This integration uses its documented contribution pattern as a design reference; no upstream algorithm implementation is vendored into EFT.
