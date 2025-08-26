# 🚀 FlyTerm - Modern Terminal Application

A beautiful, modern terminal application built with React, Electron, and TypeScript, featuring advanced SSH capabilities, file management, and a stunning user interface.

## ✨ Features

### 🔐 Secure SSH Connections
- **Password & Key Authentication**: Support for both password and private key authentication
- **Encrypted Storage**: Connection details are securely encrypted and stored locally
- **Multiple Connections**: Manage multiple server connections simultaneously
- **Connection Management**: Import/export connections, edit existing ones, and test connections

### 💻 Advanced Terminal
- **Multiple Terminals**: Run multiple terminal sessions in different layouts
- **Layout Options**: Single, split, and grid layouts for efficient multitasking
- **Interactive Input**: Full keyboard support with command history
- **Real-time Output**: Live command execution and output display

### 📁 File Management
- **Remote File Browser**: Browse and manage files on remote servers
- **File Operations**: Upload, download, create, and delete files
- **Directory Navigation**: Easy navigation through remote file systems
- **Search & Filter**: Find files quickly with search functionality

### 🎨 Beautiful UI
- **Modern Design**: Built with shadcn/ui components for a professional look
- **Responsive Layout**: Adapts to different screen sizes and orientations
- **Dark Theme**: Beautiful dark theme with customizable colors
- **Smooth Animations**: Framer Motion animations for a polished experience

### 🛠️ Developer Tools
- **Command History**: Track and reuse previous commands
- **Documentation**: Built-in help and documentation
- **Settings Panel**: Customize terminal appearance and behavior
- **Status Monitoring**: Real-time connection and terminal status

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/flyterm.git
   cd flyterm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   npm run electron:build
   ```

## 🏗️ Project Structure

```
flyterm/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── Sidebar.tsx     # Main sidebar navigation
│   │   ├── TerminalArea.tsx # Terminal management area
│   │   ├── TerminalTab.tsx  # Individual terminal tabs
│   │   ├── ConnectionModal.tsx # Connection management
│   │   ├── FileManager.tsx  # File management interface
│   │   ├── CommandHistory.tsx # Command history tracking
│   │   ├── Documentation.tsx # Help and documentation
│   │   └── SettingsModal.tsx # Application settings
│   ├── services/            # Business logic services
│   │   ├── ssh-service.ts   # SSH connection handling
│   │   └── connection-storage.ts # Connection persistence
│   ├── store/               # State management
│   │   └── terminal-store.ts # Zustand store
│   ├── lib/                 # Utility functions
│   │   └── utils.ts         # Common utilities
│   ├── App.tsx              # Main application component
│   └── index.css            # Global styles
├── electron/                 # Electron main process
├── public/                   # Static assets
├── tailwind.config.js        # Tailwind CSS configuration
└── package.json              # Project dependencies
```

## 🎯 Usage

### Creating Connections
1. Click "New Connection" in the sidebar
2. Fill in server details (host, port, username)
3. Choose authentication method (password or private key)
4. Test the connection
5. Save and connect

### Managing Terminals
1. Create a new terminal from the terminal area
2. Choose layout (single, split, or grid)
3. Switch between terminals using tabs
4. Maximize terminals for focused work
5. Close terminals when done

### File Management
1. Open File Manager from the sidebar
2. Navigate through remote directories
3. Upload/download files
4. Create new folders
5. Delete files and directories

## 🔧 Configuration

### Terminal Settings
- Font family and size
- Color scheme
- Line numbers display
- Status bar visibility
- Theme preferences

### Connection Settings
- Default ports
- Timeout values
- Security levels
- Key file paths

## 🛡️ Security Features

- **Encrypted Storage**: Connection details are encrypted using AES encryption
- **Secure Authentication**: Support for SSH keys and secure password handling
- **Local Storage**: All sensitive data stays on your local machine
- **No Cloud Sync**: Complete privacy and control over your data

## 🎨 Customization

### Themes
- Built-in dark theme
- Customizable color schemes
- Responsive design for all screen sizes

### Layouts
- Collapsible sidebar
- Multiple terminal layouts
- Customizable toolbar
- Flexible window management

## 🚧 Development

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Desktop**: Electron
- **Build Tool**: Vite

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run Electron in development
npm run electron:dev

# Build Electron app
npm run electron:build

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Issues**: Report bugs and request features on GitHub
- **Discussions**: Join community discussions
- **Documentation**: Check the built-in help system
- **Contributing**: We welcome contributions!

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Framer Motion](https://www.framer.com/motion/) for smooth animations
- [Zustand](https://github.com/pmndrs/zustand) for state management

---

Made with ❤️ by the FlyTerm Team
