import * as vscode from 'vscode';
import { PredictionServiceClient, helpers } from '@google-cloud/aiplatform';
import * as protos from '@google-cloud/aiplatform/build/protos/protos';

// Vertex AI LLM default parameter values
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_TOPP = 0.95;
const DEFAULT_TOPK = 40;

function getSelectedText(editor: vscode.TextEditor | undefined): string | undefined {
	const selection = editor?.selection;

	if (selection && !selection.isEmpty) {
		const selectionRange = new vscode.Range(
			selection.start.line,
			selection.start.character,
			selection.end.line,
			selection.end.character);

			return editor.document.getText(selectionRange);
	}

	throw new Error('No text currently highlighted!');
}

async function makePrediction(
	predictionService: PredictionServiceClient,
	project: string, 
	location: string, 
	context: string, 
	query: string): Promise<[protos.google.cloud.aiplatform.v1.IPredictResponse, protos.google.cloud.aiplatform.v1.IPredictRequest | undefined, {} | undefined]> {
		const endpoint = `projects/${project}/locations/${location}/publishers/google/models/chat-bison`;
		const prompt = {
			context: context,
			messages: [
				{
					author: 'user',
					content: query
				}
			]
		};

		const requestParams = {
			temperature: DEFAULT_TEMPERATURE,
			maxOutputTokens: DEFAULT_MAX_TOKENS,
			topP: DEFAULT_TOPP,
			topK: DEFAULT_TOPK
		};

		const parameters = helpers.toValue(requestParams);
		const instanceValue = helpers.toValue(prompt);
		const instances = [instanceValue!];
		const request = {
			endpoint,
			instances,
			parameters: parameters
		};

		return predictionService.predict(request);
	}

export function activate(context: vscode.ExtensionContext) {

	let configuration = vscode.workspace.getConfiguration("code-summarizer");
	

	const project = configuration['GCPProject'];
	const location = configuration['GCPRegion'];

	if (project.length === 0 || location.length === 0) {
		vscode.window.showErrorMessage("Please set GCP Project and GCP Region in Code Summarizer settings before use.");
	}

	let predictionService = new PredictionServiceClient({
		apiEndpoint: `${location}-aiplatform.googleapis.com`
	});

	// register a content provider for the cowsay-scheme
	const myScheme = 'codesummarize';
	const myProvider = new class implements vscode.TextDocumentContentProvider {

		// emitter and its event
		onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
		onDidChange = this.onDidChangeEmitter.event;

		provideTextDocumentContent(uri: vscode.Uri): string {
			return uri.path;
		}
	};
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(myScheme, myProvider));

	let summarizeCommand = vscode.commands.registerCommand('code-summarizer.summarizeCode', () => {
		try {
			const editor = vscode.window.activeTextEditor;
			const selectedText = getSelectedText(editor);

			vscode.window.showInformationMessage("A summary will appear in another view shortly");

			const predictionContext = 'You are a senior developer that\'s good at summarizing complex code into simple terms.';
			const prompt = `Please explain what this code does: ${selectedText}`;

			makePrediction(
				predictionService,
				project,
				location,
				predictionContext,
				prompt).then(async (value) => {
				let summary = (value?.[0]?.predictions?.[0]?.structValue?.
					fields?.candidates?.listValue?.values?.[0]?.structValue?.
					fields?.['content']?.stringValue);

				if (summary === null || summary?.trim() === "") {
					summary = "No summary available.";
				}

				const uri = vscode.Uri.parse(`${myScheme}:Summary:\n${summary!.trim()}`);
				const doc = await vscode.workspace.openTextDocument(uri);
				await vscode.window.showTextDocument(doc, { preview: false });
			}).catch((reason) => {
				vscode.window.showErrorMessage(reason.message);
			});
		} catch (error) {
			if (error instanceof Error) {
				vscode.window.showErrorMessage(error.message);
			}
			return;
		}
	});

	let makeCodeRecommendations = vscode.commands.registerCommand('code-summarizer.makeCodeRecommendations', () => {
		try {
			const editor = vscode.window.activeTextEditor;
			const selectedText = getSelectedText(editor);

			vscode.window.showInformationMessage("Recommendations will appear in another view shortly");

			const predictionContext = 'You are a senior developer that\'s good at providing concise, constructive feedback on how code is written.';
			const prompt = `Please suggest ways to improve my code, if possible. If my solution is optimal, tell me I did a great job. Here is the code: ${selectedText}`;

			makePrediction(
				predictionService,
				project,
				location,
				predictionContext,
				prompt).then(async (value) => {
					let summary = (value?.[0]?.predictions?.[0]?.structValue?.
						fields?.candidates?.listValue?.values?.[0]?.structValue?.
						fields?.['content']?.stringValue);
	
					if (summary === null || summary?.trim() === "") {
						summary = "No recommendations available.";
					}
					const uri = vscode.Uri.parse(`${myScheme}:Recommendations:\n${summary!.trim()}`);
					const doc = await vscode.workspace.openTextDocument(uri);
					await vscode.window.showTextDocument(doc, { preview: false });
				}).catch((reason) => {
					vscode.window.showErrorMessage(reason.message);
				});
		} catch (error) {
			if (error instanceof Error) {
				vscode.window.showErrorMessage(error.message);
			}
			return;
		}
	});

	context.subscriptions.push(summarizeCommand);
	context.subscriptions.push(makeCodeRecommendations);
}

export function deactivate() {}

export const exportedForTesting = {
	getSelectedText,
	makePrediction
};
