# VS Code Language Model Provider - Production Integration Guide

## 🎯 **Executive Summary**

This guide shows how to extract the VS Code Language Model API integration from this proof-of-concept into a **reusable, production-ready component** for your VS Code extensions.

---

## 🧩 **Package Structure for Modularization**

### **Recommended NPM Package: `@yourcompany/vscode-lm-provider`**

```
@yourcompany/vscode-lm-provider/
├── src/
│   ├── index.ts                    # Main exports & convenience functions
│   ├── providers/
│   │   ├── base.ts                # Abstract LanguageModelProvider class
│   │   ├── vscode-lm.ts          # VS Code Language Model implementation
│   │   └── unified.ts            # Multi-provider orchestration service
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces & types
│   ├── utils/
│   │   ├── streaming.ts          # Streaming utilities
│   │   └── errors.ts             # Error handling utilities
│   └── __tests__/
│       ├── providers/            # Unit tests for providers
│       └── integration/          # Integration tests
├── dist/                         # Compiled JavaScript
├── package.json
├── tsconfig.json
├── README.md
└── CHANGELOG.md
```

---

## 📦 **Core Package Implementation**

### **1. Main Entry Point (`src/index.ts`)**

```typescript
// Export all public APIs
export { LanguageModelProvider } from './providers/base';
export { VSCodeLanguageModelProvider } from './providers/vscode-lm';
export { UnifiedLanguageModelService } from './providers/unified';
export * from './types';

// Convenience factory functions
export function createVSCodeLanguageModelProvider(): VSCodeLanguageModelProvider {
    return new VSCodeLanguageModelProvider();
}

export function createUnifiedService(): UnifiedLanguageModelService {
    return new UnifiedLanguageModelService();
}

// Utility functions for quick integration
export async function detectVSCodeLanguageModels(): Promise<boolean> {
    const provider = new VSCodeLanguageModelProvider();
    return await provider.isAvailable();
}

export async function getAvailableVSCodeModels(): Promise<LanguageModel[]> {
    const provider = new VSCodeLanguageModelProvider();
    if (await provider.isAvailable()) {
        return await provider.getAvailableModels();
    }
    return [];
}
```

### **2. Type Definitions (`src/types/index.ts`)**

```typescript
export interface LanguageModel {
    name: string;
    provider: string;
    id?: string;
    family?: string;
    vendor?: string;
    capabilities?: ModelCapabilities;
}

export interface ModelCapabilities {
    supportsStreaming: boolean;
    maxTokens?: number;
    contextWindow?: number;
}

export interface StreamingCallback {
    (chunk: string): void;
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ProviderInfo {
    type: string;
    name: string;
    description: string;
    available: boolean;
    capabilities: ProviderCapabilities;
}

export interface ProviderCapabilities {
    supportsStreaming: boolean;
    requiresAuth: boolean;
    isLocal: boolean;
    hasQuotas: boolean;
}

export type ProviderType = 'vscode-lm' | 'ollama' | 'openai' | 'anthropic' | string;
```

### **3. Abstract Base Provider (`src/providers/base.ts`)**

```typescript
import * as vscode from 'vscode';
import { LanguageModel, ChatMessage, StreamingCallback, ProviderCapabilities } from '../types';

export abstract class LanguageModelProvider {
    abstract getProviderType(): string;
    abstract getProviderName(): string;
    abstract getProviderDescription(): string;
    abstract getCapabilities(): ProviderCapabilities;
    
    abstract getAvailableModels(): Promise<LanguageModel[]>;
    abstract isAvailable(): Promise<boolean>;
    
    abstract chat(
        messages: ChatMessage[], 
        model: string,
        onStream: StreamingCallback,
        cancellationToken: vscode.CancellationToken,
        options?: ChatOptions
    ): Promise<void>;
    
    // Optional hooks for lifecycle management
    async initialize?(): Promise<void>;
    async cleanup?(): Promise<void>;
    
    // Optional configuration methods
    setConfiguration?(config: Record<string, any>): void;
    getConfiguration?(): Record<string, any>;
}

export interface ChatOptions {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    [key: string]: any;
}
```

### **4. VS Code LM Provider (`src/providers/vscode-lm.ts`)**

