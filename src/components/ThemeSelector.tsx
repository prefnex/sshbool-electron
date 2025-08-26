import React from 'react'
import { Palette, Check } from 'lucide-react'
import { useTerminalStore } from '../store/terminal-store'
import { terminalThemes, getThemeById } from '../lib/terminal-themes'
import { cn } from '../lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import toast from 'react-hot-toast'

const ThemeSelector: React.FC = () => {
  const { terminalTheme, setTerminalTheme } = useTerminalStore()
  const currentTheme = getThemeById(terminalTheme)

  const handleThemeSelect = (themeId: string) => {
    const theme = getThemeById(themeId)
    if (theme) {
      setTerminalTheme(themeId)
      toast.success(`🎨 Theme changed to ${theme.name}!`, {
        duration: 2000,
        style: {
          background: theme.colors.background,
          color: theme.colors.foreground,
          border: `1px solid ${theme.colors.cursor}`,
          fontSize: '12px'
        }
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Terminal Themes</CardTitle>
        </div>
        <CardDescription>
          Choose from beautiful pre-made themes for your terminal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {terminalThemes.map((theme) => {
            const isSelected = theme.id === terminalTheme
            
            return (
              <Button
                key={theme.id}
                variant="ghost"
                onClick={() => handleThemeSelect(theme.id)}
                className={cn(
                  "h-auto p-0 w-full",
                  isSelected && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <div className="w-full p-4 space-y-3 text-left">
                  {/* Theme Preview */}
                  <div 
                    className="h-16 rounded-lg p-3 relative overflow-hidden"
                    style={{ backgroundColor: theme.colors.background }}
                  >
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: theme.colors.red }}
                        />
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: theme.colors.yellow }}
                        />
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: theme.colors.green }}
                        />
                      </div>
                      <div 
                        className="text-xs font-mono"
                        style={{ color: theme.colors.foreground }}
                      >
                        $ echo "Hello FlyTerm"
                      </div>
                      <div 
                        className="text-xs font-mono"
                        style={{ color: theme.colors.green }}
                      >
                        Hello FlyTerm
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: theme.colors.cursor }}
                        >
                          <Check className="w-3 h-3" style={{ color: theme.colors.background }} />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Theme Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{theme.name}</h4>
                      {theme.id === 'flyterm-pro' && (
                        <Badge variant="default" className="text-xs">Default</Badge>
                      )}
                      {['matrix', 'dracula'].includes(theme.id) && (
                        <Badge variant="secondary" className="text-xs">Popular</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{theme.description}</p>
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
        
        {/* Current Theme Info */}
        {currentTheme && (
          <div className="mt-6 p-4 rounded-lg bg-muted/30 border">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: currentTheme.colors.cursor }}
              />
              <span className="font-medium text-sm">Current: {currentTheme.name}</span>
            </div>
            <p className="text-xs text-muted-foreground">{currentTheme.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ThemeSelector