import React from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { useTheme } from '../contexts/ThemeContext'
import { cn } from '../lib/utils'

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme, isDark } = useTheme()

  const themes = [
    {
      key: 'light' as const,
      label: 'Light Mode',
      labelAr: 'الوضع الفاتح',
      icon: Sun,
      description: 'Clean and bright interface'
    },
    {
      key: 'dark' as const,
      label: 'Dark Mode',
      labelAr: 'الوضع المظلم',
      icon: Moon,
      description: 'Easy on the eyes'
    },
    {
      key: 'system' as const,
      label: 'System',
      labelAr: 'النظام',
      icon: Monitor,
      description: 'Follows system preference'
    }
  ]

  const currentTheme = themes.find(t => t.key === theme) || themes[1]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="Change theme"
        >
          <currentTheme.icon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon
          const isSelected = theme === themeOption.key
          
          return (
            <DropdownMenuItem
              key={themeOption.key}
              onClick={() => setTheme(themeOption.key)}
              className={cn(
                "flex items-center gap-2 p-3 cursor-pointer",
                isSelected && "bg-accent"
              )}
            >
              <Icon className="w-4 h-4" />
              <div className="flex-1">
                <div className="font-medium">{themeOption.labelAr}</div>
                <div className="text-xs text-muted-foreground">
                  {themeOption.description}
                </div>
              </div>
              {isSelected && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ThemeSwitcher