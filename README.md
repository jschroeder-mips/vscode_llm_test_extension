# Ollama Chat VS Code Extension

A VS Code extension that enables you to chat with local Ollama models directly within your editor. Features real-time streaming responses, model selection, and customizable system prompts.

## 🎯 Features

- **🤖 Local LLM Chat**: Communicate with Ollama models without leaving VS Code
- **📋 Model Selection**: Dropdown menu with all your installed Ollama models
- **💬 Real-time Streaming**: See responses as they're generated
- **⚙️ System Prompts**: Customize AI behavior for different tasks
- **🎨 Theme Integration**: Matches your VS Code theme automatically
- **🔗 Sidebar Integration**: Click the robot icon (🤖) in the Activity Bar for easy access
- **⌨️ Keyboard Shortcuts**: 
  - **Mac**: `Cmd+Shift+O` to open chat, `Cmd+Enter` to send messages
  - **Linux**: `Ctrl+Shift+O` to open chat, `Ctrl+Enter` to send messages

## 🚀 Local Installation & Testing

### Prerequisites

1. **Install Ollama** (if not already installed):
   
   **Mac**:
   ```bash
   # Option 1: Homebrew (recommended)
   brew install ollama
   
   # Option 2: Direct download
   # Visit https://ollama.ai/ and download the Mac installer
   ```
   
   **Linux**:
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Or visit https://ollama.ai/ for other Linux distributions
   ```

2. **Start Ollama server**:
   ```bash
   ollama serve
   ```

3. **Install at least one model**:
   ```bash
   # Example models (choose based on your hardware)
   ollama pull gemma3n:e4b          # Smaller model (~2.7GB)
   ollama pull mistral-small3.2:24b # Larger model (~13GB)
   ollama pull llama3.1:8b          # Popular model (~4.7GB)
   ```

### Extension Installation

1. **Clone and setup the extension**:
   ```bash
   # Clone this repository
   git clone <repository-url>
   cd vscode_llm_test_extension
   
   # Install dependencies
   npm install
   
   # Compile TypeScript to JavaScript
   npm run compile
   ```

2. **Test the extension in VS Code**:
   ```bash
   # Open the project in VS Code
   code .
   
   # Launch Extension Development Host
   # Press F5 or use: Debug > Start Debugging
   ```

3. **Use the extension in the test window**:
   
   **🖱️ Sidebar Method (Recommended)**:
   - Look for the robot icon (🤖) in the Activity Bar (left sidebar)
   - Click it to open the Ollama Chat sidebar
   - Click "Open Chat" to start chatting
   - Click any model name to select it and open chat
   
   **⌨️ Keyboard Method**:
   - **Mac**: Use `Cmd+Shift+P` → "Open Ollama Chat" or `Cmd+Shift+O`
   - **Linux**: Use `Ctrl+Shift+P` → "Open Ollama Chat" or `Ctrl+Shift+O`

### Verification Steps

1. **Check Ollama is running**:
   ```bash
   curl http://localhost:11434/api/tags
   ```
   Should return a JSON list of your installed models.

2. **Test the extension**:
   - Open the chat interface
   - Select a model from the dropdown
   - Type a message and press "Send" or:
     - **Mac**: `Cmd+Enter`
     - **Linux**: `Ctrl+Enter`
   - You should see a streaming response from the AI

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development (auto-recompile on changes)
npm run watch

# Run linting
npm run lint

# Run tests
npm run test
```

## ⌨️ Keyboard Shortcuts & Development Tips

### Extension Usage
| Action | Mac | Linux |
|--------|-----|-------|
| Open Command Palette | `Cmd+Shift+P` | `Ctrl+Shift+P` |
| Open Ollama Chat | `Cmd+Shift+O` | `Ctrl+Shift+O` |
| Send Message in Chat | `Cmd+Enter` | `Ctrl+Enter` |

### Development & Debugging
| Action | Mac | Linux |
|--------|-----|-------|
| Start Debugging (F5) | `F5` | `F5` |
| Toggle Developer Tools | `Cmd+Shift+I` | `Ctrl+Shift+I` |
| Reload Extension Host | `Cmd+R` | `Ctrl+R` |
| Stop Debugging | `Cmd+Shift+F5` | `Ctrl+Shift+F5` |

