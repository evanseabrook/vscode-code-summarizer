# code-summarizer 

This is a simple VSCode extension that allows you to summarize code you've selected in your editor window using generative AI.

## Requirements
This project utilized Google Cloud's `chat-bison` model for summarization. As a result, you will need to install the `gcloud CLI` using [these instructions](https://cloud.google.com/sdk/docs/install).

Once `gcloud` is installed, you will need to create a project and set your Application Default Credentials to make use of the extension: 
```sh
gcloud auth login -update-adc
```

## Settings
Upon installing this extension, yo
