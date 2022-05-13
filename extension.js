// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

const vscode = require('vscode');
const constants = require("./constants");
const path = require("path");
const os = require("os");
const config = require("./config");

/**
 * @param {vscode.ExtensionContext} context
**/

function activate(context) {
	const extConfig = vscode.workspace.getConfiguration("cpp-smart-comment");
    if (extConfig.author === undefined) {
        (() => __awaiter(this, void 0, void 0, function* () {
            const resp = yield vscode.window.showInformationMessage("Do you want to quickly set up C++ smart comment ?", "Yes", "No");
            if (resp === "Yes") {
                config.configureSettings(extConfig);
            }
        }))();
    }
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('C++ Smart comment is now ready.');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('cpp-smart-comment.comment', () => __awaiter(this, void 0, void 0, function* () {
		// The code you place here will be executed every time your command is executed
		const conf = config.loadConfig();
		const fileInfo = {};
		fileInfo.editor = vscode.window.activeTextEditor;
		fileInfo.document = fileInfo.editor.document;
		fileInfo.fileName = fileInfo.document.fileName;
		fileInfo.uri = fileInfo.document.uri;
		fileInfo.eol = constants.EOLS[fileInfo.document.eol];
		fileInfo.ext = path.basename(fileInfo.fileName).split(".").reverse()[0];

		if (!(fileInfo.ext in constants.SUPPORTED_LANGUAGES)) {
			vscode.window.showErrorMessage("The currently opened file isn't a supported file.");
			return;
		}
		fileInfo.langId = constants.SUPPORTED_LANGUAGES[fileInfo.ext];
		let curPos = fileInfo.editor.selection.active;
		let line = fileInfo.document.lineAt(curPos.line).text;
		let author =  ` @author : ${conf.author}`
		let spaces = ""
		
		if (line.match(/(([A-Z:a-z\-\_<>]+ )?[A-Z:a-z\-\_<>]+\(((([A-Z:a-z\-\_<>]+( [A-Za-z0-9*\-\_<>]+)?(, )?))?)*\))|(class [A-Za-z|-|-0-9]+( : public [A-Za-z|-|-0-9]+)?)/) == null) {
			vscode.window.showErrorMessage("Unable to parse the currently selected line.");
			return;
		}
		while (line[0] == " ") {
			line = line.substring(1);
			spaces = spaces.concat(" ")
		}
		let comment = ""
		comment = comment.concat(spaces, constants.SYNTAX.commentStart, fileInfo.eol)
		comment = comment.concat(spaces, constants.SYNTAX.commentMid, author, fileInfo.eol)
		comment = comment.concat(spaces, constants.SYNTAX.commentMid, fileInfo.eol)
		if (line.split(' ')[0].includes("class")) {
			const classs = {}
			if (line.includes(':')) {
				classs.name = line.split(' ')[1]
				classs.inheritance = line.split(':')[1].replace('{', '')
				classs.desc = yield vscode.window.showInputBox({
					prompt: "Type class description",
					placeHolder: `Description of class ${classs.name}: `,
				});
				classs.brief = ` @brief Class ${classs.name} (${classs.inheritance}): ` + classs.desc
			} else {
				classs.name = line.split(' ')[1]
				classs.desc = yield vscode.window.showInputBox({
					prompt: "Type class description",
					placeHolder: `Description of class ${classs.name}`,
				});
				classs.brief = ` @brief Class ${classs.name}: ` + classs.desc
			}
			comment = comment.concat(spaces, constants.SYNTAX.commentMid, classs.brief, fileInfo.eol)
		} else {
			let func = {}
			if (line.includes('::')) {
				if (line.split(' ')[0].includes('::')) {
					func.namestr = line.split('(')[0]
					func.name = func.namestr
					while (func.name.includes(':'))
						func.name = func.name.substring(1)
					let type = func.name[0] == '~' ? "destructor" : "constructor"
					comment = comment.concat(spaces, constants.SYNTAX.commentMid, ` @brief Class ${func.name[0] == '~' ? func.name.substring(1) : func.name} ${type}` , fileInfo.eol)
					func.args = line.split('(')[1].replace(')', '')
					if (func.args.length > 0 && func.args != "void") {
						func.args = func.args.split(',')
						for (var i = 0; i < func.args.length; i++) {
							if (func.args[i][0] == ' ')
								func.args[i] = func.args[i].substring(1);
							let returntype = func.args[i].split(' ')[0]
							let name = func.args[i].split(' ')[1]
							while (name[0] == '*') {
								name = name.substring(1)
								returntype = returntype.concat('*')
							}
							let desc = yield vscode.window.showInputBox({
								prompt: "Type arg description",
								placeHolder: `Param ${name} (${returntype}): `,
							});
							comment = comment.concat(spaces, constants.SYNTAX.commentMid, ` @param ${name} (${returntype}): ${desc}`, fileInfo.eol)
						}
					}
				} else {
					func.returntype = line.split(' ')[0]
					func.namestr = line.split(' ')[1].split('(')[0]
					func.name = func.namestr
					while (func.name.includes(':'))
						func.name = func.name.substring(1)
					func.class = func.namestr.replace(`::${func.name}`, '')
					while (func.class.includes(':')) {
						func.class = func.class.substring(1)
					}
					let brief = yield vscode.window.showInputBox({
						prompt: "Type function description",
						placeHolder: `Function ${func.name} (Class ${func.class}): `,
					});
					comment = comment.concat(spaces, constants.SYNTAX.commentMid, ` @brief Function ${func.name} (Class ${func.class}): ${brief}` , fileInfo.eol)
					func.args = line.split('(')[1].replace(')', '')
					if (func.args.length > 0 &&func.args != "void") {
						func.args = func.args.split(',')
						for (var i = 0; i < func.args.length; i++) {
							if (func.args[i][0] == ' ')
								func.args[i] = func.args[i].substring(1);
							let returntype = func.args[i].split(' ')[0]
							let name = func.args[i].split(' ')[1]
							while (name[0] == '*') {
								name = name.substring(1)
								returntype = returntype.concat('*')
							}
							let desc = yield vscode.window.showInputBox({
								prompt: "Type arg description",
								placeHolder: `Param ${name} (${returntype}): `,
							});
							comment = comment.concat(spaces, constants.SYNTAX.commentMid, ` @param ${name} (${returntype}): ${desc}`, fileInfo.eol)
						}
					}
					comment = comment.concat(spaces, constants.SYNTAX.commentMid, fileInfo.eol)
					if (func.returntype == "void")
						func.returnDesc =  ` @return Nothing`
					else
						func.returnDesc =  ` @return ${func.returntype}`
					comment = comment.concat(spaces, constants.SYNTAX.commentMid, func.returnDesc, fileInfo.eol)
				}
			} else {
				func.returntype = line.split(' ')[0]
				func.name = line.split(' ')[1].split('(')[0]
				let brief = yield vscode.window.showInputBox({
					prompt: "Type function description",
					placeHolder: `Function ${func.name}: `,
				});
				comment = comment.concat(spaces, constants.SYNTAX.commentMid, ` @brief Function ${func.name}: ${brief}` , fileInfo.eol)
				func.args = line.split('(')[1].replace(')', '')
				if (func.args.length > 0 && func.args != "void") {
					func.args = func.args.split(',')
					for (var i = 0; i < func.args.length; i++) {
						if (func.args[i][0] == ' ')
							func.args[i] = func.args[i].substring(1);
						let returntype = func.args[i].split(' ')[0]
						let name = func.args[i].split(' ')[1]
						while (name[0] == '*') {
							name = name.substring(1)
							returntype = returntype.concat('*')
						}
						let desc = yield vscode.window.showInputBox({
							prompt: "Type arg description",
							placeHolder: `Param ${name} (${returntype}): `,
						});

						comment = comment.concat(spaces, constants.SYNTAX.commentMid, ` @param ${name} (${returntype}): ${desc}`, fileInfo.eol)
					}
				}
				comment = comment.concat(spaces, constants.SYNTAX.commentMid, fileInfo.eol)
				if (func.returntype == "void")
					func.returnDesc =  ` @return Nothing`
				else
					func.returnDesc =  ` @return ${func.returntype}`
				comment = comment.concat(spaces, constants.SYNTAX.commentMid, func.returnDesc, fileInfo.eol)
			}
		}
		comment = comment.concat(spaces, constants.SYNTAX.commentEnd, fileInfo.eol)
		const edit = new vscode.WorkspaceEdit();
		edit.set(fileInfo.uri, [vscode.TextEdit.insert(new vscode.Position(curPos.line, 0), comment)]);
		vscode.workspace.applyEdit(edit);

	}));

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