### Development Workflow Tips
- **Mac Users**: 
  - Use `npm run watch` in Terminal.app while developing
  - Press `Cmd+R` in Extension Host to reload after changes
  - Activity Monitor helps track Ollama performance
  
- **Linux Users**:
  - Use `npm run watch` in your terminal while developing  
  - Press `Ctrl+R` in Extension Host to reload after changes
  - Use `htop` to monitor system resources during testing

## � Sidebar Features

### Activity Bar Integration
The extension adds a **robot icon (🤖)** to VS Code's Activity Bar (left sidebar) that provides:

#### **Chat View**
- **"Open Chat"** button - Opens the main chat interface
- **"Refresh Models"** button - Updates the model list

#### **Available Models View**  
- **Live Model List** - Shows all installed Ollama models with file sizes
- **Click to Select** - Click any model to select it and open chat
- **Status Indicators** - Shows if Ollama is running or if models need to be installed

#### **Smart Status Display**
- ✅ **Models Available**: Shows clickable list of models with sizes
- ⚠️ **No Models**: Shows installation instructions
- ❌ **Ollama Not Running**: Shows service start instructions
- 🔄 **Auto-Refresh**: Updates when you refresh models

## �📂 Project Structure

```
├── package.json                # Extension manifest
├── tsconfig.json               # TypeScript configuration
├── src/
│   ├── extension.ts            # Main extension entry point
│   ├── ollamaService.ts        # Ollama API communication
│   ├── ollamaChatProvider.ts   # Chat UI management
│   └── ollamaSidebarProvider.ts # Sidebar tree view provider
├── out/                        # Compiled JavaScript (auto-generated)
└── claude_done/                # Development documentation
```

## 🔧 Troubleshooting

### Common Issues

1. **"Ollama is not running"**:
   - **Mac**: Start Ollama: `ollama serve` or use the Ollama app from Applications
   - **Linux**: Start Ollama service: `ollama serve` or `systemctl start ollama`
   - Check it's accessible: `curl http://localhost:11434/api/tags`

2. **"No models available"**:
   - Install a model: `ollama pull llama3.1:8b`
   - Refresh models in the extension interface
   - **Mac**: Check Ollama is in PATH: `which ollama`
   - **Linux**: Ensure ollama binary is accessible: `which ollama`

3. **Extension won't load**:
   - Ensure you compiled the TypeScript: `npm run compile`
   - Check the VS Code Developer Tools:
     - **Mac**: `Cmd+Shift+I` or Help > Toggle Developer Tools
     - **Linux**: `Ctrl+Shift+I` or Help > Toggle Developer Tools

4. **Model responses are slow**:
   - Smaller models respond faster (gemma3n:e4b vs mistral-small3.2:24b)
   - **Mac**: Check Activity Monitor for CPU/Memory usage
   - **Linux**: Use `htop` or `top` to monitor system resources

### Platform-Specific Issues

#### Mac Issues
- **Permission denied**: If Ollama won't start, check System Preferences > Security & Privacy
- **Port conflicts**: If port 11434 is busy, find what's using it: `lsof -i :11434`
- **Homebrew issues**: Update brew and reinstall: `brew update && brew reinstall ollama`

#### Linux Issues  
- **Service not starting**: Check systemd status: `systemctl status ollama`
- **Permission errors**: Ensure user has access: `sudo usermod -a -G ollama $USER`
- **Port binding**: Check if port is available: `netstat -tlnp | grep 11434`
- **Dependencies**: Ensure curl and other deps are installed: `sudo apt install curl`

### Supported Models

Any Ollama model should work. Popular choices:

- **gemma3n:e4b** - Fast, efficient model
- **llama3.1:8b** - Good balance of speed and capability  
- **mistral-small3.2:24b** - High quality responses
- **codellama:7b** - Specialized for code assistance

## 🧪 Testing API Manually

You can test Ollama directly to ensure it's working:

```bash
# List available models
curl http://localhost:11434/api/tags

# Test chat completion (replace "gemma3n:e4b" with your model)
curl http://localhost:11434/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "model": "gemma3n:e4b",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant."
            },
            {
                "role": "user",
                "content": "Hello!"
            }
        ]
    }'
```

## 📖 Documentation

See the `claude_done/` directory for detailed development documentation:
- `development_progress.md` - Complete development summary
- `quick_start.md` - User-friendly setup guide
- `architecture_summary.md` - Technical implementation details
