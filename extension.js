const axios = require('axios');
const vscode = require('vscode');

function stateManager(context) {
    return {
        read,
        write,
        clear,
    };

    function read() {
        return {
            apiKey: context.globalState.get('apiKey'),
        };
    }

    async function write(newState) {
        await context.globalState.update('apiKey', newState.apiKey);
    }

    async function clear() {
        await context.globalState.update('apiKey', undefined);
    }
}

async function handleApi(context) {
    const state = stateManager(context);

    const { apiKey } = state.read();

    if (apiKey) {
        return apiKey;
    } else {
        const inputApiKey = await vscode.window.showInputBox({
            prompt: 'Please enter your ChatGPT API key',
            password: true,
        });

        if (inputApiKey) {
            await state.write({
                apiKey: inputApiKey,
            });
            return inputApiKey;
        } else {
            throw new Error('API key is required for this operation.');
        }
    }
}

function activate(context) {
    let disposable = vscode.commands.registerCommand('autojsdoccomments.generateComment', async () => {
        let highlighted;
        let selectionRange;

        const editor = vscode.window.activeTextEditor;
        const selection = editor.selection;
        if (selection && !selection.isEmpty) {
            selectionRange = new vscode.Range(
                selection.start.line,
                selection.start.character,
                selection.end.line,
                selection.end.character
            );
            highlighted = editor.document.getText(selectionRange);
        }

        const userQuery = 'Generate JSDoc comment for this function: ' + highlighted;

        if (userQuery) {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                title: "Communicating with ChatGPT...",
                cancellable: false
            }, async (progress) => {
                try {
                    const apiKey = await handleApi(context);
                    const apiUrl = 'https://api.openai.com/v1/chat/completions';

                    progress.report({ increment: 10, message: 'Fetching API key...' });

                    const response = await axios.post(
                        apiUrl,
                        {
                            model: 'gpt-3.5-turbo',
                            messages: [
                                { role: 'system', content: 'You are a helpful assistant.' },
                                { role: 'user', content: userQuery },
                            ],
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${apiKey}`,
                            },
                        }
                    );

                    progress.report({ increment: 70, message: 'Communication successful...' });

                    const chatGPTResponse = response.data.choices[0].message.content;

                    if (editor) {
                        editor.edit((editBuilder) => {
                            editBuilder.insert(selectionRange.start, `${chatGPTResponse}\n`);
                        });
                    }

                    progress.report({ increment: 100, message: 'Operation complete.' });
                } catch (error) {
                    vscode.window.showErrorMessage('Error communicating with ChatGPT. \n' + error.message + " \n\n FULL ERROR: " + JSON.stringify(error, undefined, 2));
                }
            });
        }
    });

    let deleteApiKeyDisposable = vscode.commands.registerCommand('autojsdoccomments.deleteApiKey', async () => {
        try {
            const state = stateManager(context);
            await state.clear();
            vscode.window.showInformationMessage('API key deleted successfully.');
        } catch (error) {
            vscode.window.showErrorMessage('Error deleting API key.');
            console.error(error);
        }
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(deleteApiKeyDisposable);
}

module.exports = {
    activate,
};
