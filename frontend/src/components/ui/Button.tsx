import { forwardRef, ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  secondary: 'border border-ink text-ink hover:bg-ink hover:text-white',
  danger: 'border border-red-700 text-red-700 hover:bg-red-700 hover:text-white',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className = '', ...props }, ref) => (
    <button
      ref={ref}
      className={`${variantClasses[variant]} px-4 py-2 rounded-none font-semibold transition-colors no-underline ${className}`}
      {...props}
    />
  ),
);

Button.displayName = 'Button';
export default Button;
