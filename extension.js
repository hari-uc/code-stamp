const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { parse } = require("comment-json");

var authorName;
var fileCreatedAt;

/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "code-stamp.addstamp",
    function () {
      if (authorName) {
        insertComment(authorName);
      } else {
        startInputProcess().then(() => {
          insertComment(authorName);
        });
      }
    }
  );

  let disposable2 = vscode.commands.registerCommand(
    "code-stamp.updateAuthorName",
    function () {
      startInputProcess();
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(disposable2);
}

// this method is called when your extension is deactivated
function deactivate() {
  vscode.window.showInformationMessage("We are sorry to see you go :(");
}

//get author name from the user
async function startInputProcess() {
  await vscode.window
    .showInputBox({
      value: "",
      placeHolder: "Enter the Author name to be stamped",
      ignoreFocusOut: true,
    })
    .then(function (value) {
      authorName = value;
    })
    .catch((err) => console.log(err.message));
}

function getFileCreatedTime(filePath) {
  try {
    const status = fs.statSync(filePath);
    //only DD/MM/YYYY
    return status.birthtime.toLocaleString();
  } catch (err) {
    console.error(`Error getting file creation time: ${err.message}`);
    return null;
  }
}

async function getCommentSyntax(languageId) {
  let thisConfig = {};
  let langConfigFilePath = null;
  for (let i = 0; i < vscode.extensions.all.length; i++) {
    let extension = vscode.extensions.all[i];

    //if the extenstion contains the languages
    if (
      extension.packageJSON.contributes &&
      extension.packageJSON.contributes.languages
    ) {
      let languages = extension.packageJSON.contributes.languages;

      for (let j = 0; j < languages.length; j++) {
        let packageLanguage = languages[j];
        if (packageLanguage.id === languageId) {
          if (packageLanguage.configuration && extension.extensionPath) {
            langConfigFilePath = path.join(
              extension.extensionPath,
              packageLanguage.configuration
            );

            if (!!langConfigFilePath && fs.existsSync(langConfigFilePath)) {
              thisConfig = parse(
                fs.readFileSync(langConfigFilePath).toString()
              );
              return thisConfig;
            }
          }
        }
      }
    }
  }
  return thisConfig;
}
async function insertComment(authorName, message = "") {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return vscode.window.showErrorMessage("No active text editor found");
  }

  const languageId = editor.document.languageId;
  const documentUri = editor.document.uri;
  fileCreatedAt = getFileCreatedTime(documentUri.fsPath);
  const commentSyntax = await getCommentSyntax(languageId);

  if (!commentSyntax) {
    return vscode.window.showErrorMessage(
      `Language ${languageId} is not supported`
    );
  }

  const blockComment = commentSyntax.comments.blockComment;

  if (!blockComment) {
    return vscode.window.showErrorMessage(
      `Language ${languageId} is not supported`
    );
  }

  const commentText =
    blockComment[0] +
    "\n" +
    `Author : ${authorName}\n` +
    `Updated at : ${new Date().toLocaleString()}\n` +
    `Message : ${message}\n` +
    blockComment[1] +
    "\n";

  const currentPositon = editor.selection.active;

  // Check if the cursor is in the middle of existing code
  const isInMiddleOfCode =
    currentPositon.character > 0 &&
    currentPositon.character <
      editor.document.lineAt(currentPositon.line).text.length;

  if (isInMiddleOfCode) {
    // Insert a newline before the comment if needed
    const lineText = editor.document.lineAt(currentPositon.line).text;

    const insertNewline = !lineText
      .substring(0, currentPositon.character)
      .trim();

    editor.edit((editBuilder) => {
      editBuilder.insert(
        currentPositon.with(
          undefined,
          insertNewline ? 0 : currentPositon.character
        ),
        insertNewline ? "\n" + commentText : commentText
      );
    });
  } else {
    // Insert the comment at the current position
    editor.edit((editBuilder) => {
      editBuilder.insert(currentPositon, commentText);
    });
  }
}

// Register the hover provider
vscode.languages.registerHoverProvider(
  { scheme: "file" },
  {
    provideHover(document, position) {
      const range = document.getWordRangeAtPosition(
        position,
        /Author|File created at|Updated at|Message/g
      );
      if (!range) {
        return null;
      }

      const word = document.getText(range);

      const contents = getHoverContents(word);

      return new vscode.Hover(contents, range);
    },
  }
);

// Function to get hover contents based on the hovered word
function getHoverContents(word) {
  // Customize the content based on the hovered word
  return new vscode.MarkdownString(`File created at ${fileCreatedAt}`);
}

module.exports = {
  activate,
  deactivate,
};
