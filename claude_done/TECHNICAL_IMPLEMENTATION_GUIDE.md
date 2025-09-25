# VS Code Language Model API - Technical Implementation Guide

## 🎯 **Overview**

This document provides a comprehensive technical guide for implementing VS Code's Language Model API alongside existing language model providers (like Ollama). The implementation demonstrates how to create a **modular, dual-provider architecture** that can be easily integrated into production VS Code extensions.

---

## 🏗️ **Architecture Overview**

### **Core Design Pattern: Provider Abstraction**

```typescript
// Abstract base class for all language model providers
abstract class LanguageModelProvider {
    abstract getAvailableModels(): Promise<LanguageModel[]>;
    abstract isAvailable(): Promise<boolean>;
    abstract chat(messages: ChatMessage[], model: string, onStream: StreamingCallback, cancellationToken: vscode.CancellationToken): Promise<void>;
    abstract getProviderName(): string;
    abstract getProviderDescription(): string;
}
```

### **Key Components**

1. **`LanguageModelProvider`** - Abstract base class
2. **`VSCodeLanguageModelProvider`** - VS Code LM API implementation  
3. **`OllamaLanguageModelProvider`** - Local Ollama implementation
4. **`UnifiedLanguageModelService`** - Orchestrates multiple providers
5. **Chat Interface Integration** - UI updates and provider switching

---

## 📁 **File Structure & Responsibilities**

```
src/
├── languageModelProvider.ts          # Abstract base class & interfaces
├── vscodeLanguageModelProvider.ts    # VS Code Language Model API impl
├── ollamaLanguageModelProvider.ts    # Ollama provider implementation  
├── unifiedLanguageModelService.ts    # Multi-provider orchestration
├── ollamaChatProvider.ts            # Updated chat UI (provider-aware)
└── extension.ts                     # Commands & lifecycle management
```

### **Dependency Flow**
```
extension.ts
    ├── UnifiedLanguageModelService
    │   ├── VSCodeLanguageModelProvider
    │   └── OllamaLanguageModelProvider
    └── OllamaChatProvider (uses UnifiedService)
```

---

## 🔧 **Implementation Details**

### **1. Abstract Provider Interface**

```typescript
// languageModelProvider.ts
export interface LanguageModel {
    name: string;
    provider: 'ollama' | 'vscode-lm';
    id?: string;
    family?: string;
    vendor?: string;
}

export interface StreamingCallback {
    (chunk: string): void;
}

export abstract class LanguageModelProvider {
    abstract getAvailableModels(): Promise<LanguageModel[]>;
    abstract isAvailable(): Promise<boolean>;
    abstract chat(
        messages: ChatMessage[], 
        model: string,
        onStream: StreamingCallback,
        cancellationToken: vscode.CancellationToken
    ): Promise<void>;
    abstract getProviderName(): string;
    abstract getProviderDescription(): string;
}
```

**Key Design Decisions:**
- **Consistent Interface**: All providers implement same methods
- **Streaming Support**: Built-in callback system for real-time responses
- **Cancellation Support**: VS Code cancellation token integration
- **Type Safety**: Strong TypeScript typing throughout

---

### **2. VS Code Language Model Provider Implementation**

