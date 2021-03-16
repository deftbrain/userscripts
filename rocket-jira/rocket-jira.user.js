// ==UserScript==
// @name         Rocket Jira
// @homepage     https://github.com/deftbrain/userscripts/tree/main/rocket-jira
// @version      1.0
// @description  A userscript that helps to automate some chore in Jira.
//               The only feature for now is creating many subtasks with estimate and assignee for a Jira issue from a context.
// @author       https://github.com/deftbrain
// @match        https://*.atlassian.net/*
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.min.js
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
	'use strict';

	const CONFIG_ID = 'main';
	const CONFIG_FIELD_PROJECT = 'project';
	const CONFIG_FIELD_SUBTASK_ISSUE_TYPE = 'subtaskIssueType';
	const CONFIG_FIELDS = {
		[CONFIG_FIELD_PROJECT]: 'Project',
		[CONFIG_FIELD_SUBTASK_ISSUE_TYPE]: 'Subtask Issue Type',
	};
	const CONFIG_JIRA_ENTITY_NAME_ID_DELIMITER = ' @ ';
	const JIRA_API_BASE_URL = `${window.location.protocol}//${window.location.hostname}/rest/api/2`;

	setupMenu();

	function setupMenu() {
		GM_registerMenuCommand('Preferences...', openPreferences);
		GM_registerMenuCommand('Create subtasks...', createSubtasks);
	}

	function createSubtasks() {
		for (const field in CONFIG_FIELDS) {
			if (!getRawConfigValue(field)) {
				alert('Required fields are not set in the preferences of the userscript!');
				return;
			}
		}

		const parentIssueId = getParentIssueId();
		const subtasks = prompt('Subtask names and estimates:', 'First subtask summary/2h, Second subtask summary/1h 30m');
		if (!subtasks) {
			return;
		}

		const subtaskEstimateMap = {};
		for (const nameAndEstimate of subtasks.split(',')) {
			const [summary, estimate] = nameAndEstimate.trim().split('/');
			subtaskEstimateMap[summary] = estimate.trim();
		}
		const project = getConfigValue(CONFIG_FIELD_PROJECT);
		const issueType = getConfigValue(CONFIG_FIELD_SUBTASK_ISSUE_TYPE);
		return sendRequest(JIRA_API_BASE_URL + '/myself')
			.then(data => {
				const issues = [];
				for (const [summary, estimate] of Object.entries(subtaskEstimateMap)) {
					issues.push({
						fields: {
							project: {
								id: project
							},
							parent: {
								key: parentIssueId
							},
							summary: summary,
							issuetype: {
								id: issueType
							},
							assignee: {
								accountId: data.accountId
							},
							timetracking: {
								originalEstimate: estimate
							}
						}
					});
				}
				const requestBody = {issueUpdates: issues};
				console.log('Jira subtask creation request body:', requestBody);
				return sendRequest(JIRA_API_BASE_URL + '/issue/bulk', 'POST', JSON.stringify(requestBody));
			})
			.then(() => alert('Success'))
			.catch(error => {
				console.error(error);
				alert(error.message)
				throw error;
			});
	}

	function getParentIssueId() {
		const params = new URLSearchParams(window.location.search);
		let parentIssueId = params.get('selectedIssue');
		if (!parentIssueId) {
			const pathComponents = window.location.pathname.split('/');
			parentIssueId = pathComponents[pathComponents.length - 1];
		}

		if (!parentIssueId.match(/^[A-Z]*-\d+$/)) {
			const error = 'Unable to parse parent issue ID';
			alert(error);
			throw new Error(error);
		}

		return parentIssueId;
	}

	async function getProjects() {
		return sendRequest(JIRA_API_BASE_URL + '/project')
			.catch(error => {
				alert(`Unable to fetch a list of projects`);
				throw error;
			}).then(projects => {
				projects.sort((a, b) => {
					if (a.name === b.name) {
						return 0;
					}

					return a.name > b.name ? 1 : -1;
				});
				return projects.map(project => `${project.name}${CONFIG_JIRA_ENTITY_NAME_ID_DELIMITER}${project.id}`)
			});
	}

	async function getSubtaskIssueTypes(projectId) {
		return sendRequest(JIRA_API_BASE_URL + `/issue/createmeta?projectIds=${projectId}`)
			.catch(error => {
				alert(`Unable to fetch a list of subtask issue types`);
				throw error;
			}).then(data => {
				return data.projects[0].issuetypes
					.filter(issueType => issueType.subtask)
					.map(issueType => `${issueType.name}${CONFIG_JIRA_ENTITY_NAME_ID_DELIMITER}${issueType.id}`);
			});
	}

	function openPreferences() {
		return prepareConfig().then(config => {
			GM_config.init(config);
			GM_config.open();
		});
	}

	function sendRequest(url, method = 'GET', body = null) {
		return new Promise((resolve, reject) => {
			GM_xmlhttpRequest({
				method: method,
				timeout: 5000,
				onerror: reject,
				ontimeout: reject,
				onload: resolve,
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
					// If a user agent is not passed - a POST request fails with 403 error
					'User-Agent': 'Any',
				},
				data: body,
				url: url,
			});
		}).then(response => {
			if ([200, 201].indexOf(response.status) !== -1) {
				return JSON.parse(response.responseText);
			}
			throw new Error(response.status + ' ' + response.statusText);
		});
	}

	function getProject() {
		return getConfigValue(CONFIG_FIELD_PROJECT);
	}

	function prepareConfig() {
		return getFields().then(fields => {
			return {
				id: CONFIG_ID,
				title: 'Preferences',
				fields: fields,
				events: {
					open: function(doc) {
						// Hide 'Reset to defaults' link because it
						// doesn't work well out from the box in our case
						doc.getElementById(CONFIG_ID + '_resetLink').remove();
					},
					init: function() {
						for (const field in CONFIG_FIELDS) {
							if (GM_config.fields[field] && getRawConfigValue(field)) {
								GM_config.fields[field].value = getRawConfigValue(field);
							}
						}
					},
					save: function(values) {
						const shouldReinitializeConfig = getProject() != values[CONFIG_FIELD_PROJECT];
						for (const field in values) {
							GM_config.setValue(field, values[field]);
						}
						if (shouldReinitializeConfig) {
							GM_config.close();
							openPreferences();
						}
					},
				}
			};
		});
	}

	function getConfigValue(field) {
		const value = getRawConfigValue(field);
		if (value) {
			return value.split(CONFIG_JIRA_ENTITY_NAME_ID_DELIMITER)[1];
		}

		return value;
	}

	function getRawConfigValue(field) {
		return GM_config.getValue(field) || null;
	}

	async function getFields() {
		const fields = {};
		const project = getProject();
		for (const field in CONFIG_FIELDS) {
			if (!project && field !== CONFIG_FIELD_PROJECT) {
				// Hide a project-dependent field from the config if the project is not set
				fields[field] = null;
				continue;
			}

			// Hardcode getting options since we have to few fields
			const options = field === CONFIG_FIELD_PROJECT
				? await getProjects()
				: await getSubtaskIssueTypes(project);

			fields[field] = {
				label: CONFIG_FIELDS[field],
				type: 'select',
				options: options,
				save: false,
			};
		}

		return fields;
	}
})();
