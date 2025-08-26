import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Search, 
  FileText, 
  Code, 
  Terminal,
  Server,
  Settings,
  Zap,
  X,
  ExternalLink,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { cn } from '../lib/utils'

interface DocSection {
  id: string
  title: string
  icon: React.ComponentType<any>
  content: string
  examples?: string[]
  expanded?: boolean
}

const Documentation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started']))

  const docSections: DocSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Zap,
      content: 'Learn the basics of FlyTerm and how to get up and running quickly.',
      examples: [
        'Create your first SSH connection',
        'Open a terminal session',
        'Navigate the interface'
      ]
    },
    {
      id: 'ssh-connections',
      title: 'SSH Connections',
      icon: Server,
      content: 'Everything you need to know about establishing and managing SSH connections.',
      examples: [
        'Password authentication',
        'Private key authentication',
        'Connection management',
        'Multiple connections'
      ]
    },
    {
      id: 'terminal-usage',
      title: 'Terminal Usage',
      icon: Terminal,
      content: 'Master the terminal interface and advanced features.',
      examples: [
        'Multiple tabs',
        'Split views',
        'Customization options',
        'Keyboard shortcuts'
      ]
    },
    {
      id: 'file-management',
      title: 'File Management',
      icon: FileText,
      content: 'Browse, upload, download, and manage files on remote servers.',
      examples: [
        'File browser',
        'Drag and drop uploads',
        'Batch operations',
        'File permissions'
      ]
    },
    {
      id: 'customization',
      title: 'Customization',
      icon: Settings,
      content: 'Personalize FlyTerm to match your workflow and preferences.',
      examples: [
        'Theme selection',
        'Font settings',
        'Layout options',
        'Keyboard shortcuts'
      ]
    },
    {
      id: 'advanced-features',
      title: 'Advanced Features',
      icon: Code,
      content: 'Explore advanced capabilities and power user features.',
      examples: [
        'Script automation',
        'Session persistence',
        'Plugin system',
        'API integration'
      ]
    }
  ]

  const filteredSections = docSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const quickStartSteps = [
    {
      step: 1,
      title: 'Create Connection',
      description: 'Click "New Connection" and enter your server details',
      icon: Server
    },
    {
      step: 2,
      title: 'Connect',
      description: 'Use password or private key to authenticate',
      icon: Zap
    },
    {
      step: 3,
      title: 'Open Terminal',
      description: 'Start a new terminal session and begin working',
      icon: Terminal
    }
  ]

  const keyboardShortcuts = [
    { key: 'Ctrl+T', action: 'New Terminal Tab' },
    { key: 'Ctrl+Shift+T', action: 'New Terminal' },
    { key: 'Ctrl+W', action: 'Close Tab' },
    { key: 'Ctrl+Shift+W', action: 'Close Terminal' },
    { key: 'Ctrl+Tab', action: 'Next Tab' },
    { key: 'Ctrl+Shift+Tab', action: 'Previous Tab' },
    { key: 'F11', action: 'Toggle Fullscreen' },
    { key: 'Ctrl+,', action: 'Open Settings' }
  ]

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        className="w-full justify-start h-auto p-3"
      >
        <BookOpen className="w-4 h-4 mr-3" />
        Documentation
      </Button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setIsOpen(false)}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-6xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="border-border/50 bg-card/95 backdrop-blur-md h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl">Documentation</CardTitle>
                  <CardDescription>
                    Learn how to use FlyTerm effectively
                  </CardDescription>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Quick Start */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Quick Start
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickStartSteps.map((step) => (
                  <Card key={step.step} className="border-border/50 bg-card/50">
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <step.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                        {step.step}
                      </div>
                      <h4 className="font-semibold mb-2">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Search */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Search Documentation</h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Documentation Sections */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Topics</h3>
              
              <div className="space-y-2">
                {filteredSections.map((section) => {
                  const isExpanded = expandedSections.has(section.id)
                  
                  return (
                    <Card key={section.id} className="border-border/50">
                      <CardHeader 
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => toggleSection(section.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <section.icon className="w-5 h-5 text-primary" />
                            <div>
                              <CardTitle className="text-base">{section.title}</CardTitle>
                              <CardDescription className="text-sm">
                                {section.content}
                              </CardDescription>
                            </div>
                          </div>
                          
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </CardHeader>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <CardContent className="pt-0">
                              {section.examples && (
                                <div className="space-y-3">
                                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                                    What you'll learn:
                                  </h4>
                                  <ul className="space-y-2">
                                    {section.examples.map((example, index) => (
                                      <li key={index} className="flex items-center gap-2 text-sm">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                        {example}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              <div className="mt-4 pt-4 border-t border-border/50">
                                <Button variant="outline" size="sm" className="w-full">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Read Full Guide
                                </Button>
                              </div>
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* Keyboard Shortcuts */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {keyboardShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm">{shortcut.action}</span>
                    <Badge variant="outline" className="font-mono">
                      {shortcut.key}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Help Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Need More Help?</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                  <FileText className="w-6 h-6" />
                  <span>User Manual</span>
                  <span className="text-xs text-muted-foreground">Complete guide</span>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                  <Code className="w-6 h-6" />
                  <span>API Reference</span>
                  <span className="text-xs text-muted-foreground">Developer docs</span>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                  <ExternalLink className="w-6 h-6" />
                  <span>Video Tutorials</span>
                  <span className="text-xs text-muted-foreground">Learn visually</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default Documentation
