import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: "", color: "" };
    
    let score = 0;
    
    // Longueur
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Caractères spéciaux
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    if (score <= 2) return { score, label: "Faible", color: "bg-red-500" };
    if (score <= 4) return { score, label: "Moyen", color: "bg-yellow-500" };
    return { score, label: "Fort", color: "bg-green-500" };
  };

  const strength = getPasswordStrength(password);
  
  if (!password) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Force du mot de passe</span>
        <span className={cn(
          "font-medium",
          strength.score <= 2 && "text-red-600",
          strength.score > 2 && strength.score <= 4 && "text-yellow-600",
          strength.score > 4 && "text-green-600"
        )}>
          {strength.label}
        </span>
      </div>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5, 6].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              level <= strength.score ? strength.color : "bg-muted"
            )}
          />
        ))}
      </div>
      {password.length > 0 && password.length < 8 && (
        <p className="text-xs text-red-600">
          Le mot de passe doit contenir au moins 8 caractères
        </p>
      )}
    </div>
  );
}