```typescript
// vscodeLanguageModelProvider.ts
export class VSCodeLanguageModelProvider extends LanguageModelProvider {
    private static readonly SUPPORTED_MODELS = [
        { name: 'GPT-4o', id: 'gpt-4o', family: 'gpt-4o', vendor: 'copilot' },
        { name: 'GPT-4o-mini', id: 'gpt-4o-mini', family: 'gpt-4o-mini', vendor: 'copilot' },
        { name: 'o1', id: 'o1', family: 'o1', vendor: 'copilot' },
        { name: 'Claude 3.5 Sonnet', id: 'claude-3.5-sonnet', family: 'claude-3.5-sonnet', vendor: 'copilot' }
    ];

    async getAvailableModels(): Promise<LanguageModel[]> {
        const availableModels: LanguageModel[] = [];
        
        for (const modelInfo of VSCodeLanguageModelProvider.SUPPORTED_MODELS) {
            try {
                const models = await vscode.lm.selectChatModels({
                    vendor: modelInfo.vendor,
                    family: modelInfo.family
                });
                
                if (models.length > 0) {
                    availableModels.push({
                        name: modelInfo.name,
                        provider: 'vscode-lm',
                        id: modelInfo.id,
                        family: modelInfo.family,
                        vendor: modelInfo.vendor
                    });
                }
            } catch (error) {
                console.log(`Model ${modelInfo.name} not available:`, error);
            }
        }
        
        return availableModels;
    }

    async chat(
        messages: ChatMessage[], 
        model: string,
        onStream: StreamingCallback,
        cancellationToken: vscode.CancellationToken
    ): Promise<void> {
        const modelInfo = VSCodeLanguageModelProvider.SUPPORTED_MODELS.find(
            m => m.name === model || m.id === model
        );
        
        if (!modelInfo) {
            throw new Error(`Model ${model} not found`);
        }

        const models = await vscode.lm.selectChatModels({
            vendor: modelInfo.vendor,
            family: modelInfo.family
        });

        const selectedModel = models[0];

        // Convert messages to VS Code format
        const vscodeMessages = messages.map(msg => {
            if (msg.role === 'user' || msg.role === 'system') {
                return vscode.LanguageModelChatMessage.User(msg.content);
            } else {
                return vscode.LanguageModelChatMessage.Assistant(msg.content);
            }
        });

        // Send request and stream response
        const chatResponse = await selectedModel.sendRequest(
            vscodeMessages,
            {},
            cancellationToken
        );

        for await (const fragment of chatResponse.text) {
            if (cancellationToken.isCancellationRequested) break;
            onStream(fragment);
        }
    }
}
```

**Critical Implementation Points:**

1. **Model Discovery**: Iterates through known models and tests availability
2. **Permission Handling**: VS Code automatically handles user consent dialogs
3. **Message Format Conversion**: Converts generic `ChatMessage` to VS Code's format
4. **Streaming Integration**: Uses async iterators for streaming responses
5. **Error Handling**: Graceful handling of unavailable models and API errors

---

### **3. Unified Service Orchestration**

```typescript
// unifiedLanguageModelService.ts
export class UnifiedLanguageModelService {
    private ollamaProvider: OllamaLanguageModelProvider;
    private vscodeProvider: VSCodeLanguageModelProvider;
    private currentProvider: ProviderType = 'ollama';

    async getAvailableProviders(): Promise<ProviderInfo[]> {
        const providers = [
            {
                type: 'ollama' as const,
                name: this.ollamaProvider.getProviderName(),
                description: this.ollamaProvider.getProviderDescription(),
                available: await this.ollamaProvider.isAvailable()
            },
            {
                type: 'vscode-lm' as const,
                name: this.vscodeProvider.getProviderName(),
                description: this.vscodeProvider.getProviderDescription(),
                available: await this.vscodeProvider.isAvailable()
            }
        ];
        return providers;
    }

    setProvider(provider: ProviderType): void {
        this.currentProvider = provider;
    }

    private getActiveProvider(): LanguageModelProvider {
        return this.currentProvider === 'ollama' ? this.ollamaProvider : this.vscodeProvider;
    }

    async chat(
        messages: ChatMessage[], 
        model: string,
        onStream: StreamingCallback,
        cancellationToken: vscode.CancellationToken
    ): Promise<void> {
        return await this.getActiveProvider().chat(messages, model, onStream, cancellationToken);
    }
}
```

**Orchestration Benefits:**
- **Single API**: Consumer code doesn't need to know about individual providers
- **Dynamic Switching**: Can change providers at runtime
- **Provider Detection**: Automatically discovers what's available
- **Fallback Logic**: Can implement automatic fallbacks if desired

---

### **4. UI Integration & Provider Awareness**

#### **Chat Interface Updates**

The chat interface was updated to be provider-aware:

