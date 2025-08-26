export interface TerminalTheme {
  name: string
  id: string
  description: string
  colors: {
    background: string
    foreground: string
    cursor: string
    cursorAccent: string
    selection: string
    black: string
    red: string
    green: string
    yellow: string
    blue: string
    magenta: string
    cyan: string
    white: string
    brightBlack: string
    brightRed: string
    brightGreen: string
    brightYellow: string
    brightBlue: string
    brightMagenta: string
    brightCyan: string
    brightWhite: string
  }
}

export const terminalThemes: TerminalTheme[] = [
  {
    name: 'FlyTerm Pro',
    id: 'flyterm-pro',
    description: 'High contrast modern theme',
    colors: {
      background: '#0a0a0a',
      foreground: '#f1f5f9',
      cursor: '#00ff88',
      cursorAccent: '#0a0a0a',
      selection: 'rgba(0, 255, 136, 0.4)',
      black: '#1e293b',
      red: '#ff6b6b',
      green: '#00ff88',
      yellow: '#ffd93d',
      blue: '#74c7ec',
      magenta: '#f9c2ff',
      cyan: '#89dceb',
      white: '#f1f5f9',
      brightBlack: '#64748b',
      brightRed: '#ff8a95',
      brightGreen: '#4ade80',
      brightYellow: '#fbbf24',
      brightBlue: '#60a5fa',
      brightMagenta: '#d8b4fe',
      brightCyan: '#22d3ee',
      brightWhite: '#ffffff'
    }
  },
  {
    name: 'Ocean Breeze',
    id: 'ocean-breeze',
    description: 'Cool blue tones for relaxed coding',
    colors: {
      background: '#0f1419',
      foreground: '#e6e1dc',
      cursor: '#5ccfe6',
      cursorAccent: '#0f1419',
      selection: 'rgba(92, 207, 230, 0.3)',
      black: '#232526',
      red: '#f07178',
      green: '#c3e88d',
      yellow: '#ffcb6b',
      blue: '#82aaff',
      magenta: '#c792ea',
      cyan: '#89ddff',
      white: '#d0d0d0',
      brightBlack: '#555555',
      brightRed: '#ff5370',
      brightGreen: '#c3e88d',
      brightYellow: '#f78c6c',
      brightBlue: '#82aaff',
      brightMagenta: '#c792ea',
      brightCyan: '#89ddff',
      brightWhite: '#ffffff'
    }
  },
  {
    name: 'Sunset Glow',
    id: 'sunset-glow',
    description: 'Warm orange and red tones',
    colors: {
      background: '#1a1a1a',
      foreground: '#fdf6e3',
      cursor: '#ff9500',
      cursorAccent: '#1a1a1a',
      selection: 'rgba(255, 149, 0, 0.3)',
      black: '#073642',
      red: '#dc322f',
      green: '#859900',
      yellow: '#b58900',
      blue: '#268bd2',
      magenta: '#d33682',
      cyan: '#2aa198',
      white: '#eee8d5',
      brightBlack: '#586e75',
      brightRed: '#cb4b16',
      brightGreen: '#586e75',
      brightYellow: '#657b83',
      brightBlue: '#839496',
      brightMagenta: '#6c71c4',
      brightCyan: '#93a1a1',
      brightWhite: '#fdf6e3'
    }
  },
  {
    name: 'GitHub Dark',
    id: 'github-dark',
    description: 'Clean GitHub-inspired theme',
    colors: {
      background: '#0d1117',
      foreground: '#c9d1d9',
      cursor: '#58a6ff',
      cursorAccent: '#0d1117',
      selection: 'rgba(88, 166, 255, 0.3)',
      black: '#484f58',
      red: '#ff7b72',
      green: '#7ee787',
      yellow: '#f9e2af',
      blue: '#79c0ff',
      magenta: '#d2a8ff',
      cyan: '#a5f3fc',
      white: '#c9d1d9',
      brightBlack: '#6e7681',
      brightRed: '#ffa198',
      brightGreen: '#56d364',
      brightYellow: '#e3b341',
      brightBlue: '#58a6ff',
      brightMagenta: '#bc8cff',
      brightCyan: '#39d0d8',
      brightWhite: '#f0f6fc'
    }
  },
  {
    name: 'Dracula',
    id: 'dracula',
    description: 'Popular vampire-inspired dark theme',
    colors: {
      background: '#282a36',
      foreground: '#f8f8f2',
      cursor: '#ff79c6',
      cursorAccent: '#282a36',
      selection: 'rgba(255, 121, 198, 0.3)',
      black: '#21222c',
      red: '#ff5555',
      green: '#50fa7b',
      yellow: '#f1fa8c',
      blue: '#bd93f9',
      magenta: '#ff79c6',
      cyan: '#8be9fd',
      white: '#f8f8f2',
      brightBlack: '#6272a4',
      brightRed: '#ff6e6e',
      brightGreen: '#69ff94',
      brightYellow: '#ffffa5',
      brightBlue: '#d6acff',
      brightMagenta: '#ff92df',
      brightCyan: '#a4ffff',
      brightWhite: '#ffffff'
    }
  },
  {
    name: 'Matrix',
    id: 'matrix',
    description: 'Green-on-black hacker aesthetic',
    colors: {
      background: '#000000',
      foreground: '#00ff00',
      cursor: '#00ff00',
      cursorAccent: '#000000',
      selection: 'rgba(0, 255, 0, 0.3)',
      black: '#000000',
      red: '#ff0000',
      green: '#00ff00',
      yellow: '#ffff00',
      blue: '#0000ff',
      magenta: '#ff00ff',
      cyan: '#00ffff',
      white: '#ffffff',
      brightBlack: '#333333',
      brightRed: '#ff3333',
      brightGreen: '#33ff33',
      brightYellow: '#ffff33',
      brightBlue: '#3333ff',
      brightMagenta: '#ff33ff',
      brightCyan: '#33ffff',
      brightWhite: '#ffffff'
    }
  }
]

export const getThemeById = (id: string): TerminalTheme | undefined => {
  return terminalThemes.find(theme => theme.id === id)
}

export const getDefaultTheme = (): TerminalTheme => {
  return terminalThemes[0] // FlyTerm Pro
}