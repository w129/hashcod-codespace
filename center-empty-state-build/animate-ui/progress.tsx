'use client';

import * as React from 'react';
import { Progress as ProgressPrimitive } from 'radix-ui';
import { motion, type HTMLMotionProps } from 'motion/react';

import { getStrictContext } from './get-strict-context';

type ProgressContextType = {
  value: number;
};

const [ProgressProvider, useProgress] =
  getStrictContext<ProgressContextType>('ProgressContext');

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root>;

function Progress(props: ProgressProps) {
  const { value } = props;

  return (
    <ProgressProvider value={{ value: value ?? 0 }}>
      <ProgressPrimitive.Root data-slot="progress" {...props} />
    </ProgressProvider>
  );
}

type ProgressIndicatorProps = Omit<
  React.ComponentProps<typeof ProgressPrimitive.Indicator>,
  'asChild'
> &
  HTMLMotionProps<'div'>;

function ProgressIndicator({
  transition = { type: 'spring', stiffness: 100, damping: 30 },
  ...props
}: ProgressIndicatorProps) {
  const { value } = useProgress();

  return (
    <ProgressPrimitive.Indicator data-slot="progress-indicator" asChild>
      <motion.div
        animate={{ x: `-${100 - (value || 0)}%` }}
        transition={transition}
        {...props}
      />
    </ProgressPrimitive.Indicator>
  );
}

export {
  Progress,
  ProgressIndicator,
  useProgress,
  type ProgressProps,
  type ProgressIndicatorProps,
  type ProgressContextType,
};
