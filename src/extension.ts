import * as vscode from 'vscode';
import { OllamaChatProvider } from './ollamaChatProvider';
import { OllamaService } from './ollamaService';
import { OllamaSidebarProvider } from './ollamaSidebarProvider';

export function activate(context: vscode.ExtensionContext) {
    const ollamaService = new OllamaService();
    const chatProvider = new OllamaChatProvider(context.extensionUri, ollamaService);
    const sidebarProvider = new OllamaSidebarProvider(ollamaService, chatProvider);

    // Register sidebar views
    const chatTreeView = vscode.window.createTreeView('ollamaChat.chatView', {
        treeDataProvider: sidebarProvider,
        showCollapseAll: false
    });

    const modelsTreeView = vscode.window.createTreeView('ollamaChat.modelsView', {
        treeDataProvider: sidebarProvider,
        showCollapseAll: false
    });

    // Register the command to open chat
    const openChatCommand = vscode.commands.registerCommand('ollamaChat.openChat', async () => {
        await chatProvider.showChatView();
    });

    // Register the command to refresh models
    const refreshModelsCommand = vscode.commands.registerCommand('ollamaChat.refreshModels', async () => {
        await ollamaService.refreshModels();
        sidebarProvider.refresh();
        vscode.window.showInformationMessage('Ollama models refreshed');
    });

    // Register command to select a model and open chat
    const selectModelCommand = vscode.commands.registerCommand('ollamaChat.selectModel', async (modelName: string) => {
        await chatProvider.showChatView();
        // Send message to webview to select the model
        chatProvider.selectModel(modelName);
        vscode.window.showInformationMessage(`Selected model: ${modelName}`);
    });

    context.subscriptions.push(
        openChatCommand, 
        refreshModelsCommand, 
        selectModelCommand,
        chatTreeView,
        modelsTreeView
    );

    // Check if Ollama is available on startup
    checkOllamaAvailability(ollamaService);
}

async function checkOllamaAvailability(ollamaService: OllamaService) {
    try {
        const isAvailable = await ollamaService.isOllamaAvailable();
        if (!isAvailable) {
            const action = await vscode.window.showWarningMessage(
                'Ollama is not running or not available on localhost:11434. Please start Ollama to use this extension.',
                'Open Ollama Documentation'
            );
            
            if (action === 'Open Ollama Documentation') {
                vscode.env.openExternal(vscode.Uri.parse('https://ollama.ai/'));
            }
        }
    } catch (error) {
        console.error('Error checking Ollama availability:', error);
    }
}

export function deactivate() {}