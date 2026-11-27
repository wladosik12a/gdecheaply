import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";

interface InteractiveHoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
}

const InteractiveHoverButton = React.forwardRef<HTMLButtonElement, InteractiveHoverButtonProps>(
  ({ text = "Button", className, type = "button", ...props }, ref) => (
    <button ref={ref} type={type} className={cn("inline-flex interactive-hover-button", className)} {...props}>
      <span className="interactive-hover-button__text">{text}</span>
      <ArrowRight className="interactive-hover-button__arrow" size={16} aria-hidden="true" />
    </button>
  )
);
InteractiveHoverButton.displayName = "InteractiveHoverButton";
export { InteractiveHoverButton };
