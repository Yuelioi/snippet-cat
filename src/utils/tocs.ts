import { TOCElement } from '../models/toc';

function getRegContents(reg: RegExp, content: string) {
    let res = [];
    let m;
    while ((m = reg.exec(content)) !== null) {
        if (m.index === reg.lastIndex) {
            reg.lastIndex++;
        }
        res.push(m[0]);
    }
    return res;
}

export function getFunInfo(documentText: string) {
    let mStart, mContent, mSpace;

    const regStart = /(.+\s|\s)*?.+@start/;
    const regContent = /(?<=@start\s)(.+\s|\s)+?(?=.+@end)/gm;
    const regSpace = /(.+@end\s)(.*\s|\s)*?.*@start/gm;

    mStart = regStart.exec(documentText) !== null ? (regStart.exec(documentText) as any)[0] : '';
    mContent = getRegContents(regContent, documentText);
    mSpace = getRegContents(regSpace, documentText);

    let rrr = [];
    const sLineNumber = mStart.split('\n').length;
    let contentLineNumber = 0;
    let spaceLineNumber = 0;

    for (var i = 0, j = mContent.length; i < j; i++) {
        const mc = mContent[i];
        const ms = mSpace[i];
        const currentLineNumbers = mc.split('\n').length;

        let name = <any>/(?<=@name:).+/.exec(mc);
        let des = <any>/(?<=@description:).+/.exec(mc);
        name = name === null ? `未命名函数 ${i + 1}` : name[0];
        des = des === null ? `暂无描述` : des[0];
        // + 2 是去掉2行注释, -4是去掉2行注释和首尾标记
        rrr.push(new TOCElement(name, des, sLineNumber + contentLineNumber + spaceLineNumber + 2, currentLineNumbers - 4));
        contentLineNumber += currentLineNumbers;
        spaceLineNumber += ms === undefined ? 0 : ms.split('\n').length - 2;
    }
    return rrr;
}

export function getMarkdownInfo(documentText: string) {
    const regMarkdown = /(?<=(^##)\s).*/gm;
    let mRes = getRegContents(regMarkdown, documentText);
    let rrr = <any>[];
    mRes.forEach((ma) => {
        rrr.push(new TOCElement(ma, ma, 1, 1));
    });
    return rrr;
}