```typescript
import * as vscode from 'vscode';
import { LanguageModelProvider } from './base';
import { LanguageModel, ChatMessage, StreamingCallback, ProviderCapabilities, ChatOptions } from '../types';

export class VSCodeLanguageModelProvider extends LanguageModelProvider {
    private static readonly SUPPORTED_MODELS = [
        { 
            name: 'GPT-4o', 
            id: 'gpt-4o', 
            family: 'gpt-4o', 
            vendor: 'copilot',
            capabilities: { supportsStreaming: true, maxTokens: 128000, contextWindow: 128000 }
        },
        { 
            name: 'GPT-4o-mini', 
            id: 'gpt-4o-mini', 
            family: 'gpt-4o-mini', 
            vendor: 'copilot',
            capabilities: { supportsStreaming: true, maxTokens: 128000, contextWindow: 128000 }
        },
        { 
            name: 'Claude 3.5 Sonnet', 
            id: 'claude-3.5-sonnet', 
            family: 'claude-3.5-sonnet', 
            vendor: 'copilot',
            capabilities: { supportsStreaming: true, maxTokens: 200000, contextWindow: 200000 }
        },
        { 
            name: 'o1-preview', 
            id: 'o1-preview', 
            family: 'o1-preview', 
            vendor: 'copilot',
            capabilities: { supportsStreaming: false, maxTokens: 32768, contextWindow: 128000 }
        }
    ];
    
    getProviderType(): string { return 'vscode-lm'; }
    getProviderName(): string { return 'VS Code Language Models'; }
    getProviderDescription(): string { return 'GitHub Copilot powered models (requires subscription)'; }
    
    getCapabilities(): ProviderCapabilities {
        return {
            supportsStreaming: true,
            requiresAuth: true,
            isLocal: false,
            hasQuotas: true
        };
    }

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
                        provider: this.getProviderType(),
                        id: modelInfo.id,
                        family: modelInfo.family,
                        vendor: modelInfo.vendor,
                        capabilities: modelInfo.capabilities
                    });
                }
            } catch (error) {
                // Model not available - continue silently
                console.debug(`VS Code LM model ${modelInfo.name} not available:`, error);
            }
        }
        
        return availableModels;
    }

    async isAvailable(): Promise<boolean> {
        try {
            const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
            return models.length > 0;
        } catch (error) {
            return false;
        }
    }

    async chat(
        messages: ChatMessage[], 
        model: string,
        onStream: StreamingCallback,
        cancellationToken: vscode.CancellationToken,
        options: ChatOptions = {}
    ): Promise<void> {
        const modelInfo = VSCodeLanguageModelProvider.SUPPORTED_MODELS.find(
            m => m.name === model || m.id === model
        );
        
        if (!modelInfo) {
            throw new Error(`Model ${model} not supported by VS Code Language Models provider`);
        }

        const models = await vscode.lm.selectChatModels({
            vendor: modelInfo.vendor,
            family: modelInfo.family
        });

        if (models.length === 0) {
            throw new Error(`Model ${model} not available. Please check your GitHub Copilot subscription.`);
        }

        const selectedModel = models[0];

        // Convert messages to VS Code format
        const vscodeMessages: vscode.LanguageModelChatMessage[] = messages.map(msg => {
            if (msg.role === 'user' || msg.role === 'system') {
                return vscode.LanguageModelChatMessage.User(msg.content);
            } else {
                return vscode.LanguageModelChatMessage.Assistant(msg.content);
            }
        });

        // Add system prompt if provided in options
        if (options.systemPrompt) {
            vscodeMessages.unshift(vscode.LanguageModelChatMessage.User(options.systemPrompt));
        }

        try {
            const chatResponse = await selectedModel.sendRequest(
                vscodeMessages,
                {
                    // VS Code LM API doesn't currently support temperature/maxTokens
                    // but we include the interface for future compatibility
                },
                cancellationToken
            );

            // Stream the response
            for await (const fragment of chatResponse.text) {
                if (cancellationToken.isCancellationRequested) {
                    break;
                }
                onStream(fragment);
            }
        } catch (error) {
            if (error instanceof vscode.LanguageModelError) {
                // Handle VS Code specific errors
                this.handleVSCodeError(error, onStream);
            } else {
                throw error;
            }
        }
    }

    private handleVSCodeError(error: vscode.LanguageModelError, onStream: StreamingCallback): void {
        let errorMessage = `Language Model Error: ${error.message}`;
        
        // Provide user-friendly error messages
        if (error.message.includes('permission') || error.message.includes('consent')) {
            errorMessage = 'Permission denied. Please ensure GitHub Copilot is enabled and you have given consent to use language models.';
        } else if (error.message.includes('blocked') || error.message.includes('policy')) {
            errorMessage = 'Request was blocked. The content might be against usage policies.';
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
            errorMessage = 'Rate limit or quota exceeded. Please try again later.';
        } else if (error.message.includes('not found') || error.message.includes('unavailable')) {
            errorMessage = 'The requested model is not available. Please try a different model.';
        }
        
        onStream(`\n\n[${errorMessage}]`);
    }
}
```

