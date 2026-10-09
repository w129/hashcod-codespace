'use client';

import * as React from 'react';

import {
  Checkbox as CheckboxPrimitive,
  CheckboxIndicator as CheckboxIndicatorPrimitive,
  type CheckboxProps as CheckboxPrimitiveProps,
} from './checkbox';
import { cn } from './utils';

type CheckboxVariant = 'default' | 'accent';
type CheckboxSize = 'default' | 'sm' | 'lg';

type CheckboxProps = CheckboxPrimitiveProps & {
  variant?: CheckboxVariant;
  size?: CheckboxSize;
};

// Mirrors the upstream cva variants; the matching utilities are scoped in policy-consent.css.
const BASE =
  'peer shrink-0 flex items-center justify-center transition-colors duration-500 focus-visible:outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50';
const VARIANTS: Record<CheckboxVariant, string> = {
  default: 'bg-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground',
  accent: 'bg-input data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground data-[state=indeterminate]:bg-accent data-[state=indeterminate]:text-accent-foreground',
};
const SIZES: Record<CheckboxSize, string> = {
  default: 'size-5 rounded-sm [&_svg]:size-3.5',
  sm: 'size-4.5 rounded-[5px] [&_svg]:size-3',
  lg: 'size-6 rounded-[7px] [&_svg]:size-4',
};

function Checkbox({
  className,
  children,
  variant = 'default',
  size = 'default',
  ...props
}: CheckboxProps) {
  return (
    <CheckboxPrimitive
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    >
      {children}
      <CheckboxIndicatorPrimitive />
    </CheckboxPrimitive>
  );
}

export { Checkbox, type CheckboxProps };
