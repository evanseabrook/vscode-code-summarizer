import * as vscode from 'vscode';
import { PredictionServiceClient, helpers } from '@google-cloud/aiplatform';
import * as protos from '@google-cloud/aiplatform/build/protos/protos';

// Vertex AI LLM default parameter values
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_MAX_TOKENS = 256;
const DEFAULT_TOPP = 0.95;
const DEFAULT_TOPK = 40;

function getSelectedText(editor: vscode.TextEditor | undefined): string | undefined {
	const selection = editor?.selection;
	protos.google.cloud.aiplatform.v1.PredictResponse

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

		const parameters = helpers.toValue(requestParams)
		const instanceValue = helpers.toValue(prompt);
		const instances = [instanceValue!];
		const request = {
			endpoint,
			instances,
			parameters: parameters
		}
		
		return predictionService.predict(request)
	}

export function activate(context: vscode.ExtensionContext) {

	let configuration = vscode.workspace.getConfiguration("code-summarizer");
	const editor = vscode.window.activeTextEditor;

	const project = configuration['GCPProject'];
	const location = configuration['GCPRegion'];

	let predictionService = new PredictionServiceClient({
		apiEndpoint: `${location}-aiplatform.googleapis.com`
	});

	let summarizeCommand = vscode.commands.registerCommand('code-summarizer.summarizeCode', () => {
		try {
			const selectedText = getSelectedText(editor);

			const predictionContext = 'You are a senior developer that\'s good at summarizing complex code into simple terms.';
			const prompt = `Please explain what this code does: ${selectedText}`;

			makePrediction(
				predictionService,
				project,
				location,
				predictionContext,
				prompt).then((value) => {
				let summary = (value?.[0]?.predictions?.[0]?.structValue?.
					fields?.candidates?.listValue?.values?.[0]?.structValue?.
					fields?.['content']?.stringValue);

				if (summary == null) {
					summary = "No summary available.";
				}
				vscode.window.showInformationMessage(summary!);
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
			const selectedText = getSelectedText(editor);

			const predictionContext = 'You are a senior developer that\'s good at providing concise, constructive feedback on how code is written.';
			const prompt = `Please suggest ways to improve my code, if possible. If my solution is optimal, tell me I did a great job. If providing examples, keep them short. Here is the code: ${selectedText}`;

			makePrediction(
				predictionService,
				project,
				location,
				predictionContext,
				prompt).then((value) => {
					let summary = (value?.[0]?.predictions?.[0]?.structValue?.
						fields?.candidates?.listValue?.values?.[0]?.structValue?.
						fields?.['content']?.stringValue);
	
					if (summary == null) {
						summary = "No summary available.";
					}
					vscode.window.showInformationMessage(summary!);
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
