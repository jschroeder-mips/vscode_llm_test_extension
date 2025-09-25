import axios, { AxiosResponse } from 'axios';
import * as vscode from 'vscode';
import { LanguageModelProvider, LanguageModel, ChatMessage, StreamingCallback, ChatOptions } from './languageModelProvider';

export interface OllamaModel {
    name: string;
    modified_at: string;
    size: number;
    digest: string;
}

export interface ChatResponse {
    model: string;
    created_at: string;
    message: ChatMessage;
    done: boolean;
}

export interface ChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: ChatMessage;
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export class OllamaLanguageModelProvider extends LanguageModelProvider {
    private baseURL = 'http://localhost:11434';
    private models: OllamaModel[] = [];

    async getAvailableModels(): Promise<LanguageModel[]> {
        try {
            await this.refreshModels();
            return this.models.map(model => ({
                name: model.name,
                provider: 'ollama' as const
            }));
        } catch (error) {
            console.error('Error getting Ollama models:', error);
            return [];
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            console.log('Checking Ollama availability...');
            const response = await axios.get(`${this.baseURL}/api/tags`, {
                timeout: 8000 // Increased timeout
            });
            console.log('Ollama available:', response.status === 200);
            return response.status === 200;
        } catch (error) {
            console.log('Ollama not available:', error);
            // Don't completely fail if there's a temporary network issue
            return false;
        }
    }

    async chat(
        messages: ChatMessage[], 
        model: string,
        onStream: StreamingCallback,
        cancellationToken: vscode.CancellationToken,
        options?: ChatOptions
    ): Promise<void> {
        try {
            console.log('OllamaLanguageModelProvider: Starting chat with model:', model);
            console.log('Messages:', messages);

            const response = await axios.post(
                `${this.baseURL}/v1/chat/completions`,
                {
                    model: model,
                    messages: messages,
                    stream: true,
                    temperature: 0.7,
                    max_tokens: -1
                },
                {
                    responseType: 'stream',
                    timeout: 120000, // 2 minutes like original
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );

            return new Promise((resolve, reject) => {
                let buffer = '';
                let fullResponse = '';

                response.data.on('data', (chunk: Buffer) => {
                    if (cancellationToken.isCancellationRequested) {
                        resolve();
                        return;
                    }

                    const chunkStr = chunk.toString();
                    buffer += chunkStr;
                    
                    // Process complete lines (using '\n' not '\\n')
                    let lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep incomplete line in buffer

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (trimmedLine === '') continue;
                        
                        // Handle Server-Sent Events format
                        let jsonStr = trimmedLine;
                        if (jsonStr.startsWith('data: ')) {
                            jsonStr = jsonStr.substring(6).trim();
                        }
                        
                        // Check for end marker
                        if (jsonStr === '[DONE]') {
                            resolve();
                            return;
                        }

                        try {
                            const data = JSON.parse(jsonStr);
                            // Handle both streaming chunk format and regular format
                            if (data.choices && data.choices[0]) {
                                const choice = data.choices[0];
                                let content = '';
                                
                                // Check for streaming format (delta.content)
                                if (choice.delta && choice.delta.content) {
                                    content = choice.delta.content;
                                }
                                // Check for regular format (message.content)
                                else if (choice.message && choice.message.content) {
                                    content = choice.message.content;
                                }
                                
                                if (content) {
                                    fullResponse += content;
                                    onStream(content);
                                }
                                
                                // Check if this is the final chunk
                                if (choice.finish_reason === 'stop') {
                                    resolve();
                                    return;
                                }
                            }
                        } catch (parseError) {
                            console.warn('Failed to parse streaming chunk:', jsonStr, parseError);
                        }
                    }
                });

                response.data.on('end', () => {
                    console.log('OllamaLanguageModelProvider: Stream ended');
                    resolve();
                });

                response.data.on('error', (error: Error) => {
                    console.error('OllamaLanguageModelProvider: Stream error:', error);
                    onStream(`\n\n[Stream error: ${error.message}]`);
                    reject(error);
                });
            });

        } catch (error) {
            console.error('OllamaLanguageModelProvider: Chat error:', error);
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNREFUSED') {
                    onStream('\n\n[Error: Cannot connect to Ollama. Please ensure Ollama is running on localhost:11434]');
                } else if (error.response?.status === 404) {
                    onStream(`\n\n[Error: Model "${model}" not found. Please ensure the model is installed in Ollama]`);
                } else {
                    onStream(`\n\n[Error: ${error.message}]`);
                }
            } else {
                onStream(`\n\n[Error: ${error}]`);
            }
        }
    }

    getProviderName(): string {
        return 'Ollama';
    }

    getProviderDescription(): string {
        return 'Local Ollama models (privacy-focused, works offline)';
    }

    // Legacy methods for backward compatibility
    async refreshModels(): Promise<void> {
        try {
            const response: AxiosResponse<{ models: OllamaModel[] }> = await axios.get(
                `${this.baseURL}/api/tags`
            );
            this.models = response.data.models || [];
        } catch (error) {
            console.error('Error fetching Ollama models:', error);
            this.models = [];
        }
    }

    getModels(): OllamaModel[] {
        return this.models;
    }

    async isOllamaAvailable(): Promise<boolean> {
        return this.isAvailable();
    }
}