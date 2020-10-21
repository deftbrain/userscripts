// ==UserLibrary==
// @name          GM_config True Select Field.
// @description   Custom select field definition for inclusion in user scripts that use GM_config library (https://github.com/sizzlemctwizzle/GM_config).
//                Provides ability to use labels for options and select multiple options.
// @copyright     2020 Andrey Kartashov (https://github.com/deftbrain)
// @license       MIT (https://raw.githubusercontent.com/deftbrain/userscripts/main/LICENSE)
// ==/UserLibrary==

var GM_config_true_select_field_type = {
	default: null,
	toNode: function() {
		const field = this.settings;
		const value = this.value;
		const id = this.id;
		const create = this.create;
		const fieldId = this.configId + '_field_' + id;
		const wrapper = create('div', {
			className: 'config_var',
			id: fieldId + '_var',
			title: field.title || ''
		});

		wrapper.appendChild(create('label', {
			innerHTML: field.label,
			id: fieldId + '_field_label',
			for: fieldId,
			className: 'field_label'
		}));

		const select = create('select', {
			id: fieldId,
			multiple: field.multiple || false,
			size: field.size || 1
		});
		for (let label in field.options) {
			const optionValue = field.options[label];
			select.appendChild(create('option', {
				value: optionValue,
				innerHTML: label,
				selected: select.multiple
					? value.indexOf(optionValue) !== -1
					: value === optionValue
			}));
		}

		wrapper.appendChild(select);
		return wrapper;
	},
	toValue: function() {
		if (this.wrapper) {
			const select = this.wrapper.getElementsByTagName('select')[0];
			if (select.multiple) {
				return Array.from(select.selectedOptions).map(o => o.value);
			}

			return select.value;
		}
		return null;
	},
	reset: function() {
		if (this.wrapper) {
			this.wrapper.getElementsByTagName('select')[0].selectedIndex = -1;
		}
	}
};