### **5. Unified Service (`src/providers/unified.ts`)**

```typescript
import * as vscode from 'vscode';
import { LanguageModelProvider } from './base';
import { LanguageModel, ChatMessage, StreamingCallback, ProviderInfo, ChatOptions } from '../types';

export class UnifiedLanguageModelService {
    private providers: Map<string, LanguageModelProvider> = new Map();
    private currentProvider?: string;

    constructor() {
        // Auto-register VS Code LM provider if available
        this.registerProvider('vscode-lm', new VSCodeLanguageModelProvider());
    }

    registerProvider(type: string, provider: LanguageModelProvider): void {
        this.providers.set(type, provider);
        
        // Set as current if first provider or if no current provider
        if (!this.currentProvider || this.providers.size === 1) {
            this.currentProvider = type;
        }
    }

    unregisterProvider(type: string): void {
        this.providers.delete(type);
        
        // Switch to another provider if current one was removed
        if (this.currentProvider === type) {
            this.currentProvider = this.providers.keys().next().value;
        }
    }

    getCurrentProvider(): string | undefined {
        return this.currentProvider;
    }

    setCurrentProvider(type: string): void {
        if (this.providers.has(type)) {
            this.currentProvider = type;
        } else {
            throw new Error(`Provider ${type} not registered`);
        }
    }

    getRegisteredProviders(): string[] {
        return Array.from(this.providers.keys());
    }

    async getAvailableProviders(): Promise<ProviderInfo[]> {
        const results: ProviderInfo[] = [];
        
        for (const [type, provider] of this.providers) {
            const available = await provider.isAvailable();
            results.push({
                type,
                name: provider.getProviderName(),
                description: provider.getProviderDescription(),
                available,
                capabilities: provider.getCapabilities()
            });
        }
        
        return results;
    }

    async getAvailableModels(providerType?: string): Promise<LanguageModel[]> {
        const targetProvider = providerType || this.currentProvider;
        
        if (!targetProvider) {
            return [];
        }

        const provider = this.providers.get(targetProvider);
        if (!provider) {
            throw new Error(`Provider ${targetProvider} not found`);
        }

        return await provider.getAvailableModels();
    }

    async getAllAvailableModels(): Promise<{ provider: string; models: LanguageModel[] }[]> {
        const results: { provider: string; models: LanguageModel[] }[] = [];
        
        for (const [type, provider] of this.providers) {
            try {
                if (await provider.isAvailable()) {
                    const models = await provider.getAvailableModels();
                    results.push({ provider: type, models });
                }
            } catch (error) {
                console.warn(`Failed to get models from provider ${type}:`, error);
                results.push({ provider: type, models: [] });
            }
        }
        
        return results;
    }

    async chat(
        messages: ChatMessage[], 
        model: string,
        onStream: StreamingCallback,
        cancellationToken: vscode.CancellationToken,
        options: ChatOptions = {},
        providerType?: string
    ): Promise<void> {
        const targetProvider = providerType || this.currentProvider;
        
        if (!targetProvider) {
            throw new Error('No provider selected');
        }

        const provider = this.providers.get(targetProvider);
        if (!provider) {
            throw new Error(`Provider ${targetProvider} not found`);
        }

        return await provider.chat(messages, model, onStream, cancellationToken, options);
    }

    async isProviderAvailable(providerType?: string): Promise<boolean> {
        const targetProvider = providerType || this.currentProvider;
        
        if (!targetProvider) {
            return false;
        }

        const provider = this.providers.get(targetProvider);
        if (!provider) {
            return false;
        }

        return await provider.isAvailable();
    }

    // Utility method for automatic provider selection
    async selectBestAvailableProvider(): Promise<string | null> {
        const providers = await this.getAvailableProviders();
        const availableProviders = providers.filter(p => p.available);
        
        if (availableProviders.length === 0) {
            return null;
        }

        // Priority order: local providers first, then cloud providers
        const priorityOrder = ['ollama', 'vscode-lm', 'openai', 'anthropic'];
        
        for (const priority of priorityOrder) {
            const found = availableProviders.find(p => p.type === priority);
            if (found) {
                this.setCurrentProvider(found.type);
                return found.type;
            }
        }

        // Fallback to first available
        this.setCurrentProvider(availableProviders[0].type);
        return availableProviders[0].type;
    }
}

// Re-export VS Code provider for convenience
import { VSCodeLanguageModelProvider } from './vscode-lm';
export { VSCodeLanguageModelProvider };
```

