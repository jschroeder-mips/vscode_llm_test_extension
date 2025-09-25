import * as vscode from 'vscode';
import { LanguageModelProvider, LanguageModel, ChatMessage, StreamingCallback } from './languageModelProvider';

// Default system prompt for VS Code Language Model interactions
const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant integrated into Visual Studio Code. You provide accurate, concise, and practical assistance with coding, development tasks, and technical questions. Focus on being clear and actionable in your responses.`;

export class VSCodeLanguageModelProvider extends LanguageModelProvider {
    private static readonly SUPPORTED_MODELS = [
        { name: 'GPT-4o', id: 'gpt-4o', family: 'gpt-4o', vendor: 'copilot' },
        { name: 'GPT-4o-mini', id: 'gpt-4o-mini', family: 'gpt-4o-mini', vendor: 'copilot' },
        { name: 'GPT-5-mini', id: 'gpt-5-mini', family: 'gpt-5-mini', vendor: 'copilot' },
        { name: 'o1', id: 'o1', family: 'o1', vendor: 'copilot' },
        { name: 'o1-mini', id: 'o1-mini', family: 'o1-mini', vendor: 'copilot' },
        { name: 'Claude 3.5 Sonnet', id: 'claude-3.5-sonnet', family: 'claude-3.5-sonnet', vendor: 'copilot' }
    ];

    async getAvailableModels(): Promise<LanguageModel[]> {
        try {
            const availableModels: LanguageModel[] = [];
            
            // Check each supported model to see if it's available
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
                    // Model not available, continue to next
                    console.log(`Model ${modelInfo.name} not available:`, error);
                }
            }
            
            return availableModels;
        } catch (error) {
            console.error('Error getting VS Code language models:', error);
            return [];
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            // Try to get any available model to test if the API is accessible
            console.log('Checking VS Code Language Model availability...');
            const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
            console.log('VS Code LM models found:', models.length);
            return models.length > 0;
        } catch (error) {
            console.log('VS Code LM not available:', error);
            return false;
        }
    }

    async chat(
        messages: ChatMessage[], 
        model: string,
        onStream: StreamingCallback,
        cancellationToken: vscode.CancellationToken,
        options?: { systemPrompt?: string; temperature?: number; maxTokens?: number; }
    ): Promise<void> {
        try {
            // Find the model info
            const modelInfo = VSCodeLanguageModelProvider.SUPPORTED_MODELS.find(
                m => m.name === model || m.id === model
            );
            
            if (!modelInfo) {
                throw new Error(`Model ${model} not found`);
            }

            // Select the model
            const models = await vscode.lm.selectChatModels({
                vendor: modelInfo.vendor,
                family: modelInfo.family
            });

            if (models.length === 0) {
                throw new Error(`Model ${model} not available`);
            }

            const selectedModel = models[0];

            // Convert messages to VS Code format
            // Note: VS Code LM API doesn't support system messages, so we'll prepend 
            // system instructions to the first user message as a workaround
            const vscodeMessages: vscode.LanguageModelChatMessage[] = [];
            let systemPrompt = '';
            
            // Combine system prompts from multiple sources:
            // 1. System messages in the conversation
            const systemMessages = messages.filter(msg => msg.role === 'system');
            if (systemMessages.length > 0) {
                systemPrompt += systemMessages.map(msg => msg.content).join('\n\n');
            }
            
            // 2. System prompt from options (takes priority/gets added)
            if (options?.systemPrompt) {
                systemPrompt = systemPrompt 
                    ? options.systemPrompt + '\n\n' + systemPrompt 
                    : options.systemPrompt;
            }
            
            // 3. Use default system prompt if no other system prompt is provided
            if (!systemPrompt) {
                systemPrompt = DEFAULT_SYSTEM_PROMPT;
            }
            
            if (systemPrompt) {
                systemPrompt += '\n\n';
            }
            
            // Process non-system messages
            const nonSystemMessages = messages.filter(msg => msg.role !== 'system');
            for (let i = 0; i < nonSystemMessages.length; i++) {
                const msg = nonSystemMessages[i];
                
                if (msg.role === 'user') {
                    // For the first user message, prepend system instructions
                    const content = (i === 0 && systemPrompt) 
                        ? systemPrompt + msg.content 
                        : msg.content;
                    vscodeMessages.push(vscode.LanguageModelChatMessage.User(content));
                } else {
                    vscodeMessages.push(vscode.LanguageModelChatMessage.Assistant(msg.content));
                }
            }

            // Send the request
            const chatResponse = await selectedModel.sendRequest(
                vscodeMessages,
                {},
                cancellationToken
            );

            // Stream the response
            try {
                for await (const fragment of chatResponse.text) {
                    if (cancellationToken.isCancellationRequested) {
                        break;
                    }
                    onStream(fragment);
                }
            } catch (streamError) {
                console.error('Error streaming response:', streamError);
                onStream(`\n\n[Error streaming response: ${streamError}]`);
            }

        } catch (error) {
            console.error('VS Code Language Model chat error:', error);
            
            if (error instanceof vscode.LanguageModelError) {
                let errorMessage = `Language Model Error: ${error.message}`;
                
                // Handle different error types based on the error message content
                if (error.message.includes('permission') || error.message.includes('consent')) {
                    errorMessage = 'Permission denied. Please ensure GitHub Copilot is enabled and you have given consent to use language models.';
                } else if (error.message.includes('blocked') || error.message.includes('policy')) {
                    errorMessage = 'Request was blocked. The content might be against usage policies.';
                } else if (error.message.includes('not found') || error.message.includes('unavailable')) {
                    errorMessage = 'The requested model was not found or is unavailable.';
                }
                
                onStream(`\n\n[${errorMessage}]`);
            } else {
                onStream(`\n\n[Error: ${error}]`);
            }
        }
    }

    getProviderName(): string {
        return 'VS Code Language Models';
    }

    getProviderDescription(): string {
        return 'GitHub Copilot powered models (requires Copilot subscription)';
    }
}