const vscode = require('vscode');
const axios = require('axios');

function activate(context) {
    let disposable = vscode.commands.registerCommand('autojsdoccomments.generateComment', async () => {
        // const userQuery = await vscode.window.showInputBox({
        //     placeHolder: 'Ask ChatGPT...',
        // });
		let highlighted;
		let selectionRange;

		const editor = vscode.window.activeTextEditor;
		const selection = editor.selection;
		if (selection && !selection.isEmpty) {
			selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
			highlighted = editor.document.getText(selectionRange);
		}

		const userQuery = 'Generate JS Doc comment for this function: ' + highlighted;

        if (userQuery) {
			console.log(userQuery);
            try {
                const apiKey = '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'; // Replace with your ChatGPT API key
                const apiUrl = 'https://api.openai.com/v1/chat/completions'; // Adjust the API URL if needed

                const response = await axios.post(apiUrl, {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant.' },
                        { role: 'user', content: userQuery },
                    ],
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                    },
                });

                const chatGPTResponse = response.data.choices[0].message.content;
                // vscode.window.showInformationMessage(`ChatGPT says: ${chatGPTResponse}`);
				if (editor) {
					editor.edit(editBuilder => {
						editBuilder.insert(selectionRange.start, `${chatGPTResponse}\n`);
					});
				}
            } catch (error) {
                vscode.window.showErrorMessage('Error communicating with ChatGPT.');
                console.error(error);
            }
        }
    });

    context.subscriptions.push(disposable);
}

module.exports = {
    activate
};





// // The module 'vscode' contains the VS Code extensibility API
// // Import the module and reference it with the alias vscode in your code below
// const vscode = require('vscode');

// // This method is called when your extension is activated
// // Your extension is activated the very first time the command is executed

// /**
//  * @param {vscode.ExtensionContext} context
//  */
// function activate(context) {

// 	// Use the console to output diagnostic information (console.log) and errors (console.error)
// 	// This line of code will only be executed once when your extension is activated
// 	console.log('Congratulations, your extension "autojsdoccomments" is now active!');

// 	// The command has been defined in the package.json file
// 	// Now provide the implementation of the command with  registerCommand
// 	// The commandId parameter must match the command field in package.json
// 	let disposable = vscode.commands.registerCommand('autojsdoccomments.helloWorld', function () {
// 		// The code you place here will be executed every time your command is executed

// 		// Display a message box to the user
// 		vscode.window.showInformationMessage('Hello World from AutoJSDocComments!');
// 	});

// 	context.subscriptions.push(disposable);
// }

// // This method is called when your extension is deactivated
// function deactivate() {}

// module.exports = {
// 	activate,
// 	deactivate
// }
