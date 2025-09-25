import * as vscode from 'vscode';
import { LanguageModelProvider, LanguageModel, ChatMessage, StreamingCallback } from './languageModelProvider';
import { OllamaLanguageModelProvider } from './ollamaLanguageModelProvider';
import { VSCodeLanguageModelProvider } from './vscodeLanguageModelProvider';

export type ProviderType = 'ollama' | 'vscode-lm';

export class UnifiedLanguageModelService {
    private ollamaProvider: OllamaLanguageModelProvider;
    private vscodeProvider: VSCodeLanguageModelProvider;
    private currentProvider: ProviderType = 'ollama';

    constructor() {
        this.ollamaProvider = new OllamaLanguageModelProvider();
        this.vscodeProvider = new VSCodeLanguageModelProvider();
    }

    getCurrentProvider(): ProviderType {
        return this.currentProvider;
    }

    setProvider(provider: ProviderType): void {
        this.currentProvider = provider;
    }

    private getActiveProvider(): LanguageModelProvider {
        return this.currentProvider === 'ollama' ? this.ollamaProvider : this.vscodeProvider;
    }

    async getAvailableProviders(): Promise<{ type: ProviderType; name: string; description: string; available: boolean }[]> {
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

    async getAvailableModels(): Promise<LanguageModel[]> {
        return await this.getActiveProvider().getAvailableModels();
    }

    async getAllAvailableModels(): Promise<{ provider: ProviderType; models: LanguageModel[] }[]> {
        const results = await Promise.allSettled([
            this.ollamaProvider.getAvailableModels(),
            this.vscodeProvider.getAvailableModels()
        ]);

        return [
            {
                provider: 'ollama',
                models: results[0].status === 'fulfilled' ? results[0].value : []
            },
            {
                provider: 'vscode-lm',
                models: results[1].status === 'fulfilled' ? results[1].value : []
            }
        ];
    }

    async isCurrentProviderAvailable(): Promise<boolean> {
        return await this.getActiveProvider().isAvailable();
    }

    async chat(
        messages: ChatMessage[], 
        model: string,
        onStream: StreamingCallback,
        cancellationToken: vscode.CancellationToken
    ): Promise<void> {
        return await this.getActiveProvider().chat(messages, model, onStream, cancellationToken);
    }

    // Legacy methods for backward compatibility with existing code
    async refreshModels(): Promise<void> {
        if (this.currentProvider === 'ollama') {
            await this.ollamaProvider.refreshModels();
        }
        // VS Code LM models are automatically refreshed
    }

    getModels(): any[] {
        if (this.currentProvider === 'ollama') {
            return this.ollamaProvider.getModels();
        }
        return [];
    }

    async isOllamaAvailable(): Promise<boolean> {
        return await this.ollamaProvider.isAvailable();
    }

    // Convenience methods for specific providers
    getOllamaProvider(): OllamaLanguageModelProvider {
        return this.ollamaProvider;
    }

    getVSCodeProvider(): VSCodeLanguageModelProvider {
        return this.vscodeProvider;
    }
}