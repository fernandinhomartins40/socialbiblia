import { Check, X } from "lucide-react";
import { useMemo } from "react";

interface PasswordCriteria {
  label: string;
  test: (password: string) => boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
  showCriteria?: boolean;
}

const passwordCriteria: PasswordCriteria[] = [
  {
    label: "Pelo menos 8 caracteres",
    test: (password) => password.length >= 8,
  },
  {
    label: "Uma letra maiúscula",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: "Uma letra minúscula",
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: "Um número",
    test: (password) => /\d/.test(password),
  },
  {
    label: "Um caractere especial (@$!%*?&)",
    test: (password) => /[@$!%*?&]/.test(password),
  },
];

export function PasswordStrengthIndicator({ 
  password, 
  showCriteria = true 
}: PasswordStrengthIndicatorProps) {
  const { strength, score, validCriteria } = useMemo(() => {
    const validCriteria = passwordCriteria.map(criteria => ({
      ...criteria,
      isValid: criteria.test(password),
    }));

    const score = validCriteria.filter(c => c.isValid).length;
    
    let strength: "weak" | "fair" | "good" | "strong" = "weak";
    if (score >= 5) strength = "strong";
    else if (score >= 4) strength = "good";
    else if (score >= 2) strength = "fair";

    return { strength, score, validCriteria };
  }, [password]);

  const strengthColors = {
    weak: "bg-red-500",
    fair: "bg-yellow-500", 
    good: "bg-blue-500",
    strong: "bg-green-500",
  };

  const strengthLabels = {
    weak: "Fraca",
    fair: "Regular",
    good: "Boa",
    strong: "Forte",
  };

  if (!password) return null;

  return (
    <div className="space-y-3">
      {/* Barra de força */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            Força da senha:
          </span>
          <span className={`text-sm font-semibold ${
            strength === 'strong' ? 'text-green-600' :
            strength === 'good' ? 'text-blue-600' :
            strength === 'fair' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {strengthLabels[strength]}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${strengthColors[strength]}`}
            style={{ width: `${(score / passwordCriteria.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Critérios detalhados */}
      {showCriteria && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">
            Requisitos da senha:
          </span>
          <div className="grid gap-1">
            {validCriteria.map((criteria, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 text-sm transition-colors ${
                  criteria.isValid ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                {criteria.isValid ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                <span>{criteria.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}