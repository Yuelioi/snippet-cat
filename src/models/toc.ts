import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class TOCElement {
    name: string;
    description: string;
    line: number;
    length: number;
    constructor(name: string, description: string, line: number, length: number) {
        {
            this.name = name;
            this.description = description;
            this.line = line;
            this.length = length;
        }
    }
}

export class TOCItem extends vscode.TreeItem {
    constructor(
        element: TOCElement,
        label: string,
        collapsibleState: vscode.TreeItemCollapsibleState,
        languageID: string | undefined
    ) {
        super(label, collapsibleState);
        this.label = element.name;
        this.tooltip = element.description;
        this.contextValue = 'Title';

        let icon = languageID === 'markdown' ? 'markdown' : 'function';

        if (this.contextValue === 'Title') {
            this.command = {
                title: 'Item Command',
                command: 'snippet-cat.outline.click',
                arguments: [element]
            };
        }

        this.iconPath = {
            light: path.join(__filename, '..', '..', 'media', 'icons', 'interface', 'light', `${icon}.svg`),
            dark: path.join(__filename, '..', '..', 'media', 'icons', 'interface', 'dark', `${icon}.svg`)
        };
    }
}
