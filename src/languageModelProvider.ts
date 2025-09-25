import * as vscode from 'vscode';

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

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
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