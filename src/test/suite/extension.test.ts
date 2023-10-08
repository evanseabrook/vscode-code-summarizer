import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as codeSummarizerExt from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Test empty editor selection w/ getSelectedText throws exception', () => {
		const editor = vscode.window.activeTextEditor;

		assert.throws(() => {
			codeSummarizerExt.exportedForTesting.getSelectedText(editor);
		});
	});

	test('Test getSelectedText gets text selected in editor', () => {
		const expectedValue =  "Here is some text.";

		vscode.workspace.openTextDocument({content: expectedValue}).then(doc => {
			vscode.window.showTextDocument(doc, {
				selection: new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(0, (expectedValue.length - 1)))
			}).then(editor => {
				const selectedText = codeSummarizerExt.exportedForTesting.getSelectedText(editor);
				assert.equal(selectedText, expectedValue);
			});
		});
	});
});
