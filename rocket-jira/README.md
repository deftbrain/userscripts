# Rocket Jira
A [userscript](https://openuserjs.org/about/Userscript-Beginners-HOWTO) that helps to automate some chore in Jira.  
Avaiable features:
* creating many subtasks at once (with specified estimate, assignee, and one custom select field) for a Jira issue from a context
* filling out the Tempo.io weekly timesheet with predefined daily hours for needed tasks

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
1. If you use self-hosted Jira instance and its hostname doesn't contain `jira` subdomain, you have to add its URL to a list of allowed URLs where the userscript can be run:
    1. In browser click the Tampermonkey extension icon -> `Dashboard` -> click the `Rocker Jira` label in the list -> go to the `Settings` tab -> in the section `Includes/Excludes` click the `Add...` button within the `User matches` subsection and add your instance URL with an asterisk symbol (*) at the end to make the userscript work on any page e.g. `https://some.hostname/*`.
1. Open any page of your Jira instance in the browser. If everything is okay you will see some number on the Tampermonkey extension icon. The number shows the how many userscripts enbaled on that particular page;
1. Staying in the same tab, click the Tampermonkey extension icon -> `Rocket Jira` -> `Preferences...`;
1. Adjust settings for the needed functionality only using the below subsections.

### Adjust creating subtasks
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

### Adjust filling out the Tempo.io weekly timesheet
1. Go to the Tempo.io page with a weekly timesheet in your Jira instance in a separate tab (it should be something like https://your.jira.hostname/secure/Tempo.jspa);
1. Open the `Network` tab in the `DevTool` panel of your browser;
1. Log time that you log everyday for a particular task for any of available days (for one day only!) via Tempo.io interface integrated into your Jira instance;
1. Find an AJAX POST request to the Tempo.io endpoint (should be something like https://your.jira.hostname/rest/tempo-timesheets/4/worklogs/).
1. Copy a JSON object from the request body. Should be something like: `{"attributes": { "customAttributeName": { "name": "Attribute Name", "workAttributeId": 2, "value": "attributeValue" } }, "billableSeconds": "", "worker": "firstname.secondname", "comment": null, "started": "2021-10-11", "timeSpentSeconds": 3600, "originTaskId": "123345", "remainingEstimate": 0, "endDate": null, "includeNonWorkingDays": false}`
1. Add that JSON onbject to a JSON array without any chnages. Should be something like: `[{"attributes": { "customAttributeName": { "name": "Attribute Name", "workAttributeId": 2, "value": "attributeValue" } }, "billableSeconds": "", "worker": "firstname.secondname", "comment": null, "started": "2021-10-11", "timeSpentSeconds": 3600, "originTaskId": "123345", "remainingEstimate": 0, "endDate": null, "includeNonWorkingDays": false}]`
1. Log time that you log everyday for another task if needed and add the related JSON object from a request body to the array as well. Should be something like: `[{"attributes": { "customAttributeName": { "name": "Attribute Name", "workAttributeId": 2, "value": "attributeValue" } }, "billableSeconds": "", "worker": "firstname.secondname", "comment": null, "started": "2021-10-11", "timeSpentSeconds": 3600, "originTaskId": "123345", "remainingEstimate": 0, "endDate": null, "includeNonWorkingDays": false}, {"attributes": { "customAttributeName": { "name": "Attribute Name", "workAttributeId": 2, "value": "attributeValue" } }, "billableSeconds": "", "worker": "firstname.secondname", "comment": null, "started": "2021-10-11", "timeSpentSeconds": 23400, "originTaskId": "567890", "remainingEstimate": 0, "endDate": null, "includeNonWorkingDays": false}]`
1. Copy the final JSON array into the `Daily worklogs` textarea in the userscript `Preferences` window;
1. Uncheck the `Confirm affected dates before sending worklogs?` checkbox if you don't want to see a confirmation dialog before sending weekly timesheet to Jira;
1. Click the `Save` button;
1. Click the `Close` button.
1. Remove time logged manually from the timesheet because the script will create it for every day from the weekly timesheet (by default from the current week timesheet) using elements from the JSON array template (only date will be changed for every day).

## Usage
### Creating subtasks
1. Open an issue you would like to add subtasks to in Jira (from a board or in a separate tab, both ways are supported);
1. Staying in the same tab, click the Tampermonkey extension icon -> `Rocket Jira` -> `Create subtasks...`;
1. Enter the subtask name and estimate in Jira format (e.g. `1h 30m`) separating them with a slash (`/`).
 You can specify multiple name-estimate pairs separating them with a comma (`,`);
1. Wait for the alert with the status of the operation.

### Filling out the Tempo.io weekly timesheet
1. Open any page of your Jira instance in the browser;
1. Staying in the same tab, click the Tampermonkey extension icon -> `Rocket Jira` -> `Fill out Tempo.io weekly timesheet`;
1. If you didn't disabled the confirmation dialog you will see dates that will be affected and you also will get an ability to log time for a previous week (read information form the dialog for more details);
1. Click OK if dates looks okay;
1. If you did that staying on the Tempo.io page in your Jira instance, the page will be reloaded to let you see filled out timesheet. Otherwise the Tempo.io page will be opened in a new tab automatically once operation is completed.

## Getting updates
By default, Tampermonkey checks for userscript updates every day.
It will show you a notification in a browser once an update is available.
Click the notification to see update details and install it if you are ready.
You can check for updates manually clicking the Tampermonkey extension icon -> `Check for userscript updates`.
