// ==UserScript==
// @name         Rocket Jira
// @homepage     https://github.com/deftbrain/userscripts/tree/main/rocket-jira
// @version      1.1
// @description  A userscript that helps to automate some chore in Jira. The only feature for now is creating many subtasks (with specified estimate, assignee, and one custom select field) for a Jira issue from a context.
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
	const CONFIG_FIELD_CUSTOM_SELECT_FIELD_NAME_1 = 'customSelectFieldName1';
	const CONFIG_FIELD_CUSTOM_SELECT_FIELD_VALUE_1 = 'customSelectFieldValue1';
	const CONFIG_FIELDS = {
		[CONFIG_FIELD_PROJECT]: 'Project*',
		[CONFIG_FIELD_SUBTASK_ISSUE_TYPE]: 'Subtask Issue Type*',
		[CONFIG_FIELD_CUSTOM_SELECT_FIELD_NAME_1]: 'Custom Select Field Name',
		[CONFIG_FIELD_CUSTOM_SELECT_FIELD_VALUE_1]: 'Custom Select Field Value',
	};
	const CONFIG_JIRA_ENTITY_NAME_ID_DELIMITER = ' @ ';
	const JIRA_API_BASE_URL = `${window.location.protocol}//${window.location.hostname}/rest/api/2`;
	const JIRA_CUSTOM_SELECT_FIELD_SCHEMA = 'com.atlassian.jira.plugin.system.customfieldtypes:select';

	setupMenu();

	function setupMenu() {
		GM_registerMenuCommand('Preferences...', openPreferences);
		GM_registerMenuCommand('Create subtasks...', createSubtasks);
	}

	function createSubtasks() {
		for (const field of [CONFIG_FIELD_PROJECT, CONFIG_FIELD_SUBTASK_ISSUE_TYPE]) {
			if (!getValueFromConfig(field)) {
				alert(`The required field '${CONFIG_FIELDS[field]}' is not set in the preferences of the userscript!`);
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
			let [summary, estimate] = nameAndEstimate.trim().split('/');
			summary = summary && summary.trim();
			estimate = estimate && estimate.trim();
			if (!summary || !estimate) {
				alert(`Invalid input. Please copy the input, correct it and try again. Input: ${subtasks}`);
				return;
			}
			subtaskEstimateMap[summary] = estimate;
		}
		return sendRequest(JIRA_API_BASE_URL + '/myself')
			.then(data => {
				const issues = [];
				const commonFields = {
					assignee: {accountId: data.accountId},
					issuetype: {id: getIdFromConfig(CONFIG_FIELD_SUBTASK_ISSUE_TYPE)},
					parent: {key: parentIssueId},
					project: {id: getIdFromConfig(CONFIG_FIELD_PROJECT)},
				};
				const customSelectFieldName = getIdFromConfig(CONFIG_FIELD_CUSTOM_SELECT_FIELD_NAME_1);
				const customSelectFieldValue = getValueFromConfig(CONFIG_FIELD_CUSTOM_SELECT_FIELD_VALUE_1);
				if (customSelectFieldName && customSelectFieldValue) {
					commonFields[customSelectFieldName] = {value: customSelectFieldValue};
				}
				for (const [summary, estimate] of Object.entries(subtaskEstimateMap)) {
					issues.push({
						fields: {
							...commonFields,
							summary: summary,
							timetracking: {originalEstimate: estimate},
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
				const map = data.projects[0].issuetypes
					.filter(issueType => issueType.subtask)
					.map(issueType => `${issueType.name}${CONFIG_JIRA_ENTITY_NAME_ID_DELIMITER}${issueType.id}`);
				map.sort();
				return map;
			});
	}

	async function getIssueCustomSelectFields(projectId, issueTypeId) {
		return sendRequest(JIRA_API_BASE_URL + `/issue/createmeta?projectIds=${projectId}&issuetypeIds=${issueTypeId}&expand=projects.issuetypes.fields`)
			.catch(error => {
				alert(`Unable to fetch custom fields`);
				throw error;
			}).then(data => {
				const map = {};
				const fields = Object.values(data.projects[0].issuetypes[0].fields)
					.filter(field => field.schema.custom === JIRA_CUSTOM_SELECT_FIELD_SCHEMA);
				for (const field of fields) {
					const values = field.allowedValues.map(props => props.value);
					values.sort();
					map[field.name + CONFIG_JIRA_ENTITY_NAME_ID_DELIMITER + field.key] = values;
				}
				return map;
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
		return getIdFromConfig(CONFIG_FIELD_PROJECT);
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
							if (GM_config.fields[field] && getValueFromConfig(field)) {
								GM_config.fields[field].value = getValueFromConfig(field);
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

	function getIdFromConfig(field) {
		const value = getValueFromConfig(field);
		if (value) {
			return value.split(CONFIG_JIRA_ENTITY_NAME_ID_DELIMITER)[1];
		}

		return value;
	}

	function getValueFromConfig(field) {
		return GM_config.getValue(field) || null;
	}

	async function getFields() {
		const fields = {};
		let customFields;
		const project = getIdFromConfig(CONFIG_FIELD_PROJECT);
		for (const field in CONFIG_FIELDS) {
			let options;
			switch (field) {
				case CONFIG_FIELD_PROJECT:
					options = getProjects();
					break;
				case CONFIG_FIELD_SUBTASK_ISSUE_TYPE:
					if (project) {
						options = getSubtaskIssueTypes(project);
						break;
					}
				case CONFIG_FIELD_CUSTOM_SELECT_FIELD_NAME_1:
					const subtaskIssueType = getIdFromConfig(CONFIG_FIELD_SUBTASK_ISSUE_TYPE);
					if (project && subtaskIssueType) {
						customFields = await getIssueCustomSelectFields(project, subtaskIssueType);
						options = Object.keys(customFields);
						break;
					}
				case CONFIG_FIELD_CUSTOM_SELECT_FIELD_VALUE_1:
					const customSelectFieldNameRaw = getValueFromConfig(CONFIG_FIELD_CUSTOM_SELECT_FIELD_NAME_1);
					if (customFields && customSelectFieldNameRaw) {
						options = Object.values(customFields[customSelectFieldNameRaw]);
						break;
					}
				default:
					// Hide a project-dependent field from the config if the project is not set
					fields[field] = null;
					continue;
			}

			fields[field] = {
				label: CONFIG_FIELDS[field],
				type: 'select',
				options: ['', ...(await options)],
				save: false,
			};
		}

		return fields;
	}
})();
