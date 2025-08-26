import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Settings,
  Palette,
  Type,
  Monitor,
  Sun,
  Moon,
  Terminal,
  Eye,
  Shield,
  Globe,
  Zap,
  Code,
  FileText,
  Key,
  Download,
  Upload,
  RefreshCw,
  Bell,
  Volume2,
  VolumeX,
  Save,
  RotateCcw
} from 'lucide-react'
import { useTerminalStore } from '../store/terminal-store'
import { useTheme } from '../contexts/ThemeContext'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Separator } from './ui/separator'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import ThemeSelector from './ThemeSelector'
import ThemeSwitcher from './ThemeSwitcher'
import toast from 'react-hot-toast'

interface EnhancedSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const EnhancedSettingsModal: React.FC<EnhancedSettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    terminalTheme,
    setTerminalTheme,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily
  } = useTerminalStore()

  const { theme, setTheme } = useTheme()

  // Local settings state
  const [settings, setSettings] = useState({
    // Appearance
    showLineNumbers: true,
    showStatusBar: true,
    showSidebar: true,
    transparentBackground: false,
    
    // Terminal
    cursorStyle: 'block' as 'block' | 'underline' | 'bar',
    cursorBlink: true,
    wordWrap: true,
    copyOnSelect: true,
    pasteOnRightClick: true,
    
    // Audio
    bellSound: true,
    bellVolume: 50,
    
    // Performance
    maxScrollback: 5000,
    refreshRate: 60,
    
    // Security
    confirmClose: true,
    savePasswords: false,
    autoLock: false,
    lockTimeout: 30,
    
    // Advanced
    experimentalFeatures: false,
    debugMode: false,
    telemetry: true
  })

  const fontOptions = [
    'JetBrains Mono',
    'Fira Code',
    'Source Code Pro',
    'Monaco',
    'Consolas',
    'Courier New',
    'Ubuntu Mono',
    'Roboto Mono'
  ]

  const fontSizeOptions = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24]

  const cursorStyles = [
    { value: 'block', label: 'Block', icon: '▌' },
    { value: 'underline', label: 'Underline', icon: '_' },
    { value: 'bar', label: 'Bar', icon: '|' }
  ]

  const handleSettingChange = useCallback((key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = () => {
    // Save settings
    localStorage.setItem('flyterm-settings', JSON.stringify(settings))
    toast.success('✅ تم حفظ الإعدادات بنجاح')
  }

  const handleReset = () => {
    // Reset to defaults
    setSettings({
      showLineNumbers: true,
      showStatusBar: true,
      showSidebar: true,
      transparentBackground: false,
      cursorStyle: 'block',
      cursorBlink: true,
      wordWrap: true,
      copyOnSelect: true,
      pasteOnRightClick: true,
      bellSound: true,
      bellVolume: 50,
      maxScrollback: 5000,
      refreshRate: 60,
      confirmClose: true,
      savePasswords: false,
      autoLock: false,
      lockTimeout: 30,
      experimentalFeatures: false,
      debugMode: false,
      telemetry: true
    })
    
    toast.success('🔄 تم إعادة تعيين الإعدادات')
  }

  const exportSettings = () => {
    const data = {
      settings,
      theme,
      terminalTheme,
      fontSize,
      fontFamily
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flyterm-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('📥 تم تصدير الإعدادات')
  }

  const importSettings = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          if (data.settings) setSettings(data.settings)
          if (data.theme) setTheme(data.theme)
          if (data.terminalTheme) setTerminalTheme(data.terminalTheme)
          if (data.fontSize) setFontSize(data.fontSize)
          if (data.fontFamily) setFontFamily(data.fontFamily)
          
          toast.success('📤 تم استيراد الإعدادات بنجاح')
        } catch (error) {
          toast.error('❌ فشل في استيراد الإعدادات')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.98, opacity: 0 }}
          transition={{ 
            duration: 0.15,
            ease: [0.25, 0.8, 0.25, 1]
          }}
          className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-border/50 bg-card/95 backdrop-blur-md h-full flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                    <Settings className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">إعدادات FlyTerm</CardTitle>
                    <CardDescription>تخصيص تجربة Terminal الخاصة بك</CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={exportSettings}>
                    <Download className="w-4 h-4 mr-1" />
                    تصدير
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={importSettings}>
                    <Upload className="w-4 h-4 mr-1" />
                    استيراد
                  </Button>
                  
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden">
              <Tabs defaultValue="appearance" className="h-full flex flex-col" onValueChange={(value) => console.log('Tab changed to:', value)}>
                <TabsList className="grid w-full grid-cols-6 p-1 bg-muted/30">
                  <TabsTrigger value="appearance" className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    المظهر
                  </TabsTrigger>
                  <TabsTrigger value="terminal" className="flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Terminal
                  </TabsTrigger>
                  <TabsTrigger value="language" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    اللغة
                  </TabsTrigger>
                  <TabsTrigger value="audio" className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    الصوت
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    الأمان
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    متقدم
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto mt-4 scroll-smooth">
                  {/* Appearance Tab */}
                  <TabsContent value="appearance" className="space-y-6 mt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">نظام الألوان</h3>
                          <p className="text-sm text-muted-foreground">اختر نظام الألوان المفضل</p>
                        </div>
                        <ThemeSwitcher />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h4 className="font-medium">ثيم Terminal</h4>
                        <ThemeSelector />
                      </div>
                      
                      <Separator />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>خط Terminal</Label>
                          <Select value={fontFamily} onValueChange={setFontFamily}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fontOptions.map(font => (
                                <SelectItem key={font} value={font}>
                                  <span style={{ fontFamily: font }}>{font}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>حجم الخط</Label>
                          <Select value={fontSize.toString()} onValueChange={(v) => setFontSize(parseInt(v))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fontSizeOptions.map(size => (
                                <SelectItem key={size} value={size.toString()}>
                                  {size}px
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>إظهار شريط الحالة</Label>
                            <p className="text-xs text-muted-foreground">إظهار معلومات الاتصال والوقت</p>
                          </div>
                          <Switch 
                            checked={settings.showStatusBar}
                            onCheckedChange={(checked) => handleSettingChange('showStatusBar', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>إظهار أرقام الأسطر</Label>
                            <p className="text-xs text-muted-foreground">عرض أرقام السطور في Terminal</p>
                          </div>
                          <Switch 
                            checked={settings.showLineNumbers}
                            onCheckedChange={(checked) => handleSettingChange('showLineNumbers', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>خلفية شفافة</Label>
                            <p className="text-xs text-muted-foreground">جعل خلفية التطبيق شفافة</p>
                          </div>
                          <Switch 
                            checked={settings.transparentBackground}
                            onCheckedChange={(checked) => handleSettingChange('transparentBackground', checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Terminal Tab */}
                  <TabsContent value="terminal" className="space-y-6 mt-0">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">إعدادات Terminal</h3>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>شكل المؤشر</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {cursorStyles.map(style => (
                              <Button
                                key={style.value}
                                variant={settings.cursorStyle === style.value ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleSettingChange('cursorStyle', style.value)}
                                className="justify-start"
                              >
                                <span className="mr-2 font-mono">{style.icon}</span>
                                {style.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>وميض المؤشر</Label>
                            <p className="text-xs text-muted-foreground">جعل المؤشر يومض</p>
                          </div>
                          <Switch 
                            checked={settings.cursorBlink}
                            onCheckedChange={(checked) => handleSettingChange('cursorBlink', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>لف النص</Label>
                            <p className="text-xs text-muted-foreground">لف النص الطويل للسطر التالي</p>
                          </div>
                          <Switch 
                            checked={settings.wordWrap}
                            onCheckedChange={(checked) => handleSettingChange('wordWrap', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>نسخ عند التحديد</Label>
                            <p className="text-xs text-muted-foreground">نسخ النص المحدد تلقائياً</p>
                          </div>
                          <Switch 
                            checked={settings.copyOnSelect}
                            onCheckedChange={(checked) => handleSettingChange('copyOnSelect', checked)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>حد Scrollback</Label>
                          <Select 
                            value={settings.maxScrollback.toString()} 
                            onValueChange={(v) => handleSettingChange('maxScrollback', parseInt(v))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1000">1,000 سطر</SelectItem>
                              <SelectItem value="5000">5,000 سطر</SelectItem>
                              <SelectItem value="10000">10,000 سطر</SelectItem>
                              <SelectItem value="50000">50,000 سطر</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Language Tab */}
                  <TabsContent value="language" className="space-y-6 mt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">إعدادات اللغة</h3>
                          <p className="text-sm text-muted-foreground">اختر لغة واجهة التطبيق</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>لغة الواجهة</Label>
                          <Select defaultValue="ar">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ar">العربية (Arabic)</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Español</SelectItem>
                              <SelectItem value="fr">Français</SelectItem>
                              <SelectItem value="de">Deutsch</SelectItem>
                              <SelectItem value="zh">中文</SelectItem>
                              <SelectItem value="ja">日本語</SelectItem>
                              <SelectItem value="ru">Русский</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            تغيير اللغة يتطلب إعادة تشغيل التطبيق
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>اتجاه النص</Label>
                          <Select defaultValue="rtl">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="rtl">من اليمين إلى اليسار (RTL)</SelectItem>
                              <SelectItem value="ltr">من اليسار إلى اليمين (LTR)</SelectItem>
                              <SelectItem value="auto">تلقائي حسب اللغة</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>تنسيق التاريخ والوقت</Label>
                          <Select defaultValue="arabic">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="arabic">عربي (١٤٤٥/١٢/١٥)</SelectItem>
                              <SelectItem value="gregorian">ميلادي (2024/01/15)</SelectItem>
                              <SelectItem value="mixed">مختلط</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>تبديل اللغة السريع</Label>
                            <p className="text-xs text-muted-foreground">تفعيل تبديل اللغة باستخدام Alt+Shift</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-3">
                          <h4 className="font-medium">إعدادات إضافية</h4>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <Label>ترجمة رسائل الخطأ</Label>
                              <p className="text-xs text-muted-foreground">ترجمة رسائل الخطأ للعربية عند الإمكان</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <Label>تحويل الأرقام</Label>
                              <p className="text-xs text-muted-foreground">عرض الأرقام بالأرقام العربية</p>
                            </div>
                            <Switch />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Audio Tab */}
                  <TabsContent value="audio" className="space-y-6 mt-0">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">إعدادات الصوت</h3>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>تفعيل الجرس</Label>
                          <p className="text-xs text-muted-foreground">تشغيل صوت عند الأخطاء أو التنبيهات</p>
                        </div>
                        <Switch 
                          checked={settings.bellSound}
                          onCheckedChange={(checked) => handleSettingChange('bellSound', checked)}
                        />
                      </div>
                      
                      {settings.bellSound && (
                        <div className="space-y-2">
                          <Label>مستوى الصوت</Label>
                          <div className="flex items-center gap-4">
                            <VolumeX className="w-4 h-4" />
                            <Input
                              type="range"
                              min="0"
                              max="100"
                              value={settings.bellVolume}
                              onChange={(e) => handleSettingChange('bellVolume', parseInt(e.target.value))}
                              className="flex-1"
                            />
                            <Volume2 className="w-4 h-4" />
                            <span className="text-sm w-12">{settings.bellVolume}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Security Tab */}
                  <TabsContent value="security" className="space-y-6 mt-0">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">إعدادات الأمان</h3>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>تأكيد الإغلاق</Label>
                          <p className="text-xs text-muted-foreground">طلب تأكيد قبل إغلاق التطبيق</p>
                        </div>
                        <Switch 
                          checked={settings.confirmClose}
                          onCheckedChange={(checked) => handleSettingChange('confirmClose', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>حفظ كلمات المرور</Label>
                          <p className="text-xs text-muted-foreground">حفظ كلمات مرور الاتصالات</p>
                        </div>
                        <Switch 
                          checked={settings.savePasswords}
                          onCheckedChange={(checked) => handleSettingChange('savePasswords', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>القفل التلقائي</Label>
                          <p className="text-xs text-muted-foreground">قفل التطبيق بعد فترة عدم نشاط</p>
                        </div>
                        <Switch 
                          checked={settings.autoLock}
                          onCheckedChange={(checked) => handleSettingChange('autoLock', checked)}
                        />
                      </div>
                      
                      {settings.autoLock && (
                        <div className="space-y-2">
                          <Label>وقت القفل (دقائق)</Label>
                          <Select 
                            value={settings.lockTimeout.toString()} 
                            onValueChange={(v) => handleSettingChange('lockTimeout', parseInt(v))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 دقائق</SelectItem>
                              <SelectItem value="15">15 دقيقة</SelectItem>
                              <SelectItem value="30">30 دقيقة</SelectItem>
                              <SelectItem value="60">ساعة واحدة</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Advanced Tab */}
                  <TabsContent value="advanced" className="space-y-6 mt-0">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">إعدادات متقدمة</h3>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>الميزات التجريبية</Label>
                          <p className="text-xs text-muted-foreground">تفعيل الميزات الجديدة قيد التطوير</p>
                        </div>
                        <Switch 
                          checked={settings.experimentalFeatures}
                          onCheckedChange={(checked) => handleSettingChange('experimentalFeatures', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>وضع التطوير</Label>
                          <p className="text-xs text-muted-foreground">إظهار معلومات إضافية للمطورين</p>
                        </div>
                        <Switch 
                          checked={settings.debugMode}
                          onCheckedChange={(checked) => handleSettingChange('debugMode', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>القياسات والتحليلات</Label>
                          <p className="text-xs text-muted-foreground">مساعدة في تحسين التطبيق</p>
                        </div>
                        <Switch 
                          checked={settings.telemetry}
                          onCheckedChange={(checked) => handleSettingChange('telemetry', checked)}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <Label>معدل التحديث</Label>
                        <Select 
                          value={settings.refreshRate.toString()} 
                          onValueChange={(v) => handleSettingChange('refreshRate', parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 FPS</SelectItem>
                            <SelectItem value="60">60 FPS</SelectItem>
                            <SelectItem value="120">120 FPS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>

            {/* Action Buttons */}
            <div className="flex items-center justify-between p-6 border-t">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  إعادة تعيين
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onClose}>
                  إلغاء
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1" />
                  حفظ الإعدادات
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default EnhancedSettingsModal