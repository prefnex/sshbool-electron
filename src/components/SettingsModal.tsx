import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings, Palette, Type, Monitor, Sun, Moon, Monitor as MonitorIcon } from 'lucide-react'
import { useTerminalStore } from '../store/terminal-store'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Separator } from './ui/separator'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

const SettingsModal: React.FC = () => {
  const { 
    theme, 
    setTheme, 
    fontSize, 
    setFontSize, 
    fontFamily, 
    setFontFamily,
    showLineNumbers,
    toggleLineNumbers,
    showStatusBar,
    toggleStatusBar
  } = useTerminalStore()
  
  const [isOpen, setIsOpen] = useState(false)

  const fontOptions = [
    'JetBrains Mono',
    'Fira Code',
    'Source Code Pro',
    'Monaco',
    'Consolas',
    'Courier New'
  ]

  const fontSizeOptions = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="icon"
      >
        <Settings className="w-4 h-4" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="border-border/50 bg-card/95 backdrop-blur-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                        <Settings className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Settings</CardTitle>
                        <CardDescription>Customize your terminal experience</CardDescription>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClose}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Theme Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Palette className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">Theme</h3>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        variant={theme === 'light' ? 'default' : 'outline'}
                        onClick={() => setTheme('light')}
                        className="h-auto p-4 flex-col gap-2"
                      >
                        <Sun className="w-5 h-5" />
                        <span>Light</span>
                      </Button>
                      
                      <Button
                        variant={theme === 'dark' ? 'default' : 'outline'}
                        onClick={() => setTheme('dark')}
                        className="h-auto p-4 flex-col gap-2"
                      >
                        <Moon className="w-5 h-5" />
                        <span>Dark</span>
                      </Button>
                      
                      <Button
                        variant={theme === 'system' ? 'default' : 'outline'}
                        onClick={() => setTheme('system')}
                        className="h-auto p-4 flex-col gap-2"
                      >
                        <MonitorIcon className="w-5 h-5" />
                        <span>System</span>
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Typography Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Type className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">Typography</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fontFamily">Font Family</Label>
                        <Select value={fontFamily} onValueChange={setFontFamily}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select font family" />
                          </SelectTrigger>
                          <SelectContent>
                            {fontOptions.map((font) => (
                              <SelectItem key={font} value={font}>
                                <span style={{ fontFamily: font }}>{font}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="fontSize">Font Size</Label>
                        <Select value={fontSize.toString()} onValueChange={(value) => setFontSize(Number(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select font size" />
                          </SelectTrigger>
                          <SelectContent>
                            {fontSizeOptions.map((size) => (
                              <SelectItem key={size} value={size.toString()}>
                                {size}px
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Interface Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">Interface</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Show Line Numbers</Label>
                          <p className="text-sm text-muted-foreground">Display line numbers in the terminal</p>
                        </div>
                        <Switch
                          checked={showLineNumbers}
                          onCheckedChange={toggleLineNumbers}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Show Status Bar</Label>
                          <p className="text-sm text-muted-foreground">Display status information at the bottom</p>
                        </div>
                        <Switch
                          checked={showStatusBar}
                          onCheckedChange={toggleStatusBar}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Preview */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Preview</h3>
                    
                    <Card className="bg-muted/30 border-border/50">
                      <CardContent className="p-4">
                        <div 
                          className="font-mono text-sm leading-relaxed"
                          style={{ 
                            fontFamily: fontFamily,
                            fontSize: `${fontSize}px`
                          }}
                        >
                          <div className="text-muted-foreground"># Terminal Preview</div>
                          <div className="text-foreground">$ echo "Hello, FlyTerm!"</div>
                          <div className="text-green-500">Hello, FlyTerm!</div>
                          <div className="text-foreground">$ ls -la</div>
                          <div className="text-blue-500">drwxr-xr-x  2 user  staff   68 Dec 20 10:30 .</div>
                          <div className="text-blue-500">drwxr-xr-x  3 user  staff  102 Dec 20 10:30 ..</div>
                          <div className="text-foreground">$ <span className="animate-pulse">█</span></div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button onClick={handleClose}>
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default SettingsModal
