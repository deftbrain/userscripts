# Rocket Jira
A [userscript](https://openuserjs.org/about/Userscript-Beginners-HOWTO) that
helps to automate some chore in Jira. The only feature for now is creating
many subtasks with estimate and assignee for a Jira issue from a context.

## Requirements
* Chrome 76+ / Firefox 71+ / Safari 13+ / Edge 79+
* [Tampermonkey](http://www.tampermonkey.net/) browser extension
* JIRA 7.0+ instance (by default the script is enabled on the 'https://**.atlassian.net/*'
 pages, but you can change that criteria via script settings)
* You have to be authorized in your Jira instance to let the script send authorized requests on your behalf

## Installation
1. Open the [userscript](https://github.com/deftbrain/userscripts/raw/main/rocket-jira/rocket-jira.user.js) in a browser.
 _Tampermonkey will pick up the file automatically and ask you to install it_;
1. Click the `Install` button;
1. Open any page of your Jira instance in the browser;
1. Staying in the same tab, click the `Tampermonkey` extension icon
 -> `Rocket Jira` -> `Preferences...`;
1. Select a Jira project you work on in the `Project` dropdown;
1. Click the `Save` button in the modal window and wait for a few seconds until the window appears again.
 _The new option `Subtask Issue Type` will appear in the modal window after that action_;
1. Select an issue type for subtasks you are going to create in the future;
1. Click the `Save` button;
1. Click the `Close` button.

## Usage
1. Open an issue in Jira (from a board or in a separate tab);
1. Staying in the same tab, click the `Tampermonkey` extension icon
 -> `Rocket Jira` -> `Create subtasks...`;
1. Enter the subtask name and estimate in Jira format (e.g. `1h 30m`) dividing them by slash `/`.
 You can specify multiple name-estimate pairs dividing them by comma `,`;
1. Wait for the alert with the status of the operation.
