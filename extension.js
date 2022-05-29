
const vscode = require('vscode');



var authorName;
var dateTime;

/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {

	let disposable = vscode.commands.registerCommand('code-stamp.addstamp', function () {
	if(authorName == undefined){
		findFileName();
		startInputProcess();
	}else{
		findFileName();
		checkAlreadyAdded();
	}

	});

	let disposable2 = vscode.commands.registerCommand('code-stamp.updateAuthorName', function () {
		startInputProcess();
	});
		


	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
}

// this method is called when your extension is deactivated
function deactivate() {}



//get author name from the user
async function startInputProcess(){
	await vscode.window.showInputBox({
		value: '',	
		placeHolder: "Enter the Author name to be stamped",
		ignoreFocusOut: true
	}).then(function(value){
		authorName = value;
		checkAlreadyAdded();
	}).catch(err => console.log(err));
}

function addComment(authorName){
		const date = new Date().toLocaleDateString();
		const time = new Date().toLocaleTimeString();
		const date_nd_time = date + "  " + time;
		dateTime = date_nd_time;
		if(findFileName() === 'py' || findFileName() === "r"){
			vscode.window.activeTextEditor.edit(editBuilder => {
				editBuilder.insert(new vscode.Position(0,0), "#"  + " " + "Author name : " + authorName + "\n" + "#" + " " + "Created at : " + dateTime + "\n" + "#" + " " + "Updated at :" + date_nd_time + "\n" + "\n" + "\n");
				// Display a message box to the user
				vscode.window.showInformationMessage('Author stamp added successfully');
			} );
		}else{
			vscode.window.activeTextEditor.edit(editBuilder => {
				editBuilder.insert(new vscode.Position(0,0), '/**' + "\n" + "Author name : " + authorName + "\n" +  "Created at : " + dateTime + "\n" + "Updated at :" + date_nd_time + "\n" +'*/' + "\n" + "\n");
				// Display a message box to the user
				vscode.window.showInformationMessage('Author stamp added successfully');
			} );

		}

	}

function checkAlreadyAdded(){
	if(vscode.window.activeTextEditor.document.getText().includes('Author name')){
		replaceComment(authorName);
	}else{
		addComment(authorName);
	}
}
	
	

function replaceComment(authorName){
	const date = new Date().toLocaleDateString();
	const time = new Date().toLocaleTimeString();
	const date_nd_time = date + "  " + time;

	if(findFileName() === 'py' || findFileName() === "r"){
		vscode.window.activeTextEditor.edit(editBuilder => {
			editBuilder.replace(new vscode.Range(new vscode.Position(0,0), new vscode.Position(3,0)), "#" + " " + "Author name : " + authorName + "\n" + "#" + " " + "Created at : " + dateTime + "\n" + "#" + " " + "Updated at :" + date_nd_time + "\n"  + "\n" + "\n");
			// Display a message box to the user
			vscode.window.showInformationMessage('Author stamp updated successfully');
		} );
	}else{
		vscode.window.activeTextEditor.edit(editBuilder => {
			editBuilder.replace(new vscode.Range(new vscode.Position(0,0), new vscode.Position(5,0)), '/**' + "\n" + "Author name : " + authorName + "\n" +  "Created at : " + dateTime + "\n" + "Updated at :" + date_nd_time + "\n" + '*/' + "\n" + "\n");
			vscode.window.showInformationMessage('Author stamp updated successfully');
		});

	}


}
function findFileName(){
	const fileName = vscode.window.activeTextEditor.document.fileName;
	var fileExtension = fileName.substr(fileName.lastIndexOf('.') + 1);
	return fileExtension;
}




module.exports = {
	activate,
	deactivate
}

