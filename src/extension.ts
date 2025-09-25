import * as vscode from 'vscode';
import { OllamaChatProvider } from './ollamaChatProvider';
import { OllamaService } from './ollamaService';
import { OllamaSidebarProvider } from './ollamaSidebarProvider';
import { UnifiedLanguageModelService, ProviderType } from './unifiedLanguageModelService';

export function activate(context: vscode.ExtensionContext) {
    // Initialize both old and new services for backward compatibility
    const ollamaService = new OllamaService();
    const unifiedService = new UnifiedLanguageModelService();
    
    const chatProvider = new OllamaChatProvider(context.extensionUri, ollamaService, unifiedService);
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

    // Register command to switch language model provider
    const switchProviderCommand = vscode.commands.registerCommand('ollamaChat.switchProvider', async () => {
        console.log('Switch Provider command triggered');
        
        try {
            const providers = await unifiedService.getAvailableProviders();
            console.log('Available providers:', providers);
            
            const items = providers.map(p => ({
                label: p.name,
                description: p.description,
                detail: p.available ? '✅ Available' : '❌ Not Available',
                provider: p.type
            }));

            console.log('QuickPick items:', items);

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select Language Model Provider'
            });

            console.log('Selected provider:', selected);

            if (selected) {
                console.log('Current provider:', unifiedService.getCurrentProvider());
                console.log('Selected provider type:', selected.provider);
                
                if (selected.provider !== unifiedService.getCurrentProvider()) {
                    const providerInfo = providers.find(p => p.type === selected.provider);
                    if (!providerInfo?.available) {
                        vscode.window.showWarningMessage(
                            `${selected.label} is not available. Please ensure it's properly set up.`
                        );
                        return;
                    }

                    unifiedService.setProvider(selected.provider);
                    console.log('Provider switched to:', selected.provider);
                    
                    // Refresh models in the chat interface
                    await chatProvider.refreshModelsForProvider();
                    
                    vscode.window.showInformationMessage(
                        `Switched to ${selected.label}`,
                        'Open Chat'
                    ).then(action => {
                        if (action === 'Open Chat') {
                            vscode.commands.executeCommand('ollamaChat.openChat');
                        }
                    });
                } else {
                    vscode.window.showInformationMessage(`Already using ${selected.label}`);
                }
            } else {
                console.log('No provider selected');
            }
        } catch (error) {
            console.error('Error in switch provider command:', error);
            vscode.window.showErrorMessage(`Error switching provider: ${error}`);
        }
    });

    // Register command to show provider status
    const providerStatusCommand = vscode.commands.registerCommand('ollamaChat.providerStatus', async () => {
        try {
            console.log('Provider status command triggered');
            const providers = await unifiedService.getAvailableProviders();
            const current = unifiedService.getCurrentProvider();
            
            console.log('Providers:', providers);
            console.log('Current provider:', current);
            
            const statusMessage = providers.map(p => 
                `${p.type === current ? '🎯' : '⚪'} ${p.name}: ${p.available ? '✅' : '❌'}`
            ).join('\n');

            vscode.window.showInformationMessage(
                `Language Model Providers:\n${statusMessage}`,
                { modal: true }
            );
        } catch (error) {
            console.error('Error in provider status command:', error);
            vscode.window.showErrorMessage(`Error getting provider status: ${error}`);
        }
    });



    context.subscriptions.push(
        openChatCommand, 
        refreshModelsCommand, 
        selectModelCommand,
        switchProviderCommand,
        providerStatusCommand,
        chatTreeView,
        modelsTreeView
    );

    // Check available providers on startup
    checkProviderAvailability(unifiedService, chatProvider);
}

async function checkProviderAvailability(unifiedService: UnifiedLanguageModelService, chatProvider: any) {
    try {
        const providers = await unifiedService.getAvailableProviders();
        const availableProviders = providers.filter(p => p.available);
        
        if (availableProviders.length === 0) {
            const action = await vscode.window.showWarningMessage(
                'No language model providers are available. Please set up either Ollama (local) or GitHub Copilot (cloud) to use this extension.',
                'Setup Ollama',
                'Setup Copilot',
                'View Status'
            );
            
            if (action === 'Setup Ollama') {
                vscode.env.openExternal(vscode.Uri.parse('https://ollama.ai/'));
            } else if (action === 'Setup Copilot') {
                vscode.env.openExternal(vscode.Uri.parse('https://github.com/features/copilot'));
            } else if (action === 'View Status') {
                vscode.commands.executeCommand('ollamaChat.providerStatus');
            }
        } else {
            // If current provider is not available, switch to an available one
            const currentProvider = unifiedService.getCurrentProvider();
            const isCurrentAvailable = providers.find(p => p.type === currentProvider)?.available;
            
            if (!isCurrentAvailable && availableProviders.length > 0) {
                const firstAvailable = availableProviders[0];
                unifiedService.setProvider(firstAvailable.type);
                await chatProvider.refreshModelsForProvider();
                vscode.window.showInformationMessage(
                    `Automatically switched to ${firstAvailable.name} (${firstAvailable.description})`
                );
            }
        }
    } catch (error) {
        console.error('Error checking provider availability:', error);
    }
}

// Legacy function for backward compatibility
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