```typescript
// ollamaChatProvider.ts - Key updates
private async loadModels() {
    if (this.unifiedService) {
        const unifiedModels = await this.unifiedService.getAvailableModels();
        const currentProvider = this.unifiedService.getCurrentProvider();
        
        const models = unifiedModels.map(model => ({
            name: model.name,
            size: model.provider === 'ollama' ? '' : '(Cloud)',
            provider: model.provider
        }));

        this.panel?.webview.postMessage({
            command: 'updateModels',
            models: models,
            currentProvider: currentProvider  // ← Provider info sent to UI
        });
    }
}

private async handleSendMessage(message: any) {
    // ... existing code ...
    
    if (this.unifiedService) {
        const cancellationTokenSource = new vscode.CancellationTokenSource();
        await this.unifiedService.chat(messages, model, streamCallback, cancellationTokenSource.token);
    } else {
        // Fallback to original service
        await this.ollamaService.chat(model, messages, streamCallback);
    }
}
```

#### **Dynamic UI Updates**

The webview JavaScript handles provider-specific updates:

```javascript
function updateModels(models, currentProvider) {
    // Update provider badge
    const providerInfo = document.getElementById('providerInfo');
    if (providerInfo) {
        const providerName = currentProvider === 'ollama' ? 
            'Ollama (Local)' : 'VS Code Language Models (Cloud)';
        providerInfo.textContent = `Provider: ${providerName}`;
    }
    
    // Update model dropdown with provider-specific models
    modelSelect.innerHTML = '<option value="">Select a model...</option>';
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.name;
        option.textContent = `${model.name} ${model.size ? '(' + model.size + ')' : ''}`;
        modelSelect.appendChild(option);
    });
}
```

---

### **5. Command Integration & User Experience**

#### **Provider Switching Command**

```typescript
// extension.ts
const switchProviderCommand = vscode.commands.registerCommand('ollamaChat.switchProvider', async () => {
    const providers = await unifiedService.getAvailableProviders();
    const items = providers.map(p => ({
        label: p.name,
        description: p.description,
        detail: p.available ? '✅ Available' : '❌ Not Available',
        provider: p.type
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select Language Model Provider'
    });

    if (selected && selected.provider !== unifiedService.getCurrentProvider()) {
        unifiedService.setProvider(selected.provider);
        await chatProvider.refreshModelsForProvider();  // ← UI refresh
        
        vscode.window.showInformationMessage(`Switched to ${selected.label}`);
    }
});
```

#### **Smart Initialization**

```typescript
async function checkProviderAvailability(unifiedService: UnifiedLanguageModelService, chatProvider: any) {
    const providers = await unifiedService.getAvailableProviders();
    const availableProviders = providers.filter(p => p.available);
    
    if (availableProviders.length === 0) {
        vscode.window.showWarningMessage(
            'No language model providers are available...',
            'Setup Ollama', 'Setup Copilot'
        );
    } else {
        // Auto-switch to available provider if current one is unavailable
        const currentProvider = unifiedService.getCurrentProvider();
        const isCurrentAvailable = providers.find(p => p.type === currentProvider)?.available;
        
        if (!isCurrentAvailable) {
            unifiedService.setProvider(availableProviders[0].type);
            await chatProvider.refreshModelsForProvider();
        }
    }
}
```

---

## 🧩 **Modularization for Production Use**

### **Creating a Reusable Component**

The VS Code Language Model integration can be extracted into a reusable npm package:

```
@yourcompany/vscode-language-model-provider/
├── src/
│   ├── index.ts                     # Main exports
│   ├── providers/
│   │   ├── base.ts                  # Abstract LanguageModelProvider
│   │   ├── vscode-lm.ts            # VS Code LM implementation
│   │   └── unified.ts              # UnifiedLanguageModelService
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   └── utils/
│       └── streaming.ts            # Streaming utilities
├── package.json
└── README.md
```

#### **Package Entry Point**

```typescript
// index.ts
export { LanguageModelProvider } from './providers/base';
export { VSCodeLanguageModelProvider } from './providers/vscode-lm';
export { UnifiedLanguageModelService } from './providers/unified';
export * from './types';

// Convenience factory function
export function createLanguageModelService(): UnifiedLanguageModelService {
    return new UnifiedLanguageModelService();
}

// Provider detection utility
export async function detectAvailableProviders(): Promise<ProviderInfo[]> {
    const service = new UnifiedLanguageModelService();
    return await service.getAvailableProviders();
}
```

#### **Integration in Production Extension**

