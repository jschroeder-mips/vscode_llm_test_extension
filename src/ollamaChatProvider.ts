import * as vscode from 'vscode';
import { OllamaService, ChatMessage, OllamaModel } from './ollamaService';

export class OllamaChatProvider {
    private panel: vscode.WebviewPanel | undefined = undefined;

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly ollamaService: OllamaService
    ) {}

    public async showChatView() {
        if (this.panel) {
            // If panel already exists, show it
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }

        // Create and show a new webview
        this.panel = vscode.window.createWebviewPanel(
            'ollamaChat',
            'Ollama Chat',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this.extensionUri]
            }
        );

        // Set the HTML content
        this.panel.webview.html = this.getWebviewContent();

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                await this.handleWebviewMessage(message);
            }
        );

        // Reset when the current panel is closed
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });

        // Load models when the panel is created
        await this.loadModels();
    }

    private async loadModels() {
        try {
            const models = await this.ollamaService.getModels();
            this.panel?.webview.postMessage({
                command: 'updateModels',
                models: models.map(model => ({
                    name: model.name,
                    size: this.formatBytes(model.size)
                }))
            });
        } catch (error) {
            this.panel?.webview.postMessage({
                command: 'showError',
                message: error instanceof Error ? error.message : 'Failed to load models'
            });
        }
    }

    public selectModel(modelName: string) {
        // Send message to webview to select the specified model
        this.panel?.webview.postMessage({
            command: 'selectModel',
            modelName: modelName
        });
    }

    private async handleWebviewMessage(message: any) {
        switch (message.command) {
            case 'sendMessage':
                await this.handleSendMessage(message);
                break;
            case 'refreshModels':
                await this.loadModels();
                break;
            case 'clearChat':
                // Chat is cleared on the webview side
                break;
        }
    }

    private async handleSendMessage(message: any) {
        const { model, systemPrompt, userMessage, chatHistory } = message;

        if (!model || !userMessage) {
            this.panel?.webview.postMessage({
                command: 'showError',
                message: 'Please select a model and enter a message'
            });
            return;
        }

        try {
            // Build messages array
            const messages: ChatMessage[] = [];
            
            // Add system message if provided
            if (systemPrompt && systemPrompt.trim()) {
                messages.push({ role: 'system', content: systemPrompt.trim() });
            }

            // Add chat history
            if (chatHistory && Array.isArray(chatHistory)) {
                messages.push(...chatHistory);
            }

            // Add current user message
            messages.push({ role: 'user', content: userMessage });

            // Send user message to webview immediately
            this.panel?.webview.postMessage({
                command: 'addMessage',
                message: { role: 'user', content: userMessage }
            });

            // Start streaming response
            this.panel?.webview.postMessage({
                command: 'startStreaming'
            });

            let assistantResponse = '';
            await this.ollamaService.chat(model, messages, (chunk: string) => {
                assistantResponse += chunk;
                this.panel?.webview.postMessage({
                    command: 'streamChunk',
                    chunk: chunk
                });
            });

            // Finish streaming
            this.panel?.webview.postMessage({
                command: 'finishStreaming',
                message: { role: 'assistant', content: assistantResponse }
            });

        } catch (error) {
            this.panel?.webview.postMessage({
                command: 'showError',
                message: error instanceof Error ? error.message : 'An error occurred while chatting'
            });

            this.panel?.webview.postMessage({
                command: 'finishStreaming'
            });
        }
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    private getWebviewContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ollama Chat</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            margin: 0;
            padding: 20px;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            margin-bottom: 20px;
        }
        
        .model-selector {
            margin-bottom: 15px;
        }
        
        .model-selector select {
            width: 100%;
            padding: 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
        }
        
        .system-prompt {
            margin-bottom: 15px;
        }
        
        .system-prompt textarea {
            width: 100%;
            height: 80px;
            padding: 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            resize: vertical;
            font-family: var(--vscode-font-family);
        }
        
        .chat-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
        }
        
        .chat-history {
            flex: 1;
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            padding: 15px;
            overflow-y: auto;
            background-color: var(--vscode-editor-background);
            margin-bottom: 15px;
            min-height: 200px;
        }
        
        .message {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 5px;
        }
        
        .message.user {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            margin-left: 20px;
        }
        
        .message.assistant {
            background-color: var(--vscode-input-background);
            border-left: 3px solid var(--vscode-button-background);
            margin-right: 20px;
        }
        
        .message.streaming {
            opacity: 0.8;
        }
        
        .message-content {
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .input-area {
            display: flex;
            gap: 10px;
        }
        
        .input-area textarea {
            flex: 1;
            height: 80px;
            padding: 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            resize: vertical;
            font-family: var(--vscode-font-family);
        }
        
        .button-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        button {
            padding: 8px 16px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-family: var(--vscode-font-family);
        }
        
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .error {
            color: var(--vscode-errorForeground);
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            padding: 10px;
            border-radius: 3px;
            margin-bottom: 15px;
        }
        
        .no-models {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            padding: 20px;
        }
        
        .model-info {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>Ollama Chat</h2>
        
        <div class="model-selector">
            <label for="modelSelect">Select Model:</label>
            <select id="modelSelect">
                <option value="">Loading models...</option>
            </select>
            <button id="refreshModels">Refresh Models</button>
        </div>
        
        <div class="system-prompt">
            <label for="systemPrompt">System Prompt (Optional):</label>
            <textarea id="systemPrompt" placeholder="Enter system instructions for the AI assistant..."></textarea>
        </div>
    </div>
    
    <div class="chat-container">
        <div class="chat-history" id="chatHistory">
            <div class="no-models">Start a conversation by typing a message below.</div>
        </div>
        
        <div class="input-area">
            <textarea id="userInput" placeholder="Type your message here..." rows="3"></textarea>
            <div class="button-group">
                <button id="sendButton">Send</button>
                <button id="clearButton">Clear Chat</button>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let chatHistory = [];
        let isStreaming = false;
        let currentStreamingMessage = null;
        
        // DOM elements
        const modelSelect = document.getElementById('modelSelect');
        const systemPrompt = document.getElementById('systemPrompt');
        const chatHistoryDiv = document.getElementById('chatHistory');
        const userInput = document.getElementById('userInput');
        const sendButton = document.getElementById('sendButton');
        const clearButton = document.getElementById('clearButton');
        const refreshModels = document.getElementById('refreshModels');
        
        // Event listeners
        sendButton.addEventListener('click', sendMessage);
        clearButton.addEventListener('click', clearChat);
        refreshModels.addEventListener('click', () => {
            vscode.postMessage({ command: 'refreshModels' });
        });
        
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        function sendMessage() {
            if (isStreaming) return;
            
            const model = modelSelect.value;
            const userMessage = userInput.value.trim();
            
            if (!model || !userMessage) {
                showError('Please select a model and enter a message');
                return;
            }
            
            vscode.postMessage({
                command: 'sendMessage',
                model: model,
                systemPrompt: systemPrompt.value,
                userMessage: userMessage,
                chatHistory: chatHistory
            });
            
            userInput.value = '';
            updateUI();
        }
        
        function clearChat() {
            chatHistory = [];
            chatHistoryDiv.innerHTML = '<div class="no-models">Start a conversation by typing a message below.</div>';
            vscode.postMessage({ command: 'clearChat' });
        }
        
        function addMessage(message) {
            chatHistory.push(message);
            
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${message.role}\`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.textContent = message.content;
            
            messageDiv.appendChild(contentDiv);
            
            // Clear the placeholder if it exists
            if (chatHistoryDiv.children.length === 1 && chatHistoryDiv.children[0].className === 'no-models') {
                chatHistoryDiv.innerHTML = '';
            }
            
            chatHistoryDiv.appendChild(messageDiv);
            chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
            
            return messageDiv;
        }
        
        function startStreaming() {
            isStreaming = true;
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message assistant streaming';
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.textContent = '';
            
            messageDiv.appendChild(contentDiv);
            
            // Clear the placeholder if it exists
            if (chatHistoryDiv.children.length === 1 && chatHistoryDiv.children[0].className === 'no-models') {
                chatHistoryDiv.innerHTML = '';
            }
            
            chatHistoryDiv.appendChild(messageDiv);
            currentStreamingMessage = { div: messageDiv, content: contentDiv, text: '' };
            
            updateUI();
        }
        
        function streamChunk(chunk) {
            if (currentStreamingMessage) {
                currentStreamingMessage.text += chunk;
                currentStreamingMessage.content.textContent = currentStreamingMessage.text;
                chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
            }
        }
        
        function finishStreaming(message) {
            isStreaming = false;
            
            if (currentStreamingMessage) {
                currentStreamingMessage.div.classList.remove('streaming');
                if (message) {
                    chatHistory.push(message);
                }
                currentStreamingMessage = null;
            }
            
            updateUI();
        }
        
        function updateModels(models) {
            modelSelect.innerHTML = '';
            
            if (models.length === 0) {
                modelSelect.innerHTML = '<option value="">No models available</option>';
                showError('No Ollama models found. Please install models using: ollama pull <model-name>');
            } else {
                modelSelect.innerHTML = '<option value="">Select a model...</option>';
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.name;
                    option.textContent = \`\${model.name} (\${model.size})\`;
                    modelSelect.appendChild(option);
                });
            }
        }
        
        function selectModelInDropdown(modelName) {
            // Find and select the model in the dropdown
            for (let i = 0; i < modelSelect.options.length; i++) {
                if (modelSelect.options[i].value === modelName) {
                    modelSelect.selectedIndex = i;
                    updateUI();
                    break;
                }
            }
        }
        
        function showError(message) {
            // Remove existing error messages
            const existingErrors = document.querySelectorAll('.error');
            existingErrors.forEach(error => error.remove());
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = message;
            
            document.body.insertBefore(errorDiv, document.body.firstChild);
            
            // Auto-remove error after 5 seconds
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 5000);
        }
        
        function updateUI() {
            sendButton.disabled = isStreaming || !modelSelect.value;
            userInput.disabled = isStreaming;
            modelSelect.disabled = isStreaming;
        }
        
        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'updateModels':
                    updateModels(message.models);
                    updateUI();
                    break;
                case 'selectModel':
                    selectModelInDropdown(message.modelName);
                    break;
                case 'addMessage':
                    addMessage(message.message);
                    break;
                case 'startStreaming':
                    startStreaming();
                    break;
                case 'streamChunk':
                    streamChunk(message.chunk);
                    break;
                case 'finishStreaming':
                    finishStreaming(message.message);
                    break;
                case 'showError':
                    showError(message.message);
                    break;
            }
        });
        
        // Initialize
        updateUI();
    </script>
</body>
</html>`;
    }
}