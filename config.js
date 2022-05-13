"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const os = require("os");
function configureSettings(config, force = false) {
    return __awaiter(this, void 0, void 0, function* () {
        if (config.author === undefined || force) {
            const resp = yield vscode.window.showInputBox({ prompt: "Type the name you want to show in the @author section: " });
            if (resp !== undefined) {
                vscode.window.showInformationMessage(resp)
                config.update("author", resp, true);
            }
        }
        vscode.window.showInformationMessage("C++ smart comment have been successfully configured !");
    });
}
exports.configureSettings = configureSettings;
function loadConfig() {
    const config = {};
    config.handle = vscode.workspace.getConfiguration("cpp-smart-comment");
    config.author = config.handle.author === undefined ? os.userInfo().username : config.handle.author ;
    return config;
}
exports.loadConfig = loadConfig;