# Ollama Chat VS Code Extension

## Quick Start Guide

### 1. Prerequisites
Ensure Ollama is installed and running:
```bash
# Install Ollama (if not already installed)
# Visit: https://ollama.ai/

# Start Ollama server
ollama serve

# Install a model (example)
ollama pull gemma3n:e4b
ollama pull mistral-small3.2:24b
```

### 2. Extension Setup
```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Test the extension
# Press F5 in VS Code to launch Extension Development Host
```

### 3. Usage
1. **Open Chat**: Use `Ctrl+Shift+O` (or `Cmd+Shift+O` on Mac)
2. **Select Model**: Choose from dropdown of available models
3. **Set System Prompt** (Optional): Configure AI behavior
4. **Chat**: Type messages and get AI responses
5. **Clear**: Reset conversation anytime

### 4. Features
- ✅ **Real-time Streaming**: See responses as they generate
- ✅ **Model Selection**: Dropdown with all available Ollama models
- ✅ **System Prompts**: Customize AI behavior per conversation
- ✅ **Error Handling**: Clear messages when Ollama is not available
- ✅ **Keyboard Shortcuts**: `Ctrl/Cmd + Enter` to send messages
- ✅ **Theme Integration**: Follows VS Code color schemes

### 5. Troubleshooting
- **"Ollama not running"**: Ensure `ollama serve` is running
- **"No models available"**: Install models with `ollama pull <model-name>`
- **Connection issues**: Check that Ollama is on `localhost:11434`

## Development Notes
- Extension communicates with Ollama via OpenAI-compatible API
- Uses streaming for real-time response display
- Maintains conversation context across messages
- Handles all major error scenarios with user-friendly messages