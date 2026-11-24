import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={`relative h-9 px-2.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted ${className}`}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-label="Toggle theme"
    >
      <div className="relative flex items-center justify-center h-4 w-4">
        {isDark ? (
          <Sun className="h-4 w-4 text-primary" />
        ) : (
          <Moon className="h-4 w-4 text-foreground/80" />
        )}
      </div>
      {showLabel && (
        <span className="ml-2 text-xs font-medium">{isDark ? "Light Mode" : "Dark Mode"}</span>
      )}
    </Button>
  );
}
