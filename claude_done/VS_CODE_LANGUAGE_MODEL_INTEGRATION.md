# VS Code Language Model API Integration

This extension now supports **two different language model providers**:

## 🏠 **Ollama (Local Models)**
- **Privacy-focused**: All data stays on your machine
- **Works offline**: No internet connection required
- **No cost**: Free to use once installed
- **Full control**: Choose any model you want to install
- **Setup required**: Must install and run Ollama locally

### Setup Ollama:
```bash
# macOS (using Homebrew)
brew install ollama

# Start Ollama service
ollama serve

# Install a model (example)
ollama pull llama3.2:3b
ollama pull codellama:7b
```

## ☁️ **VS Code Language Models (GitHub Copilot)**
- **Advanced models**: Access to GPT-4o, Claude 3.5 Sonnet, o1, etc.
- **No local setup**: Ready to use immediately
- **Automatic updates**: Always latest model versions
- **Requires subscription**: GitHub Copilot subscription needed
- **Internet required**: Cloud-based models

### Setup VS Code Language Models:
1. Install GitHub Copilot extension
2. Subscribe to GitHub Copilot
3. Grant permission when prompted by this extension

## 🎯 **Available Models**

### Ollama Models:
- Any model you install locally (llama3.2, codellama, mistral, etc.)
- Full list at: https://ollama.ai/library

### VS Code Language Models:
- **GPT-4o** - Recommended for general use
- **GPT-4o-mini** - Faster, good for simple tasks
- **o1** - Advanced reasoning
- **o1-mini** - Reasoning optimized for speed
- **Claude 3.5 Sonnet** - Excellent for code and analysis

## 🔄 **How to Switch Providers**

### Command Palette:
1. Open Command Palette (`Cmd+Shift+P`)
2. Run: "Switch Language Model Provider"
3. Select your preferred provider

### Keyboard Shortcuts:
- **Open Chat**: `Cmd+Shift+L` (Mac) / `Ctrl+Shift+L` (Linux)
- **Switch Provider**: Access via Command Palette
- **Provider Status**: Access via Command Palette

## 📊 **When to Use Which Provider?**

### Choose **Ollama** when you need:
- ✅ Complete privacy (sensitive/proprietary code)
- ✅ Offline access
- ✅ No ongoing costs
- ✅ Specific model requirements
- ✅ Full control over model behavior

### Choose **VS Code Language Models** when you want:
- ✅ Best performance (GPT-4o, Claude 3.5)
- ✅ Latest AI capabilities
- ✅ No local setup/maintenance
- ✅ Integrated VS Code experience
- ✅ Advanced reasoning (o1 models)

## 🚀 **Getting Started**

1. **Install the extension**
2. **Check provider status**: Run "Show Provider Status" from Command Palette
3. **Set up your preferred provider(s)**:
   - For Ollama: Install Ollama and models locally
   - For VS Code LM: Enable GitHub Copilot
4. **Switch provider if needed**: Run "Switch Language Model Provider"
5. **Open chat**: Press `Cmd+Shift+L` or click the robot icon in sidebar

## 🔧 **Technical Details**

The extension automatically:
- Detects available providers on startup
- Switches to available provider if current one is unavailable
- Handles authentication and permissions
- Manages streaming responses from both provider types
- Provides consistent error handling

## 🐛 **Troubleshooting**

### Ollama Issues:
- Ensure Ollama is running: `ollama serve`
- Check models are installed: `ollama list`
- Verify port 11434 is accessible

### VS Code LM Issues:
- Ensure GitHub Copilot extension is installed
- Check Copilot subscription is active
- Grant permissions when prompted
- Try different model (GPT-4o-mini is most reliable)

## 🎨 **UI Features**

- **Provider indication**: Current provider shown in chat interface
- **Model selection**: Choose from available models for current provider
- **Status indicators**: Visual feedback for provider availability
- **Quick switching**: Easy provider switching without losing context

Both providers work with the same chat interface, so you can switch seamlessly based on your needs!