# Language Model Chat VS Code Extension

A VS Code extension that provides a **unified chat interface** for both **local Ollama models** and **VS Code Language Models** (GitHub Copilot). Switch seamlessly between privacy-focused local models and powerful cloud models based on your needs.

## ✨ **What Makes This Special**

- **🔄 Dual Provider Architecture**: Seamlessly switch between local and cloud models
- **🎯 Smart Provider Detection**: Automatically detects available providers  
- **📱 Dynamic UI Updates**: Interface adapts based on selected provider
- **🔒 Privacy Choice**: Keep sensitive data local with Ollama or use advanced cloud models
- **⚡ Real-time Streaming**: Live responses from both provider types
- **🎨 Native Integration**: Follows VS Code design patterns and themes

![screenshot_01](screenshot_01.png)

![screenshot_02](screenshot_02.png)

## 🎯 Features

- **🤖 Dual Provider Support**: Chat with both local Ollama models and cloud-based VS Code Language Models
- **📋 Smart Model Selection**: Automatic detection of available models from both providers
- **💬 Real-time Streaming**: See responses as they're generated from any provider
- **⚡ Provider Switching**: Easily switch between Ollama (local) and VS Code LM (cloud) providers
- **⚙️ System Prompts**: Customize AI behavior for different tasks
- **🎨 Theme Integration**: Matches your VS Code theme automatically  
- **🔗 Sidebar Integration**: Click the robot icon (🤖) in the Activity Bar for easy access
- **⌨️ Keyboard Shortcuts**: 
  - **Mac**: `Cmd+Shift+L` to open chat, `Cmd+Enter` to send messages
  - **Linux**: `Ctrl+Shift+L` to open chat, `Ctrl+Enter` to send messages

## 🌟 Language Model Providers

### 🏠 **Ollama (Local Models)**
- ✅ **Complete privacy** - All data stays on your machine
- ✅ **Works offline** - No internet connection required
- ✅ **No ongoing costs** - Free to use once installed
- ✅ **Full control** - Choose any model from Ollama library
- ⚙️ **Setup required** - Must install and run Ollama locally

### ☁️ **VS Code Language Models (GitHub Copilot)**  
- ✅ **Advanced models** - GPT-4o, Claude 3.5 Sonnet, o1, etc.
- ✅ **No local setup** - Ready to use immediately
- ✅ **Latest AI** - Always updated to newest model versions
- 💰 **Requires subscription** - GitHub Copilot subscription needed
- 🌐 **Internet required** - Cloud-based models

## 🚀 Local Installation & Testing

## 🚀 Getting Started

The extension supports two language model providers. You can set up one or both:

### Option 1: VS Code Language Models (Easiest)

1. **Install GitHub Copilot extension** (if not already installed)
2. **Subscribe to GitHub Copilot** at https://github.com/features/copilot
3. **Install this extension** and it will automatically detect Copilot models
4. **Grant permissions** when prompted to use language models

### Option 2: Ollama (Privacy-focused)

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
   ollama pull llama3.2:3b          # Smaller model (~2GB) - Good for most tasks
   ollama pull codellama:7b         # Code-focused model (~3.8GB)
   ollama pull llama3.1:8b          # Popular general model (~4.7GB)
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
   # Method 1: Direct command (most reliable)
   code --extensionDevelopmentPath=$(pwd)
   
   # Method 2: VS Code Debug (F5)
   # Open src/extension.ts, then press F5
   # Or use: Debug > Start Debugging
   ```

3. **Use the extension in the test window**:

## 🎮 Using the Extension

## 🎮 Using the Extension

### 🎯 **First Time Setup**
1. **Check what's available**:
   ```
   Cmd+Shift+P → "Show Provider Status"
   ```
   See which providers are detected and available

2. **Switch providers** (if you have both):
   ```
   Cmd+Shift+P → "Switch Language Model Provider"
   ```
   Choose between:
   - **Ollama (Local)** - Privacy-focused, works offline
   - **VS Code Language Models** - Advanced cloud models

### 💬 **Chat Interface**
   
**🖱️ Sidebar Method (Recommended)**:
- Click the robot icon (🤖) in Activity Bar (left sidebar)  
- Interface shows current provider at the top
- Select a model from the dropdown
- Start chatting!

**⌨️ Keyboard Method**:
- Press `Cmd+Shift+L` (Mac) or `Ctrl+Shift+L` (Linux)
- Opens chat interface directly

### 🔄 **Provider Switching**
The interface **dynamically updates** when you switch providers:
- **Model dropdown** refreshes with provider-specific models
- **Provider badge** shows current selection at top of chat
- **Error messages** are tailored to the active provider
- **Streaming** works consistently across both providers

### Chat Interface
   
**🖱️ Sidebar Method (Recommended)**:
- Look for the robot icon (🤖) in the Activity Bar (left sidebar)
- Click it to open the chat sidebar
- Click "Open Chat" to start chatting
- Click any model name to select it and open chat
   
   **⌨️ Keyboard Method**:
   - **Mac**: Use `Cmd+Shift+P` → "Open Ollama Chat" or `Cmd+Shift+L`
   - **Linux**: Use `Ctrl+Shift+P` → "Open Ollama Chat" or `Ctrl+Shift+L`

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
| Open Ollama Chat | `Cmd+Shift+L` | `Ctrl+Shift+L` |
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
   - **F5 shows "JSON debugging" error**: Use direct command instead:
     ```bash
     code --extensionDevelopmentPath=$(pwd)
     ```
   - Check the VS Code Developer Tools:
     - **Mac**: `Cmd+Shift+I` or Help > Toggle Developer Tools
     - **Linux**: `Ctrl+Shift+I` or Help > Toggle Developer Tools

4. **Send button stays disabled**:
   - Make sure you select a model from the dropdown (not just click)
   - Try refreshing models if dropdown shows "Loading models..."
   - Reload the extension: `Cmd+R` in Extension Development Host

5. **Messages send but no response**:
   - **Debug Console**: Press `Cmd+Shift+I` in Extension Development Host → Console tab
   - **Look for errors**: Check for red error messages in console
   - **Test API directly**: Run `node test_ollama_api.js` from project directory
   - **Reload extension**: `Cmd+R` in Extension Development Host window
   - **Check logs**: Should see "Sending message to model" and "Received chunk" messages

6. **Model responses are slow**:
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
