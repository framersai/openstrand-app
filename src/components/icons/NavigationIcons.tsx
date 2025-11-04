/**
 * Custom Animated Navigation Icons
 * SVG icons with hover animations for the navigation menu
 */

import { cn } from '@/lib/utils';

interface NavIconProps {
  className?: string;
  isActive?: boolean;
}

export function DashboardIcon({ className, isActive }: NavIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 transition-all duration-300", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="3"
        y="3"
        width="8"
        height="8"
        rx="1.5"
        className={cn(
          "transition-all duration-300",
          isActive ? "fill-primary" : "fill-none stroke-current stroke-2"
        )}
      />
      <rect
        x="13"
        y="3"
        width="8"
        height="8"
        rx="1.5"
        className={cn(
          "transition-all duration-300 group-hover:rotate-3 group-hover:scale-110",
          isActive ? "fill-primary" : "fill-none stroke-current stroke-2"
        )}
      />
      <rect
        x="3"
        y="13"
        width="8"
        height="8"
        rx="1.5"
        className={cn(
          "transition-all duration-300 group-hover:-rotate-3 group-hover:scale-110",
          isActive ? "fill-primary" : "fill-none stroke-current stroke-2"
        )}
      />
      <rect
        x="13"
        y="13"
        width="8"
        height="8"
        rx="1.5"
        className={cn(
          "transition-all duration-300",
          isActive ? "fill-primary" : "fill-none stroke-current stroke-2"
        )}
      />
    </svg>
  );
}

export function FeedIcon({ className, isActive }: NavIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('h-4 w-4 transition-all duration-300', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 5C12 5 19 12 19 20"
        className={cn(
          'stroke-current stroke-2 transition-all duration-300',
          isActive ? 'stroke-primary' : 'group-hover:stroke-primary/80'
        )}
      />
      <path
        d="M4 11C9 11 14 16 14 21"
        className={cn(
          'stroke-current stroke-2 transition-all duration-300',
          isActive ? 'stroke-primary' : 'group-hover:stroke-primary/80'
        )}
      />
      <circle
        cx="6"
        cy="18"
        r="2"
        className={cn(
          'transition-all duration-300',
          isActive ? 'fill-primary' : 'fill-none stroke-current stroke-2'
        )}
      />
    </svg>
  );
}

export function KnowledgeIcon({ className, isActive }: NavIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 transition-all duration-300", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="8"
        r="3"
        className={cn(
          "transition-all duration-300",
          isActive ? "fill-primary" : "fill-none stroke-current stroke-2"
        )}
      />
      <circle
        cx="6"
        cy="16"
        r="3"
        className={cn(
          "transition-all duration-300 group-hover:translate-x-[-2px]",
          isActive ? "fill-primary" : "fill-none stroke-current stroke-2"
        )}
      />
      <circle
        cx="18"
        cy="16"
        r="3"
        className={cn(
          "transition-all duration-300 group-hover:translate-x-[2px]",
          isActive ? "fill-primary" : "fill-none stroke-current stroke-2"
        )}
      />
      <path
        d="M12 11 L6 16 M12 11 L18 16"
        className={cn(
          "stroke-current stroke-2 transition-all duration-300",
          "group-hover:stroke-primary"
        )}
      />
    </svg>
  );
}

export function VisualizationsIcon({ className, isActive }: NavIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('h-4 w-4 transition-all duration-300', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 20V10"
        className={cn(
          'stroke-current stroke-2 transition-all duration-300',
          !isActive && 'group-hover:text-primary'
        )}
      />
      <path
        d="M12 20V4"
        className={cn(
          'stroke-current stroke-2 transition-all duration-300 delay-75',
          !isActive && 'group-hover:text-primary'
        )}
      />
      <path
        d="M20 20V14"
        className={cn(
          'stroke-current stroke-2 transition-all duration-300 delay-150',
          !isActive && 'group-hover:text-primary'
        )}
      />
      <path
        d="M3 20H21"
        className="stroke-current stroke-[1.5]"
      />
      <circle
        cx="4"
        cy="10"
        r="1.5"
        className={cn(
          'transition-all duration-300',
          isActive ? 'fill-current' : 'fill-none stroke-current stroke-2'
        )}
      />
      <circle
        cx="12"
        cy="4"
        r="1.5"
        className={cn(
          'transition-all duration-300 delay-75',
          isActive ? 'fill-current' : 'fill-none stroke-current stroke-2'
        )}
      />
      <circle
        cx="20"
        cy="14"
        r="1.5"
        className={cn(
          'transition-all duration-300 delay-150',
          isActive ? 'fill-current' : 'fill-none stroke-current stroke-2'
        )}
      />
    </svg>
  );
}

export function DatasetsIcon({ className, isActive }: NavIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 transition-all duration-300", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse
        cx="12"
        cy="7"
        rx="9"
        ry="3"
        className={cn(
          "transition-all duration-300",
          isActive ? "fill-primary" : "fill-none stroke-current stroke-2"
        )}
      />
      <path
        d="M3 7 L3 12 C3 14 7 16 12 16 C17 16 21 14 21 12 L21 7"
        className={cn(
          "stroke-current stroke-2 transition-all duration-300",
          "group-hover:translate-y-[1px]"
        )}
      />
      <path
        d="M3 12 L3 17 C3 19 7 21 12 21 C17 21 21 19 21 17 L21 12"
        className={cn(
          "stroke-current stroke-2 transition-all duration-300",
          "group-hover:translate-y-[2px]"
        )}
      />
    </svg>
  );
}

