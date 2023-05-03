/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { Editor, MarkdownView, Notice } from 'obsidian';

import BetterPaste from '../main';
import { EnhancedEditor } from 'enhanced-editor';
import { Switch } from 'constant/consisit';

interface SETTINGS {
    autoDelNulLineSwitch: Switch
}

export type { SETTINGS as OPTIMIZE_PASTER_SETTINGS }

const settings = {
    autoDelNulLineSwitch: 1
}



export { settings as optimizePasteSettings }

export class OptimizePasteCore {
    constructor(protected plugin: BetterPaste) {
    }
    /** 顶层入口
     * 需要粘贴前的一瞬间调用该函数
     */
    protected DelPasteSpaceLine(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            //Testlog('Paste Event!');
            //Testlog(this.settings.autoDelNulLineSwitch);
            if (!this.plugin.settings.autoDelNulLineSwitch) resolve(false)
            let editor = this.plugin.app.workspace.activeEditor?.editor!
            if (!editor) resolve(false)
            let BeforePos = editor.getCursor();
            window.setTimeout(() => {
                let enhancedEditor = new EnhancedEditor(editor)
                let { txt: rawin } = enhancedEditor.GetPasteTxt(BeforePos);
                editor.replaceSelection(this.DelSpaceLineOnce(rawin));
                resolve(true)
            }, 1);
        })
    }
    DelSpaceLineOnce(rawin: string): string {
        const NullLineRegex = /(?<=\n)\n/g;
        return (
            rawin.replace(NullLineRegex, function () {
                return '';
            })
        )
    }
    async SwitchAutoDelLine() {
        this.plugin.settings.autoDelNulLineSwitch = (this.plugin.settings.autoDelNulLineSwitch + 1) % 2
        await this.plugin.saveSettings();
        new Notice("开启粘贴自动删除间隔空行功能:" + Switch[this.plugin.settings.autoDelNulLineSwitch]);
    }
}

export class OptimizePasteController extends OptimizePasteCore {
    clearFuncs: Function[];
    constructor(plugin: BetterPaste) {
        super(plugin);
        console.log('controller construct!!')
        this.Init()
    }
    Init() {
        this.clearFuncs = []
        this.addCommand()
        this.registListener()
    }
    die() {
        for (const func of this.clearFuncs) {
            func()
        }
        this.clearFuncs = []
    }
    addCommand() {
        this.plugin.addCommand({
            id: '切换"粘贴自动删除每一个空行",SwitchAutoDel',
            name: '切换"粘贴自动删除每一个空行",SwitchAutoDel',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                await this.SwitchAutoDelLine();
                this.registListener();
            }
        });
        this.plugin.addCommand({
            id: '删除所选的每一个空行',
            name: '删除所选的每一个空行',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                let enhancedEditor = new EnhancedEditor(editor)
                let { startPos, endPos, txt: rawIn } = enhancedEditor.GetMultiLineInSelection()
                editor.replaceRange(this.DelSpaceLineOnce(rawIn), startPos, endPos);
            }
        });
    }
    protected registListener() {
        let clearFunc = () => { this.plugin.app.workspace.off('editor-paste', this.DelPasteSpaceLine.bind(this)) }
        clearFunc()
        this.plugin.app.workspace.on('editor-paste', this.DelPasteSpaceLine.bind(this))
        this.clearFuncs.push(clearFunc)
    }
}