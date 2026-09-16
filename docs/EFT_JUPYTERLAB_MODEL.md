# EFT notebook model and JupyterLab reference

The Hashcod EFT editor keeps **CoffeeScript as its only source language** and stores it in a **Jupyter Notebook / nbformat 4.5 style document**.

The model behavior is informed by JupyterLab at commit `5ad633d6747371452c2f5fe465d18a70b8f3195d`, especially:

- `packages/notebook/src/model.ts`: notebook model lifecycle, JSON serialization/deserialization, dirty state, metadata normalization, and the guarantee that a notebook has at least one cell.
- `packages/nbformat/src/index.ts`: nbformat 4 notebook/cell structure, `source` as a multiline string, code-cell `execution_count`/`outputs`, and the note that nbformat 4.5 requires cell IDs.
- `packages/notebook/src/actions.tsx`: structured cell insert/move/delete operations through a notebook model rather than treating the document as one undifferentiated text blob.

Hashcod does **not** bundle JupyterLab or execute notebook kernels. The EFT implementation uses these public model concepts to maintain its own browser-side model and always exports `HASHCOD-EFT-1` files with CoffeeScript code cells, `execution_count: null`, empty outputs, stable cell IDs, and execution disabled.

JupyterLab is distributed under the Modified BSD License. This integration is an independent implementation of the model concepts rather than a copy of the JupyterLab source files.