---

## 🔌 **Integration in Production Extensions**

### **1. Package Installation**

```bash
npm install @yourcompany/vscode-lm-provider
```

### **2. Basic Integration**

```typescript
// src/extension.ts
import { 
    UnifiedLanguageModelService, 
    VSCodeLanguageModelProvider,
    createUnifiedService 
} from '@yourcompany/vscode-lm-provider';

export async function activate(context: vscode.ExtensionContext) {
    // Create the unified service
    const languageModelService = createUnifiedService();
    
    // Add your existing providers
    if (hasOllamaConfig()) {
        languageModelService.registerProvider('ollama', new YourOllamaProvider());
    }
    
    if (hasOpenAIConfig()) {
        languageModelService.registerProvider('openai', new YourOpenAIProvider());
    }
    
    // VS Code Language Models are auto-registered
    
    // Select best available provider
    await languageModelService.selectBestAvailableProvider();
    
    // Initialize your chat interface
    const chatProvider = new YourChatProvider(context, languageModelService);
    
    // Register commands for provider switching
    const switchProviderCommand = vscode.commands.registerCommand(
        'yourext.switchProvider', 
        () => showProviderSelector(languageModelService)
    );
    
    context.subscriptions.push(switchProviderCommand);
}

async function showProviderSelector(service: UnifiedLanguageModelService) {
    const providers = await service.getAvailableProviders();
    const items = providers
        .filter(p => p.available)
        .map(p => ({
            label: p.name,
            description: p.description,
            detail: p.capabilities.isLocal ? '🏠 Local' : '☁️ Cloud',
            type: p.type
        }));
    
    const selected = await vscode.window.showQuickPick(items);
    if (selected) {
        service.setCurrentProvider(selected.type);
        vscode.window.showInformationMessage(`Switched to ${selected.label}`);
    }
}
```

### **3. Advanced Integration with Custom UI**

```typescript
// src/chatProvider.ts
import { UnifiedLanguageModelService, LanguageModel } from '@yourcompany/vscode-lm-provider';

export class YourChatProvider {
    private panel?: vscode.WebviewPanel;
    
    constructor(
        private context: vscode.ExtensionContext,
        private languageService: UnifiedLanguageModelService
    ) {}
    
    async showChatInterface() {
        if (!this.panel) {
            this.panel = this.createWebviewPanel();
        }
        
        // Load models from current provider
        await this.refreshModels();
        this.panel.reveal();
    }
    
    private async refreshModels() {
        try {
            const models = await this.languageService.getAvailableModels();
            const currentProvider = this.languageService.getCurrentProvider();
            
            this.panel?.webview.postMessage({
                command: 'updateModels',
                models: models.map(m => ({
                    name: m.name,
                    provider: m.provider,
                    capabilities: m.capabilities
                })),
                currentProvider
            });
        } catch (error) {
            this.panel?.webview.postMessage({
                command: 'showError',
                message: `Failed to load models: ${error}`
            });
        }
    }
    
    private async handleChatMessage(message: any) {
        const { model, messages } = message;
        
        try {
            let response = '';
            const cancellationToken = new vscode.CancellationTokenSource();
            
            await this.languageService.chat(
                messages,
                model,
                (chunk) => {
                    response += chunk;
                    this.panel?.webview.postMessage({
                        command: 'streamChunk',
                        chunk
                    });
                },
                cancellationToken.token,
                {
                    temperature: 0.7,
                    systemPrompt: 'You are a helpful coding assistant.'
                }
            );
            
        } catch (error) {
            this.panel?.webview.postMessage({
                command: 'showError',
                message: `Chat error: ${error}`
            });
        }
    }
}
```

### **4. Configuration Management**

