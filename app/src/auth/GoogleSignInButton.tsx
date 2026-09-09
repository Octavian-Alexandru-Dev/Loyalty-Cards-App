function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.64 12.2c0-.83-.07-1.62-.2-2.38H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v2.98h3.86c2.26-2.08 3.56-5.15 3.56-8.74Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.86-2.98c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.996 11.996 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.27 14.3a7.2 7.2 0 0 1 0-4.6V6.61H1.29a12 12 0 0 0 0 10.78l3.98-3.09Z" />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.61l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  )
}

export function GoogleSignInButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
    >
      <GoogleIcon />
      {label}
    </button>
  )
}
