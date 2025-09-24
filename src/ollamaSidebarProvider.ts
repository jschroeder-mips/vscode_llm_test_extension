import * as vscode from 'vscode';
import { OllamaService, OllamaModel } from './ollamaService';

export class OllamaSidebarProvider implements vscode.TreeDataProvider<SidebarItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SidebarItem | undefined | null | void> = new vscode.EventEmitter<SidebarItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SidebarItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(
        private ollamaService: OllamaService,
        private chatProvider: any // We'll inject this to avoid circular dependency
    ) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: SidebarItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: SidebarItem): Promise<SidebarItem[]> {
        if (!element) {
            // Root items
            return [
                new SidebarItem(
                    'Quick Actions',
                    'Quick Actions',
                    vscode.TreeItemCollapsibleState.Expanded,
                    'category'
                ),
                new SidebarItem(
                    'Available Models',
                    'Available Models',
                    vscode.TreeItemCollapsibleState.Expanded,
                    'category'
                )
            ];
        }

        if (element.contextValue === 'category') {
            if (element.label === 'Quick Actions') {
                return [
                    new SidebarItem(
                        'Open Chat',
                        'Open Chat Window',
                        vscode.TreeItemCollapsibleState.None,
                        'action',
                        {
                            command: 'ollamaChat.openChat',
                            title: 'Open Chat',
                            arguments: []
                        }
                    ),
                    new SidebarItem(
                        'Refresh Models',
                        'Refresh Model List',
                        vscode.TreeItemCollapsibleState.None,
                        'action',
                        {
                            command: 'ollamaChat.refreshModels',
                            title: 'Refresh Models',
                            arguments: []
                        }
                    )
                ];
            } else if (element.label === 'Available Models') {
                try {
                    const isAvailable = await this.ollamaService.isOllamaAvailable();
                    if (!isAvailable) {
                        return [
                            new SidebarItem(
                                'Ollama Not Running',
                                'Start Ollama service to see models',
                                vscode.TreeItemCollapsibleState.None,
                                'error'
                            )
                        ];
                    }

                    const models = await this.ollamaService.getModels();
                    if (models.length === 0) {
                        return [
                            new SidebarItem(
                                'No Models Available',
                                'Install models with: ollama pull <model-name>',
                                vscode.TreeItemCollapsibleState.None,
                                'warning'
                            )
                        ];
                    }

                    return models.map(model => 
                        new SidebarItem(
                            model.name,
                            `Size: ${this.formatBytes(model.size)}`,
                            vscode.TreeItemCollapsibleState.None,
                            'model',
                            {
                                command: 'ollamaChat.selectModel',
                                title: 'Select Model',
                                arguments: [model.name]
                            }
                        )
                    );
                } catch (error) {
                    return [
                        new SidebarItem(
                            'Error Loading Models',
                            'Click to try again',
                            vscode.TreeItemCollapsibleState.None,
                            'error',
                            {
                                command: 'ollamaChat.refreshModels',
                                title: 'Retry',
                                arguments: []
                            }
                        )
                    ];
                }
            }
        }

        return [];
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

class SidebarItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly tooltip: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = tooltip;
        this.contextValue = contextValue;

        // Set icons based on context
        switch (contextValue) {
            case 'category':
                this.iconPath = new vscode.ThemeIcon('folder');
                break;
            case 'action':
                if (label.includes('Chat')) {
                    this.iconPath = new vscode.ThemeIcon('comment-discussion');
                } else if (label.includes('Refresh')) {
                    this.iconPath = new vscode.ThemeIcon('refresh');
                }
                break;
            case 'model':
                this.iconPath = new vscode.ThemeIcon('robot');
                break;
            case 'error':
                this.iconPath = new vscode.ThemeIcon('error');
                break;
            case 'warning':
                this.iconPath = new vscode.ThemeIcon('warning');
                break;
        }
    }
}