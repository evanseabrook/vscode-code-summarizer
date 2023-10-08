# code-summarizer 
Author: Evan Seabrook

This is a simple VSCode extension that allows you to summarize code you've selected in your editor window using generative AI.



## Motiviation
This extension was built as a personal project to:
1. Learn the VSCode Extension ecosystem/API
2. Build something practical that utilize's Google's Vertex AI LLM offerings
3. Learn some TypeScript

My hope is that it can be helpful to someone and, failing that, I feel I've met all of the goals I've set as motivation -- so it did help me :).

## Requirements
This project utilized Google Cloud's `chat-bison` model for summarization. As a result, you will need to install the `gcloud CLI` using [these instructions](https://cloud.google.com/sdk/docs/install).

Once `gcloud` is installed, you will need to create a project and set your Application Default Credentials to make use of the extension: 
```sh
gcloud auth login -update-adc
```

## Build
To build the extension package, run the following:

```sh
vsce package
```

## Install Locally
To install the extension locally, please:
1. First run the command from the `Build` step above
2. Navigate to the Extensions view in vscode
3. Click on the 3 dotes on the top right of the Extensions view
4. Click `Install from VSIX` and navigate to the `.vsix` file created during the build
5. Configure Code Summarizer's Extension settings  
    i. Open VSCode's settings  
    ii. Navigate to Extensions  
    iii. Find Code Summarizer and fill in details for your Google Cloud project (view the Requirements section above for more details)
