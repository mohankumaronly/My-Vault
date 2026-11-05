export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  hint: string;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: "Empty", color: "bg-slate-200", hint: "Enter a master key" };
  }

  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
  const colors = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];
  const hints = [
    "Use at least 12 characters",
    "Add more length and variety",
    "Mix uppercase, numbers and symbols",
    "Good — even longer is safer",
    "Excellent master key",
  ];

  return {
    score: clamped,
    label: labels[clamped]!,
    color: colors[clamped]!,
    hint: hints[clamped]!,
  };
}