```typescript
// src/config.ts
interface LanguageModelConfig {
    defaultProvider?: string;
    providers: {
        [key: string]: {
            enabled: boolean;
            settings: Record<string, any>;
        };
    };
}

export class ConfigManager {
    private config: vscode.WorkspaceConfiguration;
    
    constructor() {
        this.config = vscode.workspace.getConfiguration('yourext.languageModels');
    }
    
    getDefaultProvider(): string | undefined {
        return this.config.get<string>('defaultProvider');
    }
    
    isProviderEnabled(provider: string): boolean {
        return this.config.get<boolean>(`providers.${provider}.enabled`, false);
    }
    
    getProviderSettings(provider: string): Record<string, any> {
        return this.config.get<Record<string, any>>(`providers.${provider}.settings`, {});
    }
    
    async updateDefaultProvider(provider: string): Promise<void> {
        await this.config.update('defaultProvider', provider, vscode.ConfigurationTarget.Workspace);
    }
}
```

---

## 📊 **Production Considerations**

### **1. Error Handling & User Experience**

```typescript
// Enhanced error handling for production
class ProductionLanguageModelService extends UnifiedLanguageModelService {
    private errorReporting: ErrorReportingService;
    private analytics: AnalyticsService;
    
    async chat(messages, model, onStream, cancellationToken, options) {
        const startTime = Date.now();
        const provider = this.getCurrentProvider();
        
        try {
            this.analytics.trackChatStart(provider, model);
            
            await super.chat(messages, model, onStream, cancellationToken, options);
            
            this.analytics.trackChatSuccess(provider, model, Date.now() - startTime);
            
        } catch (error) {
            this.analytics.trackChatError(provider, model, error.message);
            
            // Attempt fallback to another provider
            const fallbackProvider = await this.selectFallbackProvider(provider);
            if (fallbackProvider) {
                vscode.window.showWarningMessage(
                    `${provider} failed, switching to ${fallbackProvider}`
                );
                await this.chat(messages, model, onStream, cancellationToken, options);
                return;
            }
            
            // Report error for monitoring
            this.errorReporting.reportError(error, { provider, model, userId: this.getUserId() });
            
            throw error;
        }
    }
    
    private async selectFallbackProvider(failedProvider: string): Promise<string | null> {
        const available = await this.getAvailableProviders();
        const alternatives = available
            .filter(p => p.available && p.type !== failedProvider)
            .sort((a, b) => {
                // Prefer local providers for fallback
                if (a.capabilities.isLocal && !b.capabilities.isLocal) return -1;
                if (!a.capabilities.isLocal && b.capabilities.isLocal) return 1;
                return 0;
            });
        
        if (alternatives.length > 0) {
            this.setCurrentProvider(alternatives[0].type);
            return alternatives[0].type;
        }
        
        return null;
    }
}
```

### **2. Performance Optimization**

```typescript
// Caching and performance optimization
class CachedLanguageModelService extends UnifiedLanguageModelService {
    private modelCache = new Map<string, { models: LanguageModel[]; expiry: number }>();
    private availabilityCache = new Map<string, { available: boolean; expiry: number }>();
    
    async getAvailableModels(providerType?: string): Promise<LanguageModel[]> {
        const provider = providerType || this.getCurrentProvider();
        if (!provider) return [];
        
        const cacheKey = provider;
        const cached = this.modelCache.get(cacheKey);
        
        // Return cached result if not expired (5 minutes)
        if (cached && cached.expiry > Date.now()) {
            return cached.models;
        }
        
        // Fetch fresh data
        const models = await super.getAvailableModels(providerType);
        this.modelCache.set(cacheKey, {
            models,
            expiry: Date.now() + 5 * 60 * 1000 // 5 minutes
        });
        
        return models;
    }
    
    async isProviderAvailable(providerType?: string): Promise<boolean> {
        const provider = providerType || this.getCurrentProvider();
        if (!provider) return false;
        
        const cached = this.availabilityCache.get(provider);
        
        // Return cached result if not expired (1 minute)
        if (cached && cached.expiry > Date.now()) {
            return cached.available;
        }
        
        const available = await super.isProviderAvailable(providerType);
        this.availabilityCache.set(provider, {
            available,
            expiry: Date.now() + 60 * 1000 // 1 minute
        });
        
        return available;
    }
    
    clearCache(): void {
        this.modelCache.clear();
        this.availabilityCache.clear();
    }
}
```

### **3. Testing Infrastructure**

