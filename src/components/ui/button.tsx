import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-(--radius-sm) text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-indigo text-primary-foreground shadow-button-raised hover:shadow-indigo-glow hover:brightness-110 active:scale-[0.98] active:shadow-sm",
        destructive:
          "bg-signal-rose text-white shadow-sm hover:opacity-90 active:scale-[0.98]",
        outline:
          "border border-border bg-card shadow-sm hover:bg-secondary hover:border-stone-deep hover:shadow-premium active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-stone active:scale-[0.98]",
        ghost: "hover:bg-secondary active:scale-[0.98]",
        link: "text-indigo underline-offset-4 hover:underline",
        brass:
          "bg-brass text-white shadow-sm hover:bg-brass-deep active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-(--radius-sm) px-3 text-xs",
        lg: "h-12 rounded-(--radius) px-7 text-[15px]",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
