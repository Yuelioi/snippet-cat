import * as vscode from "vscode";
import * as path from "path";

import { TOCElement, getFunInfo, getMarkdownInfo } from "./utils/tocs";

export class TOCProvider implements vscode.TreeDataProvider<TOCElement> {
  private _onDidChangeTreeData: vscode.EventEmitter<TOCElement | undefined> = new vscode.EventEmitter<TOCElement | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TOCElement | undefined> = this._onDidChangeTreeData.event;
  languageID: string | undefined;

  constructor(context: vscode.ExtensionContext) {
    const view = vscode.window.createTreeView("snippet-cat-outline", {
      treeDataProvider: this,
    });

    context.subscriptions.push(view);
    this.languageID = vscode.window.activeTextEditor?.document.languageId;
  }

  getChildren(element: TOCElement): Thenable<TOCElement[]> {
    const editor = vscode.window.activeTextEditor;

    let documentText: string;

    if (editor) {
      documentText = editor.document.getText();
      if (this.languageID === "markdown") {
        return Promise.resolve(getMarkdownInfo(documentText));
      }
    } else {
      documentText = "";
    }
    return Promise.resolve(getFunInfo(documentText));
  }

  public getTreeItem(element: TOCElement): vscode.TreeItem {
    const treeItem = this._getTreeItem(element);
    return treeItem;
  }

  _getTreeItem(element: TOCElement): TOCItem {
    const treeElement = this._getTreeElement(element);
    return new TOCItem(
      treeElement,
      treeElement.name,
      1 ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed,
      this.languageID
    );
  }

  _getTreeElement(element: TOCElement): TOCElement {
    return element;
  }

  // Element 列表
  // _getChildren(folderPath: string): TOCElement[] {

  // }



  async refresh(): Promise<void> {
    this.languageID = vscode.window.activeTextEditor?.document.languageId;
    this._onDidChangeTreeData.fire(undefined);
  }

  // 单击大纲 移动到对应函数上面2行 并选中
  // ref:// https://code.visualstudio.com/api/references/commands
  async click(element: TOCElement) {
    let editor = <any>vscode.window.activeTextEditor;

    editor.selection = new vscode.Selection(element.line, 0, element.line + element.length, 0);

    await vscode.commands
      .executeCommand("revealLine", {
        at: "top",
        lineNumber: element.line - 2 < 0 ? element.line : element.line - 2,
      }).then(() => {
        vscode.commands.executeCommand("workbench.action.navigateToLastEditLocation").then(() => {
          editor.selection = new vscode.Selection(element.line, 0, element.line + element.length, 0);
        });
      });
  }
  copy(element: TOCElement) {
    this.click(element);
    vscode.commands.executeCommand("editor.action.clipboardCopyAction");
  }
}

class TOCItem extends vscode.TreeItem {
  constructor(element: TOCElement, label: string, collapsibleState: vscode.TreeItemCollapsibleState, languageID: string | undefined) {
    super(label, collapsibleState);
    this.label = element.name;
    this.tooltip = element.description;
    this.contextValue = "Title";

    let icon = languageID === "markdown" ? "markdown" : "function";

    if (this.contextValue === "Title") {
      this.command = {
        title: "Item Command",
        command: "snippet-cat.outline.click",
        arguments: [element],
      };
    }

    this.iconPath = {
      light: path.join(__filename, "..", "..", "media", "icons", "interface", "light", `${icon}.svg`),
      dark: path.join(__filename, "..", "..", "media", "icons", "interface", "dark", `${icon}.svg`),
    };
  }
}