```typescript
// Testing utilities
export class MockLanguageModelProvider extends LanguageModelProvider {
    constructor(private config: MockProviderConfig) {
        super();
    }
    
    getProviderType() { return 'mock'; }
    getProviderName() { return 'Mock Provider'; }
    getProviderDescription() { return 'Test provider for development'; }
    
    getCapabilities() {
        return {
            supportsStreaming: true,
            requiresAuth: false,
            isLocal: true,
            hasQuotas: false
        };
    }
    
    async getAvailableModels(): Promise<LanguageModel[]> {
        return this.config.models || [];
    }
    
    async isAvailable(): Promise<boolean> {
        return this.config.available ?? true;
    }
    
    async chat(messages, model, onStream, cancellationToken) {
        // Simulate streaming response
        const response = this.config.responses[model] || 'Mock response';
        const chunks = response.split(' ');
        
        for (const chunk of chunks) {
            if (cancellationToken.isCancellationRequested) break;
            
            onStream(chunk + ' ');
            await new Promise(resolve => setTimeout(resolve, 50)); // Simulate delay
        }
    }
}

interface MockProviderConfig {
    available?: boolean;
    models?: LanguageModel[];
    responses: Record<string, string>;
}

// Test utilities
export function createTestLanguageModelService(config: MockProviderConfig): UnifiedLanguageModelService {
    const service = new UnifiedLanguageModelService();
    service.registerProvider('mock', new MockLanguageModelProvider(config));
    service.setCurrentProvider('mock');
    return service;
}
```

---

## 🚀 **Deployment Strategy**

### **1. Gradual Rollout**

```typescript
// Feature flags for gradual rollout
class FeatureFlaggedService extends UnifiedLanguageModelService {
    private featureFlags: FeatureFlagService;
    
    async isProviderEnabled(providerType: string): Promise<boolean> {
        const flag = `language-model-${providerType}-enabled`;
        return await this.featureFlags.isEnabled(flag);
    }
    
    async getAvailableProviders(): Promise<ProviderInfo[]> {
        const allProviders = await super.getAvailableProviders();
        
        // Filter based on feature flags
        const enabledProviders: ProviderInfo[] = [];
        for (const provider of allProviders) {
            if (await this.isProviderEnabled(provider.type)) {
                enabledProviders.push(provider);
            }
        }
        
        return enabledProviders;
    }
}
```

### **2. Monitoring & Alerting**

```typescript
// Production monitoring
interface LanguageModelMetrics {
    provider: string;
    model: string;
    duration: number;
    success: boolean;
    error?: string;
    userId: string;
    timestamp: number;
}

class MetricsCollector {
    private metrics: LanguageModelMetrics[] = [];
    
    recordChatMetric(metric: LanguageModelMetrics) {
        this.metrics.push(metric);
        
        // Send to analytics service
        this.sendToAnalytics(metric);
        
        // Check for error patterns
        this.checkErrorPatterns(metric);
    }
    
    private checkErrorPatterns(metric: LanguageModelMetrics) {
        if (!metric.success) {
            const recentErrors = this.metrics
                .filter(m => 
                    m.provider === metric.provider && 
                    !m.success && 
                    m.timestamp > Date.now() - 5 * 60 * 1000 // Last 5 minutes
                )
                .length;
            
            // Alert if error rate is high
            if (recentErrors > 5) {
                this.sendAlert(`High error rate for provider ${metric.provider}: ${recentErrors} errors in 5 minutes`);
            }
        }
    }
}
```

---

## 🎊 **Summary: Ready for Production**

This modular design provides:

1. **🧩 Drop-in Integration**: Add to any VS Code extension with minimal changes
2. **🔄 Provider Agnostic**: Support multiple language model providers seamlessly  
3. **🛡️ Production Ready**: Error handling, caching, monitoring, and testing built-in
4. **📈 Scalable**: Easy to add new providers and features
5. **🎯 User Focused**: Automatic provider selection and graceful fallbacks
6. **🔒 Secure**: Proper permission handling and error isolation
7. **📊 Observable**: Built-in metrics and monitoring capabilities

**Installation in your production extension:**
```bash
npm install @yourcompany/vscode-lm-provider
```

**Basic integration:**
```typescript
import { createUnifiedService } from '@yourcompany/vscode-lm-provider';

const service = createUnifiedService();
// VS Code Language Models are automatically available!
```

The implementation is **production-ready** and can be easily extracted into a reusable NPM package for use across all your VS Code extensions! 🚀