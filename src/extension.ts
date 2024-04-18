"use strict";

import * as vscode from "vscode";
import { SnippetsProvider } from "./SnippetsProvider";
import { TOCProvider } from "./TOCProvider";

import localeEn from "../package.nls.en.json";
import localeJa from "../package.nls.jp.json";
// import localeZh from "../package.nls.zh-CN.json";

// Loading LocaleKeyType
export type LocaleKeyType = keyof typeof localeEn;

interface LocaleEntry {
    [key: string]: string;
}
const localeTableKey = vscode.env.language;
const localeTable = Object.assign(
    localeEn,
    (<{ [key: string]: LocaleEntry }>{
        ja: localeJa,
    })[localeTableKey] || {}
);
const localeString = (key: string): string => localeTable[key] || key;
const localeMap = (key: LocaleKeyType): string => localeString(<any>key);

export function activate(context: vscode.ExtensionContext) {
    const snippetProvider = new SnippetsProvider(context);
    const tocProvider = new TOCProvider(context, snippetProvider);

    context.subscriptions.push(


        vscode.commands.registerCommand("snippet-cat.saveToStock", snippetProvider.saveToStock.bind(snippetProvider)),

        vscode.commands.registerCommand("snippet-cat.main.click", path => snippetProvider.click(path)),
        vscode.commands.registerCommand("snippet-cat.main.viewSwitch", snippetProvider.viewSwitch.bind(snippetProvider)),

        vscode.commands.registerCommand("snippet-cat.main.upload", snippetProvider.upload.bind(snippetProvider)),
        vscode.commands.registerCommand("snippet-cat.main.download", snippetProvider.download.bind(snippetProvider)),
        vscode.commands.registerCommand("snippet-cat.main.init", snippetProvider.init.bind(snippetProvider)),
        vscode.commands.registerCommand("snippet-cat.main.search", snippetProvider.search.bind(snippetProvider)),
        vscode.commands.registerCommand("snippet-cat.main.addStockPath", snippetProvider.addStockPath.bind(snippetProvider)),

        vscode.commands.registerCommand("snippet-cat.main.addGroup", snippetProvider.addGroup.bind(snippetProvider)),
        vscode.commands.registerCommand("snippet-cat.main.editGroup", snippetProvider.editGroup.bind(snippetProvider)),
        vscode.commands.registerCommand("snippet-cat.main.openGroup", snippetProvider.openGroup.bind(snippetProvider)),
        vscode.commands.registerCommand("snippet-cat.main.deleteGroup", snippetProvider.deleteGroup.bind(snippetProvider)),

        vscode.commands.registerCommand("snippet-cat.main.addSnippet", snippetProvider.addSnippet.bind(snippetProvider)),
        vscode.commands.registerCommand("snippet-cat.main.editSnippet", snippetProvider.editSnippet.bind(snippetProvider)),
        vscode.commands.registerCommand("snippet-cat.main.deleteSnippet", snippetProvider.deleteSnippet.bind(snippetProvider)),

        vscode.commands.registerCommand("snippet-cat.outline.insertSnippet", tocProvider.insertSnippet.bind(tocProvider)),
        vscode.commands.registerCommand("snippet-cat.outline.click", tocProvider.click.bind(tocProvider)),
        vscode.commands.registerCommand("snippet-cat.outline.copy", tocProvider.copy.bind(tocProvider)),
        vscode.commands.registerCommand("snippet-cat.outline.run", tocProvider.run.bind(tocProvider)),

        vscode.commands.registerCommand("snippet-cat.outline.refresh", tocProvider.refresh.bind(tocProvider))
    );
}
