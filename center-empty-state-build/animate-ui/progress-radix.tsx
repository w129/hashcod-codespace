'use client';

import * as React from 'react';

import {
  Progress as ProgressPrimitive,
  ProgressIndicator as ProgressIndicatorPrimitive,
  type ProgressProps as ProgressPrimitiveProps,
} from './progress';
import { cn } from './utils';

type ProgressProps = ProgressPrimitiveProps;

// Mirrors the upstream styled wrapper; the matching utilities are scoped in toolbook-panel.css.
function Progress({ className, ...props }: ProgressProps) {
  return (
    <ProgressPrimitive
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
      {...props}
    >
      <ProgressIndicatorPrimitive className="h-full w-full flex-1 bg-primary rounded-full" />
    </ProgressPrimitive>
  );
}

export { Progress, type ProgressProps };