export function BillingIcon({ className, isActive }: NavIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 transition-all duration-300", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
        className={cn(
          "transition-all duration-300",
          isActive ? "fill-primary" : "fill-none stroke-current stroke-2"
        )}
      />
      <path
        d="M3 10 L21 10"
        className="stroke-current stroke-2"
      />
      <rect
        x="7"
        y="14"
        width="4"
        height="2"
        rx="0.5"
        className={cn(
          "transition-all duration-300 group-hover:fill-primary",
          isActive ? "fill-background" : "fill-current"
        )}
      />
      <circle
        cx="12"
        cy="12"
        r="0"
        className={cn(
          "transition-all duration-300 group-hover:r-[2]",
          "fill-primary opacity-0 group-hover:opacity-100"
        )}
      />
    </svg>
  );
}

export function ProfileIcon({ className, isActive }: NavIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 transition-all duration-300", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
        className={cn(
          "transition-all duration-300 group-hover:scale-110",
          isActive ? "fill-primary" : "fill-none stroke-current stroke-2"
        )}
      />
      <path
        d="M4 20 C4 16 8 14 12 14 C16 14 20 16 20 20"
        className={cn(
          "stroke-current stroke-2 transition-all duration-300",
          "group-hover:d-[M4_20_C4_15_8_13_12_13_C16_13_20_15_20_20]"
        )}
      />
      <circle
        cx="12"
        cy="8"
        r="0"
        className={cn(
          "transition-all duration-300 group-hover:r-[1.5]",
          "fill-background"
        )}
      />
    </svg>
  );
}

// Landing page icons
export function FeaturesIcon({ className, isActive }: NavIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 transition-all duration-300", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon
        points="12,2 22,12 12,22 2,12"
        className={cn(
          "transition-all duration-300 group-hover:rotate-45",
          isActive ? "fill-primary" : "fill-none stroke-current stroke-2"
        )}
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        className={cn(
          "transition-all duration-300 group-hover:scale-125",
          isActive ? "fill-background" : "fill-current"
        )}
      />
    </svg>
  );
}

export function PricingIcon({ className, isActive }: NavIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 transition-all duration-300", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2 L2 7 L2 17 L12 22 L22 17 L22 7 L12 2 Z"
        className={cn(
          "transition-all duration-300",
          isActive ? "fill-primary" : "fill-none stroke-current stroke-2"
        )}
      />
      <path
        d="M12 22 L12 12"
        className="stroke-current stroke-2"
      />
      <path
        d="M2 7 L12 12 L22 7"
        className="stroke-current stroke-2"
      />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        className={cn(
          "text-xs font-bold transition-all duration-300",
          isActive ? "fill-background" : "fill-current",
          "group-hover:scale-125 group-hover:translate-y-[-1px]"
        )}
        style={{ fontSize: '8px' }}
      >
        $
      </text>
    </svg>
  );
}

export function DocsIcon({ className, isActive }: NavIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 transition-all duration-300", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="2"
        className={cn(
          "transition-all duration-300",
          isActive ? "fill-primary" : "fill-none stroke-current stroke-2"
        )}
      />
      <path
        d="M8 7 L16 7"
        className={cn(
          "stroke-current stroke-2 transition-all duration-300",
          "group-hover:translate-x-[2px]",
          isActive && "stroke-background"
        )}
      />
      <path
        d="M8 11 L16 11"
        className={cn(
          "stroke-current stroke-2 transition-all duration-300",
          "group-hover:translate-x-[1px]",
          isActive && "stroke-background"
        )}
      />
      <path
        d="M8 15 L12 15"
        className={cn(
          "stroke-current stroke-2 transition-all duration-300",
          isActive && "stroke-background"
        )}
      />
    </svg>
  );
}

export function PKMSIcon({ className, isActive }: NavIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 transition-all duration-300", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3 L12 21"
        className={cn(
          "stroke-current stroke-2 transition-all duration-300",
          "group-hover:stroke-primary"
        )}
      />
      <path
        d="M5 8 L12 3 L19 8"
        className={cn(
          "stroke-current stroke-2 transition-all duration-300",
          "group-hover:translate-y-[-1px]"
        )}
      />
      <circle
        cx="5"
        cy="8"
        r="2"
        className={cn(
          "transition-all duration-300 group-hover:scale-125",
          isActive ? "fill-primary" : "fill-none stroke-current stroke-2"
        )}
      />
      <circle
        cx="19"
        cy="8"
        r="2"
        className={cn(
          "transition-all duration-300 group-hover:scale-125",
          isActive ? "fill-primary" : "fill-none stroke-current stroke-2"
        )}
      />
      <circle
        cx="12"
        cy="14"
        r="3"
        className={cn(
          "transition-all duration-300 group-hover:scale-110",
          isActive ? "fill-primary" : "fill-none stroke-current stroke-2"
        )}
      />
      <circle
        cx="6"
        cy="20"
        r="2"
        className={cn(
          "transition-all duration-300 group-hover:scale-110",
          isActive ? "fill-primary" : "fill-none stroke-current stroke-2"
        )}
      />
      <circle
        cx="18"
        cy="20"
        r="2"
        className={cn(
          "transition-all duration-300 group-hover:scale-110",
          isActive ? "fill-primary" : "fill-none stroke-current stroke-2"
        )}
      />
      <path
        d="M12 14 L6 20 M12 14 L18 20"
        className={cn(
          "stroke-current stroke-2 transition-all duration-300",
          "group-hover:stroke-primary"
        )}
      />
    </svg>
  );
}
