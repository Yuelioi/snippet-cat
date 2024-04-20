import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Snippet Element
 *
 */
export class SnippetElement {
    basename: string;
    isDir: boolean;
    fullPath: string;
    dirPath: string;
    parent: SnippetElement | undefined;
    constructor(fullPath: string, element: SnippetElement | undefined = undefined) {
        this.fullPath = fullPath;
        this.basename = path.basename(fullPath);
        this.isDir = fs.lstatSync(fullPath).isDirectory();
        this.dirPath = this.isDir ? fullPath : path.dirname(fullPath);
        if (element) {
            this.parent = element;
        }
    }
}

export class SnippetItem extends vscode.TreeItem {
    constructor(
        element: SnippetElement,
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.label = element.basename;
        this.id = this.tooltip = element.fullPath;
        this.contextValue = element.isDir ? 'Group' : 'Snippet';

        let icon = 'folder';
        if (this.contextValue === 'Snippet') {
            this.command = {
                title: 'Item Command',
                command: 'snippet-cat.main.click',
                arguments: [element.fullPath]
            };
            icon = path.extname(element.fullPath).replace('.', '');

            if (!fs.existsSync(path.join(__filename, '..', '..', 'media', 'icons', 'files', 'dark', `${icon}.svg`))) {
                icon = 'file';
            }
        }

        this.iconPath = {
            light: path.join(__filename, '..', '..', 'media', 'icons', 'files', 'light', `${icon}.svg`),
            dark: path.join(__filename, '..', '..', 'media', 'icons', 'files', 'dark', `${icon}.svg`)
        };
    }
}
