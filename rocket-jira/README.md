# Rocket Jira
A [userscript](https://openuserjs.org/about/Userscript-Beginners-HOWTO) helps to
automate some chore in Jira. The only feature for now is creating many subtasks
(with specified estimate, assignee, and one custom select field) for a Jira issue
from a context.

## Requirements
* Chrome 76+ / Firefox 71+ / Safari 13+ / Edge 79+
* [Tampermonkey](http://www.tampermonkey.net/) browser extension
* [JIRA 7.0+](https://docs.atlassian.com/software/jira/docs/api/REST/7.0.0/) instance (by default the script is enabled on the 'https://**.atlassian.net/*'
 pages, but you can change that criteria via script settings)
* You have to be authorized in your Jira instance to let the script send authorized requests on your behalf

## Installation
1. Open the [userscript](https://github.com/deftbrain/userscripts/raw/main/rocket-jira/rocket-jira.user.js) in a browser;  
 _Tampermonkey will pick up the file automatically and ask you to install it._
1. Click the `Install` button;
1. Open any page of your Jira instance in the browser;
1. Staying in the same tab, click the Tampermonkey extension icon -> `Rocket Jira` -> `Preferences...`;
1. Select a Jira project you work on in the `Project` dropdown;
1. Click the `Save` button in the modal window and wait for a few seconds until the window appears again
 (sorry for that annoying way, we already have an [issue for improvement](https://github.com/deftbrain/userscripts/issues/1));  
 _The new option `Subtask Issue Type` will appear in the modal window after that action._
1. Select an issue type for subtasks you are going to create in the future;
1. Click the `Save` button;
1. If you need to set some custom field (currently only the `select` field is supported):
    1. Select a field name using the `Custom Select Field Name` dropdown and click the `Save` button;
    1. Select a field value using the `Custom Select Field Value` dropdown and click the `Save` button.
1. Click the `Close` button.

## Usage
1. Open an issue you would like to add subtasks to in Jira (from a board or in a separate tab, both ways are supported);
1. Staying in the same tab, click the Tampermonkey extension icon -> `Rocket Jira` -> `Create subtasks...`;
1. Enter the subtask name and estimate in Jira format (e.g. `1h 30m`) separating them with a slash (`/`).
 You can specify multiple name-estimate pairs separating them with a comma (`,`);
1. Wait for the alert with the status of the operation.

## Getting updates
By default, Tampermonkey checks for userscript updates every day.
It will show you a notification in a browser once an update is available.
Click the notification to see update details and install it if you are ready.
You can check for updates manually clicking the Tampermonkey extension icon -> `Check for userscript updates`.
