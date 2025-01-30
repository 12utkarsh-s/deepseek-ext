// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { error } from "console";
import ollama from "ollama";
import * as vscode from "vscode";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "deepseek-ext.start",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "deepChat",
        "Deep Seek - Conversation Window",
        vscode.ViewColumn.Two,
        { enableScripts: true }
      );

      panel.webview.html = getWebviewContent();

      panel.webview.onDidReceiveMessage(async (message: any) => {
        if (message.command === "ask") {
          const userPrompt = message.text;
          let responseText = "";

          try {
            const streamResponse = await ollama.chat({
              model: "deepseek-r1:8b",
              messages: [{ role: "user", content: userPrompt }],
              stream: true,
            });

            for await (const part of streamResponse) {
              process.stdout.write(part.message.content);
              responseText += part.message.content;
              panel.webview.postMessage({
                command: "answer",
                text: responseText,
              });
            }
          } catch (err) {
            panel.webview.postMessage({
              command: "answer",
              text: `Error: ${String(error)} `,
            });
          }
        }
      });
    }
  );

  context.subscriptions.push(disposable);

  function getWebviewContent(): string {
    return /*html*/ `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Chat</title>
			<style>
				body {
					font-family: Arial, sans-serif;
					padding: 10px;
					display: flex;
					flex-direction: column;
					height: 100vh;
					margin: 0;
				}
				#responseArea {
					flex: 1;
					overflow-y: auto;
					padding: 10px;
					margin-bottom: 10px;
					background-color: #2e2e2e;
					color: #b4d273;
				}
				#message {
					width: 100%;
					height: 80px;
					margin-bottom: 10px;
					padding: 10px;
					box-sizing: border-box;
					border: 1px solid #ccc;
					border-radius: 4px;
				}
				#askButton {
					padding: 10px 20px;
					background-color: #007acc;
					color: white;
					border: none;
					cursor: pointer;
					border-radius: 4px;
				}
				#askButton:hover {
					background-color: #005f99;
				}
				.message {
					margin-bottom: 10px;
					padding: 8px;
					border-radius: 4px;
				}
				.user-message {
					background-color: #e1f5fe;
					align-self: flex-end;
					margin-left: 20%;
				}
				.bot-message {
					background-color: #f1f1f1;
					align-self: flex-start;
					margin-right: 20%;
				}
				think {
					color: #797979;
					font-style: italic;
				}
				
			</style>
		</head>
		<body>
			<textarea id="message" placeholder="Type your message here..."></textarea>
			<button id="askButton">Ask</button>
			<div id="responseArea"></div>

			<script>
				const vscode = acquireVsCodeApi();
				
				document.getElementById('askButton').addEventListener('click', () => {
					const message = document.getElementById('message').value;
					vscode.postMessage({
						command: 'ask',
						text: message
					});
				});

				window.addEventListener('message', event => {
					const {command, text} = event.data;
					if (command === 'answer') {
						document.getElementById('responseArea').innerText = text;
					}
				})
			</script>
		</body>
		</html>
    `;
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
