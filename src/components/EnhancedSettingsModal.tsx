import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Settings,
  Palette,
  Terminal,
  Globe,
  Info,
  Keyboard,
  Moon,
  Sun,
  Monitor,
  Check
} from 'lucide-react'
import { useTerminalStore } from '../store/terminal-store'
import { useTheme } from '../contexts/ThemeContext'
import { useTranslation } from '../contexts/I18nContext'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent } from './ui/card'
import { Separator } from './ui/separator'
import { Switch } from './ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Slider } from './ui/slider'
import ThemeSelector from './ThemeSelector'
import toast from 'react-hot-toast'

interface EnhancedSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const EnhancedSettingsModal: React.FC<EnhancedSettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('general')
  const { theme, setTheme } = useTheme()
  const { t, language, setLanguage } = useTranslation()
  const { terminalTheme, setTerminalTheme, fontSize, setFontSize, fontFamily, setFontFamily } = useTerminalStore()

  const tabs = [
    { id: 'general', label: t('settings.tabs.general'), icon: Settings },
    { id: 'appearance', label: t('settings.tabs.appearance'), icon: Palette },
    { id: 'terminal', label: t('settings.tabs.terminal'), icon: Terminal },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'keyboard', label: t('settings.tabs.keyboard'), icon: Keyboard },
    { id: 'about', label: t('settings.tabs.about'), icon: Info },
  ]

  const fontFamilies = [
    'JetBrains Mono',
    'Fira Code',
    'Source Code Pro',
    'Monaco',
    'Cascadia Code',
    'IBM Plex Mono',
    'SF Mono',
    'Consolas',
    'Courier New'
  ]

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  ]

  const shortcuts = [
    { key: 'Ctrl+Shift+T', action: 'New Terminal' },
    { key: 'Ctrl+Shift+W', action: 'Close Terminal' },
    { key: 'Ctrl+Tab', action: 'Next Terminal' },
    { key: 'Ctrl+Shift+Tab', action: 'Previous Terminal' },
    { key: 'Ctrl+C', action: 'Copy' },
    { key: 'Ctrl+V', action: 'Paste' },
    { key: 'Ctrl+F', action: 'Search' },
    { key: 'Ctrl+,', action: 'Open Settings' },
    { key: 'F11', action: 'Fullscreen' },
    { key: 'Ctrl+Plus', action: 'Zoom In' },
    { key: 'Ctrl+Minus', action: 'Zoom Out' },
  ]

  const handleSave = () => {
    toast.success('Settings saved successfully!')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[500px] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-44 bg-muted/20 border-r border-border p-3">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-150",
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="p-4"
              >
                {activeTab === 'general' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">{t('settings.general.title')}</h3>
                      <Card>
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Auto-save connections</p>
                              <p className="text-sm text-muted-foreground">Save connection details automatically</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Show welcome screen</p>
                              <p className="text-sm text-muted-foreground">Display welcome screen on startup</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Enable notifications</p>
                              <p className="text-sm text-muted-foreground">Show desktop notifications</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">{t('settings.appearance.title')}</h3>
                      <Card>
                        <CardContent className="p-4 space-y-4">
                          <div>
                            <Label className="mb-2">Theme</Label>
                            <div className="flex gap-2">
                              <Button
                                variant={theme === 'light' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setTheme('light')}
                                className="flex-1"
                              >
                                <Sun className="w-4 h-4 mr-2" />
                                Light
                              </Button>
                              <Button
                                variant={theme === 'dark' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setTheme('dark')}
                                className="flex-1"
                              >
                                <Moon className="w-4 h-4 mr-2" />
                                Dark
                              </Button>
                              <Button
                                variant={theme === 'system' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setTheme('system')}
                                className="flex-1"
                              >
                                <Monitor className="w-4 h-4 mr-2" />
                                System
                              </Button>
                            </div>
                          </div>
                          <Separator />
                          <div>
                            <Label>Terminal Theme</Label>
                            <p className="text-sm text-muted-foreground mb-2">Choose terminal color scheme</p>
                            <ThemeSelector />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === 'terminal' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">{t('settings.terminal.title')}</h3>
                      <Card>
                        <CardContent className="p-4 space-y-4">
                          <div>
                            <Label>Font Family</Label>
                            <Select value={fontFamily} onValueChange={setFontFamily}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {fontFamilies.map(font => (
                                  <SelectItem key={font} value={font}>
                                    <span style={{ fontFamily: font }}>{font}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Separator />
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label>Font Size</Label>
                              <span className="text-sm text-muted-foreground">{fontSize}px</span>
                            </div>
                            <Slider
                              value={[fontSize]}
                              onValueChange={([value]) => setFontSize(value)}
                              min={10}
                              max={24}
                              step={1}
                              className="w-full"
                            />
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Copy on select</p>
                              <p className="text-sm text-muted-foreground">Auto-copy selected text</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === 'language' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Language Settings</h3>
                      <Card>
                        <CardContent className="p-4">
                          <Label>Select Language</Label>
                          <p className="text-sm text-muted-foreground mb-3">Choose your preferred language</p>
                          <div className="grid grid-cols-2 gap-2">
                            {languages.map((lang) => (
                              <button
                                key={lang.code}
                                onClick={() => {
                                  setLanguage(lang.code)
                                  toast.success(`Language changed to ${lang.name}`)
                                }}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg border transition-all",
                                  language === lang.code
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:bg-muted/50"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{lang.flag}</span>
                                  <span className="font-medium">{lang.name}</span>
                                </div>
                                {language === lang.code && (
                                  <Check className="w-4 h-4 text-primary" />
                                )}
                              </button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === 'keyboard' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">{t('settings.keyboard.title')}</h3>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground mb-3">Available keyboard shortcuts</p>
                          <div className="space-y-2">
                            {shortcuts.map((shortcut, index) => (
                              <div key={index} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50">
                                <span className="font-medium">{shortcut.action}</span>
                                <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border">
                                  {shortcut.key}
                                </kbd>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === 'about' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">{t('settings.about.title')}</h3>
                      <Card>
                        <CardContent className="p-4 space-y-4">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                              <Terminal className="w-8 h-8 text-primary-foreground" />
                            </div>
                            <h2 className="text-xl font-bold">FlyTerm SSH</h2>
                            <p className="text-sm text-muted-foreground mt-1">Version 2.0.0</p>
                          </div>
                          <Separator />
                          <div className="space-y-2 text-sm">
                            <p><strong>Built with:</strong> Electron, React, TypeScript</p>
                            <p><strong>License:</strong> MIT</p>
                            <p><strong>Author:</strong> FlyTerm Team</p>
                          </div>
                          <Separator />
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => window.open('https://github.com', '_blank')}>
                              GitHub
                            </Button>
                            <Button variant="outline" className="flex-1" onClick={() => toast.info('Check for updates...')}>
                              Check Updates
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-muted/20 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EnhancedSettingsModal