```typescript
// Your production extension
import { 
    createLanguageModelService, 
    VSCodeLanguageModelProvider,
    detectAvailableProviders 
} from '@yourcompany/vscode-language-model-provider';

export async function activate(context: vscode.ExtensionContext) {
    // Initialize language model service
    const languageModelService = createLanguageModelService();
    
    // Add your custom providers
    languageModelService.addProvider('openai', new YourOpenAIProvider());
    languageModelService.addProvider('anthropic', new YourAnthropicProvider());
    
    // Detect available providers
    const availableProviders = await detectAvailableProviders();
    console.log('Available providers:', availableProviders);
    
    // Initialize your chat interface with the unified service
    const chatProvider = new YourChatProvider(context.extensionUri, languageModelService);
}
```

---

## 🔒 **Security & Best Practices**

### **Permission Handling**

```typescript
// VS Code automatically handles permissions, but you should:

1. **Call selectChatModels() in response to user action** (not at startup)
2. **Handle LanguageModelError appropriately**
3. **Provide clear error messages** when permissions are denied
4. **Gracefully degrade** when VS Code LM is unavailable

// Example:
try {
    const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
    // Use models...
} catch (error) {
    if (error instanceof vscode.LanguageModelError) {
        // Handle permission denied, quota exceeded, etc.
        this.showPermissionHelp();
    }
}
```

### **Rate Limiting & Quotas**

```typescript
// VS Code handles quotas automatically, but you should:

1. **Implement user-facing quota information**
2. **Provide alternative providers when quotas exceeded**
3. **Cache responses where appropriate**
4. **Implement request queuing for burst usage**

class QuotaAwareProvider extends VSCodeLanguageModelProvider {
    private requestQueue: RequestQueue = new RequestQueue();
    
    async chat(...args) {
        try {
            return await super.chat(...args);
        } catch (error) {
            if (this.isQuotaExceeded(error)) {
                // Switch to alternative provider or queue request
                return await this.handleQuotaExceeded(...args);
            }
            throw error;
        }
    }
}
```

### **Error Handling Best Practices**

```typescript
// Comprehensive error handling
async chat(messages, model, onStream, cancellationToken) {
    try {
        // Main chat logic...
    } catch (error) {
        if (error instanceof vscode.LanguageModelError) {
            // VS Code specific errors
            this.handleVSCodeError(error, onStream);
        } else if (error.name === 'AbortError') {
            // Cancellation
            onStream('\n\n[Request cancelled by user]');
        } else if (error.code === 'ENOTFOUND') {
            // Network issues
            onStream('\n\n[Network error: Please check your connection]');
        } else {
            // Generic error
            onStream(`\n\n[Error: ${error.message}]`);
        }
    }
}
```

---

## 📊 **Performance Considerations**

### **Lazy Loading**

```typescript
class LazyLanguageModelService {
    private providers: Map<string, () => Promise<LanguageModelProvider>> = new Map();
    private loadedProviders: Map<string, LanguageModelProvider> = new Map();
    
    registerProvider(name: string, factory: () => Promise<LanguageModelProvider>) {
        this.providers.set(name, factory);
    }
    
    private async getProvider(name: string): Promise<LanguageModelProvider> {
        if (!this.loadedProviders.has(name)) {
            const factory = this.providers.get(name);
            if (factory) {
                this.loadedProviders.set(name, await factory());
            }
        }
        return this.loadedProviders.get(name)!;
    }
}
```

### **Streaming Optimization**

```typescript
// Efficient streaming with backpressure handling
class StreamingManager {
    private readonly chunkQueue: string[] = [];
    private isProcessing = false;
    
    async processStream(stream: AsyncIterable<string>, onChunk: (chunk: string) => void) {
        for await (const chunk of stream) {
            this.chunkQueue.push(chunk);
            
            if (!this.isProcessing) {
                this.isProcessing = true;
                // Process chunks in batches to avoid UI blocking
                await this.processBatch(onChunk);
                this.isProcessing = false;
            }
        }
    }
}
```

---

## 🧪 **Testing Strategies**

### **Unit Testing Providers**

