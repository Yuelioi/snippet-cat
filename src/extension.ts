'use strict';

import * as vscode from 'vscode';


import { TreeProvider } from './fileTree';


export function activate(context: vscode.ExtensionContext) {
  // const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
  // 	? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;


  const stockRoot = "H:\\Snippets";

  // let treeProvider = new TreeProvider(stockRoot);
  // let catView =  vscode.window.createTreeView('snippet-cat-view', { treeDataProvider: new TreeProvider(stockRoot), showCollapseAll: true });
  // treeProvider.tree = catView;

  let treeProvider = new TreeProvider(stockRoot);
  let catView = vscode.window.createTreeView('snippet-cat-view',{ treeDataProvider: treeProvider, showCollapseAll: true });

  
  treeProvider.setTreeView(catView);




  
  context.subscriptions.push(

    vscode.commands.registerCommand('snippet-cat.click', (path) => treeProvider.click(path)),

    vscode.commands.registerCommand('snippet-cat.refresh', treeProvider.refresh.bind(treeProvider)),
    vscode.commands.registerCommand('snippet-cat.search', treeProvider.search.bind(treeProvider)),


    vscode.commands.registerCommand('snippet-cat.addGroup', treeProvider.addGroup.bind(treeProvider)),
    vscode.commands.registerCommand('snippet-cat.editGroup', treeProvider.editGroup.bind(treeProvider)),
    vscode.commands.registerCommand('snippet-cat.deleteGroup', treeProvider.deleteGroup.bind(treeProvider)),

    vscode.commands.registerCommand('snippet-cat.addSnippet', treeProvider.addSnippet.bind(treeProvider)),
    vscode.commands.registerCommand('snippet-cat.deleteSnippet', treeProvider.deleteSnippet.bind(treeProvider)),
    vscode.commands.registerCommand('snippet-cat.editSnippet', treeProvider.editSnippet.bind(treeProvider)),

  );

  // vscode.commands.registerCommand('nodeDependencies.addEntry', () => vscode.window.showInformationMessage(`Successfully called add entry.`));
  // vscode.commands.registerCommand('nodeDependencies.editEntry', (node: Dependency) => vscode.window.showInformationMessage(`Successfully called edit entry on ${node.label}.`));
  // vscode.commands.registerCommand('nodeDependencies.deleteEntry', (node: Dependency) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));

}