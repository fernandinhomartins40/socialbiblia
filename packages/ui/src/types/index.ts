import { ReactNode } from 'react'

// Common component props
export interface BaseComponentProps {
  className?: string
  children?: ReactNode
}

// Button variants
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

// Input variants
export type InputVariant = 'default' | 'ghost'

// Badge variants
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

// Card variants
export type CardVariant = 'default' | 'outlined' | 'elevated'