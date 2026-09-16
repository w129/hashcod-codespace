# Hashcod EFT Format

`EFT` is a custom Hashcod file format that combines CoffeeScript source with a Jupyter Notebook-style container.

## Identity

- Extension: `.eft`
- Format id: `HASHCOD-EFT-1`
- Container model: Jupyter Notebook / `nbformat` 4-style JSON
- Source language: CoffeeScript
- Execution: not performed by the Hashcod editor

## Minimal structure

```json
{
  "eft_format": "HASHCOD-EFT-1",
  "nbformat": 4,
  "nbformat_minor": 5,
  "metadata": {
    "language_info": {
      "name": "coffeescript",
      "file_extension": ".coffee"
    },
    "hashcod": {
      "format": "EFT",
      "source_language": "CoffeeScript",
      "container": "Jupyter Notebook"
    }
  },
  "cells": [
    {
      "cell_type": "code",
      "execution_count": null,
      "metadata": {
        "language": "coffeescript",
        "eft_source": true
      },
      "outputs": [],
      "source": "square = (x) -> x * x"
    }
  ]
}
```

The `.eft` extension is a Hashcod convention. Jupyter does not natively register `.eft`; the file uses a notebook-compatible JSON structure while preserving CoffeeScript source and Hashcod metadata.
