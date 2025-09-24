# VS Code Extension Loading Troubleshooting Guide

## 🚀 Step-by-Step Loading Instructions

### 1. **Ensure Everything is Compiled**
```bash
# Make sure you're in the project directory
cd /Users/jschroeder/Documents/code_repos/vscode_llm_test_extension

# Install dependencies (if not done already)
npm install

# Compile TypeScript
npm run compile

# Verify the 'out' directory was created
ls -la out/
```

### 2. **Open Project in VS Code**
```bash
# Open the extension project in VS Code
code .
```

### 3. **Launch Extension Development Host**

**Method 1: Keyboard Shortcut**
- Press `F5` (this is the most reliable method)

**Method 2: VS Code Menu**
- Go to `Run` → `Start Debugging`
- Or use `Run and Debug` panel (`Cmd+Shift+D`) → Click green play button

**Method 3: Command Palette**
- `Cmd+Shift+P` → Type "Debug: Start Debugging" → Enter

### 4. **What Should Happen**
1. VS Code compiles your extension (you'll see this in the terminal)
2. A new VS Code window opens with "[Extension Development Host]" in the title
3. Your extension is now loaded in this new window

### 5. **Test the Extension**

**In the Extension Development Host window:**

**Option A: Sidebar (Recommended)**
- Look for the robot icon (🤖) in the Activity Bar (left side)
- Click it to see the Ollama Chat sidebar
- Click "Open Chat" or any model name

**Option B: Command Palette**
- Press `Cmd+Shift+P`
- Type "Open Ollama Chat"
- Press Enter

**Option C: Keyboard Shortcut**
- Press `Cmd+Shift+L`

## 🔧 Common Issues & Solutions

### Issue 1: "Extension Host didn't start"
**Solution:**
```bash
# Clean and rebuild
rm -rf out/
npm run compile
```
Then try F5 again.

### Issue 2: "No robot icon in Activity Bar"
**Check:**
1. Make sure you're looking in the **Extension Development Host** window
2. The robot icon should appear in the left Activity Bar
3. If not visible, try reloading: `Cmd+R` in the Extension Development Host

### Issue 3: "Command not found"
**Solutions:**
1. Check the Extension Development Host has the title "[Extension Development Host]"
2. Try reloading the extension host: `Cmd+Shift+F5`
3. Check for errors in Developer Tools: `Cmd+Shift+I` → Console tab

### Issue 4: Extension loads but Ollama doesn't work
**Check Ollama:**
```bash
# Verify Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it
ollama serve

# Install a model if none exist
ollama pull gemma3n:e4b
```

## 🐛 Debug Information

### Check Extension is Loaded
1. In Extension Development Host: `Cmd+Shift+P`
2. Type "Developer: Reload Window"
3. Check the Output panel for any error messages

### View Extension Logs
1. `Cmd+Shift+I` → Open Developer Tools
2. Go to Console tab
3. Look for any red error messages

### Check Extension Files
```bash
# Verify compiled files exist
ls -la out/
# Should show: extension.js, ollamaService.js, etc.
```

## 📝 Quick Test Script

Run this to verify everything is working:

```bash
# From the extension directory
echo "Checking extension files..."
ls -la out/

echo "Checking Ollama..."
curl -s http://localhost:11434/api/tags | head -5

echo "Compiling extension..."
npm run compile

echo "Starting Extension Development Host..."
code --extensionDevelopmentPath=$(pwd)
```

**Alternative F5 Method:**
```bash
echo "Opening project in VS Code..."
code .
echo "Now open src/extension.ts and press F5!"
```

## ✅ Success Indicators

You know it's working when:
- ✅ New VS Code window opens with "[Extension Development Host]" in title
- ✅ Robot icon (🤖) appears in Activity Bar
- ✅ Clicking robot shows "Chat with AI" and "Available Models"
- ✅ Commands appear in Command Palette (`Cmd+Shift+P` → "Open Ollama Chat")