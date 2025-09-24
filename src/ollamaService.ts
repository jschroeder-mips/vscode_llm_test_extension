import axios, { AxiosResponse } from 'axios';

export interface OllamaModel {
    name: string;
    modified_at: string;
    size: number;
    digest: string;
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
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

export class OllamaService {
    private readonly baseUrl = 'http://localhost:11434';
    private models: OllamaModel[] = [];

    constructor() {}

    /**
     * Check if Ollama is available and running
     */
    async isOllamaAvailable(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get all available models from Ollama
     */
    async getModels(): Promise<OllamaModel[]> {
        try {
            const response: AxiosResponse<{ models: OllamaModel[] }> = await axios.get(
                `${this.baseUrl}/api/tags`,
                { timeout: 10000 }
            );
            this.models = response.data.models || [];
            return this.models;
        } catch (error) {
            console.error('Error fetching models:', error);
            throw new Error('Failed to fetch models from Ollama. Make sure Ollama is running.');
        }
    }

    /**
     * Refresh the models cache
     */
    async refreshModels(): Promise<void> {
        await this.getModels();
    }

    /**
     * Chat with a model using OpenAI-compatible API
     */
    async chat(
        model: string,
        messages: ChatMessage[],
        onChunk?: (content: string) => void
    ): Promise<string> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/v1/chat/completions`,
                {
                    model,
                    messages,
                    stream: !!onChunk,
                    temperature: 0.7,
                    max_tokens: -1
                },
                {
                    timeout: 120000, // 2 minutes
                    responseType: onChunk ? 'stream' : 'json',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );

            if (onChunk) {
                // Handle streaming response
                return new Promise((resolve, reject) => {
                    let fullResponse = '';
                    let buffer = '';

                    response.data.on('data', (chunk: Buffer) => {
                        const chunkStr = chunk.toString();
                        buffer += chunkStr;
                        
                        // Process complete lines (fix: use '\n' not '\\n')
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
                                resolve(fullResponse);
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
                                        onChunk(content);
                                    }
                                    
                                    // Check if this is the final chunk
                                    if (choice.finish_reason === 'stop') {
                                        resolve(fullResponse);
                                        return;
                                    }
                                }
                            } catch (e) {
                                // Log parsing errors for debugging
                                console.warn('Failed to parse streaming chunk:', jsonStr, e);
                            }
                        }
                    });

                    response.data.on('end', () => {
                        resolve(fullResponse);
                    });

                    response.data.on('error', (error: Error) => {
                        console.error('Streaming error:', error);
                        reject(error);
                    });
                    
                    // Add timeout handling
                    const timeout = setTimeout(() => {
                        reject(new Error('Streaming response timeout'));
                    }, 120000); // 2 minutes
                    
                    response.data.on('end', () => {
                        clearTimeout(timeout);
                        resolve(fullResponse);
                    });
                });
            } else {
                // Handle non-streaming response
                const data: ChatCompletionResponse = response.data;
                return data.choices[0]?.message?.content || '';
            }
        } catch (error) {
            console.error('Error chatting with model:', error);
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNREFUSED') {
                    throw new Error('Cannot connect to Ollama. Make sure Ollama is running on localhost:11434.');
                } else if (error.response?.status === 404) {
                    throw new Error(`Model "${model}" not found. Please pull the model first using: ollama pull ${model}`);
                }
            }
            throw new Error('Failed to chat with the model. Please try again.');
        }
    }

    /**
     * Get cached models
     */
    getCachedModels(): OllamaModel[] {
        return this.models;
    }
}