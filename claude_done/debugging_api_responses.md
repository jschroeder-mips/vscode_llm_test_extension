# Debugging API Response Issues

## ✅ API Test Results
The Ollama API is working correctly:
- ✅ Non-streaming responses work
- ✅ Streaming responses work  
- ✅ Both models are available

## 🔧 Extension Debugging Steps

### 1. Test the Extension with Debug Logging

1. **Launch Extension Development Host**:
   ```bash
   code --extensionDevelopmentPath=$(pwd)
   ```

2. **Open Developer Console**:
   - In Extension Development Host window: `Cmd+Shift+I`
   - Go to Console tab

3. **Test Chat**:
   - Click robot icon 🤖 → Open Chat
   - Select a model
   - Send a message: "Say hello"

4. **Check Console Logs**:
   Look for these debug messages:
   - `Sending message to model: gemma3n:e4b`
   - `Messages: [...]`
   - `Received chunk 1: ...`
   - `Chat completed. Total response: ...`

### 2. Common Issues & Fixes

#### Issue: No chunks received
**Debug**: Check console for "Sending message to model" but no "Received chunk"
**Fix**: The streaming parsing might be failing

#### Issue: Error in console
**Debug**: Look for red error messages
**Fixes**:
- Network error: Check Ollama is running
- Model error: Verify model name is correct
- Parsing error: Check streaming format

#### Issue: Send button stays disabled
**Fix**: Make sure model is selected in dropdown (not just clicked)

### 3. Manual API Test
```bash
# Test if the exact same request works via curl
curl -X POST http://localhost:11434/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "model": "gemma3n:e4b",
        "messages": [{"role": "user", "content": "Say hello"}],
        "stream": true
    }'
```

### 4. Extension Code Check Points

#### OllamaService.chat() method:
- ✅ Correct URL: `http://localhost:11434/v1/chat/completions`
- ✅ Streaming enabled: `stream: true`
- ✅ Response type: `responseType: 'stream'`
- ✅ Line parsing: `buffer.split('\n')`
- ✅ SSE format: `data: ` prefix handling

#### OllamaChatProvider.handleSendMessage():
- ✅ Message building
- ✅ Webview communication
- ✅ Error handling
- ✅ Debug logging added

### 5. Quick Fixes to Try

1. **Reload Extension Host**: `Cmd+R` in Extension Development Host
2. **Restart Ollama**: `ollama serve`  
3. **Recompile Extension**: `npm run compile`
4. **Check Model Name**: Ensure exact match with available models

### 6. Expected Console Output
When working correctly, you should see:
```
Sending message to model: gemma3n:e4b
Messages: [{role: "user", content: "Say hello"}]
Received chunk 1: Hello
Received chunk 2:  there
Received chunk 3: !
...
Chat completed. Total response: Hello there! 😊
```