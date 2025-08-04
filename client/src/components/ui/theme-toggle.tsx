import React, { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { Moon, Sun, Monitor, Check } from "lucide-react";

interface ThemeOption {
  value: Theme;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const themeOptions: ThemeOption[] = [
  {
    value: "light",
    label: "Light",
    icon: Sun,
    description: "Light theme"
  },
  {
    value: "dark", 
    label: "Dark",
    icon: Moon,
    description: "Dark theme"
  },
  {
    value: "system",
    label: "System",
    icon: Monitor,
    description: "Follow system preference"
  },
];

export const ThemeToggle = memo(function ThemeToggle() {
  const { theme, setTheme, effectiveTheme } = useTheme();

  const handleThemeChange = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, [setTheme]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="relative"
          aria-label={`Current theme: ${theme}. Click to change theme`}
        >
          <Sun 
            className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-200 dark:-rotate-90 dark:scale-0" 
            aria-hidden="true"
          />
          <Moon 
            className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-200 dark:rotate-0 dark:scale-100" 
            aria-hidden="true"
          />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = theme === option.value;
          
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleThemeChange(option.value)}
              className="cursor-pointer focus:bg-accent"
              aria-describedby={`theme-${option.value}-desc`}
            >
              <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
              <div className="flex-1">
                <span className="font-medium">{option.label}</span>
                <div 
                  id={`theme-${option.value}-desc`}
                  className="text-xs text-muted-foreground"
                >
                  {option.description}
                </div>
              </div>
              {isSelected && (
                <Check 
                  className="ml-auto h-4 w-4 text-primary" 
                  aria-label="Selected"
                />
              )}
            </DropdownMenuItem>
          );
        })}
        <div className="border-t pt-1 mt-1">
          <div className="px-2 py-1 text-xs text-muted-foreground">
            Active: {effectiveTheme === 'dark' ? 'Dark' : 'Light'}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});