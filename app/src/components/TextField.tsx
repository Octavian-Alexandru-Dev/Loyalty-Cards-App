import { forwardRef, type InputHTMLAttributes } from 'react'
import clsx from 'clsx'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'rounded-xl border border-slate-300 px-3.5 py-2.5 text-base text-slate-900',
            'placeholder:text-slate-400',
            'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30',
            error && 'border-red-400 focus:border-red-500 focus:ring-red-500/30',
            className,
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    )
  },
)
TextField.displayName = 'TextField'
