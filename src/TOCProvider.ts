import * as vscode from "vscode";
import * as path from "path";

import { TOCElement, getFunInfo, getMarkdownInfo } from "./utils/tocs";
import { runSnippet } from "./utils/global";

export class TOCProvider implements vscode.TreeDataProvider<TOCElement> {
  private _onDidChangeTreeData: vscode.EventEmitter<TOCElement | undefined> = new vscode.EventEmitter<TOCElement | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TOCElement | undefined> = this._onDidChangeTreeData.event;
  languageID: string | undefined;
  snippetProvider: any;

  constructor(context: vscode.ExtensionContext, snippetProvider: any) {
    const view = vscode.window.createTreeView("snippet-cat-outline", {
      treeDataProvider: this,
    });

    this.snippetProvider = snippetProvider;

    context.subscriptions.push(view);
    this.languageID = vscode.window.activeTextEditor?.document.languageId;
    vscode.window.onDidChangeActiveTextEditor(() => {
      this.refresh();
    });
    vscode.workspace.onDidSaveTextDocument(() => {
      this.refresh();
    });
  }

  getChildren(element: TOCElement): Thenable<TOCElement[]> {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
      let documentText = editor.document.getText();
      if (this.languageID === "markdown") {
        return Promise.resolve(getMarkdownInfo(documentText));
      } else {
        return Promise.resolve(getFunInfo(documentText));
      }
    }
    return Promise.resolve([]);
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
    
    // this.languageID = vscode.window.activeTextEditor?.document.languageId;
    this._onDidChangeTreeData.fire(undefined);
  }

  // 单击大纲 移动到对应函数上面2行 并选中
  // ref:// https://code.visualstudio.com/api/references/commands
  async click(element: TOCElement) {
    const editor = <any>vscode.window.activeTextEditor;
    await vscode.commands
      .executeCommand("revealLine", {
        at: "top",
        lineNumber: element.line - 2 < 0 ? element.line : element.line - 2,
      })
      .then(() => {
        vscode.commands.executeCommand("workbench.action.navigateToLastEditLocation").then(() => {
          editor.selection = new vscode.Selection(
            element.line,
            0,
            element.line + element.length,
            editor.document.lineAt(element.line + element.length).text.length
          );
        });
      });
  }

  run(element: TOCElement) {
    const editor = <any>vscode.window.activeTextEditor;
    editor.selection = new vscode.Selection(
      element.line,
      0,
      element.line + element.length,
      editor.document.lineAt(element.line + element.length).text.length
    );
    const selText = editor.document.getText(editor.selection);
    runSnippet(selText);
  }

  async insertSnippet(){
    const value = await vscode.window.showQuickPick(['explorer', 'search', 'scm', 'debug', 'extensions'], { placeHolder: 'Select the view to show when opening a window.' });
  }

  copy(element: TOCElement) {
    this.click(element);
    setTimeout(() => {
      vscode.commands.executeCommand("editor.action.clipboardCopyAction");
      vscode.window.showInformationMessage("已复制到剪切板");
    }, 500);
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
