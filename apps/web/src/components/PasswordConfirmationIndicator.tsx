import { Check, X } from "lucide-react";

interface PasswordConfirmationIndicatorProps {
  password: string;
  confirmPassword: string;
  showFeedback?: boolean;
}

export function PasswordConfirmationIndicator({ 
  password, 
  confirmPassword, 
  showFeedback = true 
}: PasswordConfirmationIndicatorProps) {
  if (!confirmPassword || !showFeedback) return null;

  const isMatching = password === confirmPassword;
  const hasValue = confirmPassword.length > 0;

  return (
    <div className={`flex items-center gap-2 text-sm transition-colors ${
      hasValue ? (isMatching ? 'text-green-600' : 'text-red-600') : 'text-gray-500'
    }`}>
      {hasValue && (
        <>
          {isMatching ? (
            <Check className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
          <span>
            {isMatching ? 'As senhas conferem' : 'As senhas não conferem'}
          </span>
        </>
      )}
    </div>
  );
}