```typescript
// Test individual providers
describe('VSCodeLanguageModelProvider', () => {
    let provider: VSCodeLanguageModelProvider;
    let mockVSCodeAPI: jest.Mocked<typeof vscode.lm>;
    
    beforeEach(() => {
        provider = new VSCodeLanguageModelProvider();
        mockVSCodeAPI = createMockVSCodeAPI();
    });
    
    it('should detect available models', async () => {
        mockVSCodeAPI.selectChatModels.mockResolvedValue([mockModel]);
        
        const models = await provider.getAvailableModels();
        expect(models).toHaveLength(1);
        expect(models[0].provider).toBe('vscode-lm');
    });
    
    it('should handle streaming responses', async () => {
        const chunks: string[] = [];
        const mockStream = createMockStream(['Hello', ' ', 'World']);
        
        await provider.chat(
            [{ role: 'user', content: 'test' }],
            'gpt-4o',
            (chunk) => chunks.push(chunk),
            mockCancellationToken
        );
        
        expect(chunks.join('')).toBe('Hello World');
    });
});
```

### **Integration Testing**

```typescript
// Test provider switching and UI updates
describe('Language Model Integration', () => {
    it('should switch providers and update UI', async () => {
        const service = new UnifiedLanguageModelService();
        const chatProvider = new TestChatProvider(service);
        
        // Start with Ollama
        expect(service.getCurrentProvider()).toBe('ollama');
        
        // Switch to VS Code LM
        service.setProvider('vscode-lm');
        await chatProvider.refreshModelsForProvider();
        
        // Verify UI updated
        expect(chatProvider.getDisplayedProvider()).toBe('VS Code Language Models (Cloud)');
    });
});
```

---

## 🚀 **Deployment & Distribution**

### **Extension Manifest Updates**

```json
// package.json
{
    "contributes": {
        "commands": [
            {
                "command": "yourext.switchProvider",
                "title": "Switch Language Model Provider"
            }
        ]
    },
    "dependencies": {
        "@yourcompany/vscode-language-model-provider": "^1.0.0"
    }
}
```

### **Backwards Compatibility**

```typescript
// Maintain backwards compatibility during migration
class CompatibilityService {
    private legacyService?: OldChatService;
    private modernService: UnifiedLanguageModelService;
    
    constructor() {
        this.modernService = new UnifiedLanguageModelService();
        
        // Keep legacy service for gradual migration
        if (this.hasLegacyConfig()) {
            this.legacyService = new OldChatService();
        }
    }
    
    async chat(...args) {
        // Prefer modern service, fallback to legacy
        if (await this.modernService.isAvailable()) {
            return await this.modernService.chat(...args);
        } else if (this.legacyService) {
            return await this.legacyService.chat(...args);
        }
        throw new Error('No chat service available');
    }
}
```

---

## 📈 **Monitoring & Analytics**

### **Usage Tracking**

```typescript
class AnalyticsService {
    trackProviderUsage(provider: string, model: string) {
        // Track which providers and models are most popular
        this.analytics.track('model_chat_started', {
            provider,
            model,
            timestamp: Date.now()
        });
    }
    
    trackProviderSwitch(from: string, to: string) {
        this.analytics.track('provider_switched', { from, to });
    }
    
    trackError(provider: string, error: string) {
        this.analytics.track('chat_error', { provider, error });
    }
}
```

### **Performance Monitoring**

```typescript
class PerformanceMonitor {
    async monitorChatPerformance<T>(
        operation: () => Promise<T>,
        metadata: { provider: string; model: string }
    ): Promise<T> {
        const startTime = performance.now();
        
        try {
            const result = await operation();
            
            this.recordMetric('chat_success', {
                ...metadata,
                duration: performance.now() - startTime
            });
            
            return result;
        } catch (error) {
            this.recordMetric('chat_error', {
                ...metadata,
                duration: performance.now() - startTime,
                error: error.message
            });
            throw error;
        }
    }
}
```

---

## 🎊 **Summary**

This implementation provides:

1. **🏗️ Clean Architecture**: Abstract provider pattern for easy extension
2. **🔄 Dynamic Provider Switching**: Runtime switching between local and cloud models
3. **📱 Responsive UI**: Interface adapts to selected provider
4. **🧩 Modular Design**: Easy to extract and reuse in other extensions
5. **🔒 Security**: Proper permission handling and error management
6. **⚡ Performance**: Efficient streaming and lazy loading
7. **🧪 Testable**: Clear separation of concerns enables comprehensive testing

The VS Code Language Model API integration is production-ready and can be easily modularized into a reusable component for your other VS Code extensions!