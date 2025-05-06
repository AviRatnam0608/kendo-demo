var finys = finys || {};
{
	const ui = finys.ui ||= {};

	let _session = finys.meta("finys-session");
	const _generateSessionIdentifier = function () {
		const id = UUID.generate();
		return `${id.slice(0, 8)}${id.slice(9, 13)}${id.slice(15, 18)}${id.slice(19, 23)}${id.slice(24)}`;
	}

	ui.getSessionIdentifier = function () {
		_session ??= _generateSessionIdentifier();
		finys.meta("finys-session", _session);
		return _session;
	}

	ui.hiddenMaskUtilities = class HiddenMaskUtilities {
		static initializeHiddenMask(maskedTextBoxId) {
			if (maskedTextBoxId == null || maskedTextBoxId == undefined) {
				return;
			}

			let maskedTextBox = $('#' + maskedTextBoxId);

			if (maskedTextBox.length == 0) {
				return;
			}

			let hiddenMaskData = this.#getHiddenMaskData({ target: maskedTextBox });

			if (hiddenMaskData == null) {
				return;
			}

			this.#updateHiddenMaskValue(hiddenMaskData);
		}

		static onHiddenMaskedTextBoxFocus(event) {
			let hiddenMaskData = this.#getHiddenMaskData(event);

			if (hiddenMaskData == null) {
				return;
			}

			this.#showHiddenMask(hiddenMaskData);

			let maskedTextBox = hiddenMaskData.maskedTextBox;
			let hiddenMaskedTextBox = hiddenMaskData.hiddenMaskedTextBox;

			hiddenMaskedTextBox.blur();
			maskedTextBox.focus();
		}

		static onMaskedTextBoxFocus(event) {
			let hiddenMaskData = this.#getHiddenMaskData(event);

			if (hiddenMaskData == null) {
				return;
			}

			this.#disableVisibilityToggleButton(hiddenMaskData);
		}

		static onMaskedTextBoxBlur(event) {
			let hiddenMaskData = this.#getHiddenMaskData(event);

			if (hiddenMaskData == null) {
				return;
			}

			this.#updateHiddenMaskValue(hiddenMaskData);
			this.#hideHiddenMask(hiddenMaskData);
			this.#enableVisibilityToggleButton(hiddenMaskData);

			let hiddenMaskedTextBox = hiddenMaskData.hiddenMaskedTextBox;
			hiddenMaskedTextBox.blur();
		}

		static onToggleVisibility(event) {
			let hiddenMaskData = this.#getHiddenMaskData(event);

			if (hiddenMaskData == null) {
				return;
			}

			this.#toggleHiddenMaskVisibility(hiddenMaskData);
		}

		static #toggleHiddenMaskVisibility(hiddenMaskData) {
			let viewModel = hiddenMaskData.viewModel;
			let maskedTextBoxVisibilityPropertyName = hiddenMaskData.maskedTextBoxVisibilityPropertyName;
			let isMaskedTextBoxVisible = viewModel.get(maskedTextBoxVisibilityPropertyName, true);

			if (isMaskedTextBoxVisible) {
				this.#hideHiddenMask(hiddenMaskData);
			} else {
				this.#showHiddenMask(hiddenMaskData);
			}
		}

		static #showHiddenMask(hiddenMaskData) {
			let viewModel = hiddenMaskData.viewModel;
			let maskedTextBoxVisibilityPropertyName = hiddenMaskData.maskedTextBoxVisibilityPropertyName;
			let hiddenMaskedTextBoxVisibilityPropertyName = hiddenMaskData.hiddenMaskedTextBoxVisibilityPropertyName;
			let visibilityButtonTextPropertyName = hiddenMaskData.visibilityButtonTextPropertyName;

			viewModel.set(maskedTextBoxVisibilityPropertyName, true);
			viewModel.set(hiddenMaskedTextBoxVisibilityPropertyName, false);
			viewModel.set(visibilityButtonTextPropertyName, 'Hide');
		}

		static #hideHiddenMask(hiddenMaskData) {
			let viewModel = hiddenMaskData.viewModel;
			let maskedTextBoxVisibilityPropertyName = hiddenMaskData.maskedTextBoxVisibilityPropertyName;
			let hiddenMaskedTextBoxVisibilityPropertyName = hiddenMaskData.hiddenMaskedTextBoxVisibilityPropertyName;
			let visibilityButtonTextPropertyName = hiddenMaskData.visibilityButtonTextPropertyName;

			viewModel.set(maskedTextBoxVisibilityPropertyName, false);
			viewModel.set(hiddenMaskedTextBoxVisibilityPropertyName, true);
			viewModel.set(visibilityButtonTextPropertyName, 'Show');
		}

		static #enableVisibilityToggleButton(hiddenMaskData) {
			let viewModel = hiddenMaskData.viewModel;
			let visibilityButtonEnabledPropertyName = hiddenMaskData.visibilityButtonEnabledPropertyName;

			viewModel.set(visibilityButtonEnabledPropertyName, true);
		}

		static #disableVisibilityToggleButton(hiddenMaskData) {
			let viewModel = hiddenMaskData.viewModel;
			let visibilityButtonEnabledPropertyName = hiddenMaskData.visibilityButtonEnabledPropertyName;

			viewModel.set(visibilityButtonEnabledPropertyName, false);
		}

		static #getHiddenMaskData(event) {
			let hiddenMaskGroup = $(event.target).closest('[data-widget-role|="hidden-mask"]');

			if (hiddenMaskGroup == null) {
				return null;
			}

			let viewModel = this.#getViewModel(event.target);

			if (viewModel == null) {
				return null;
			}

			let maskedTextBox = $(hiddenMaskGroup).find('[data-hidden-mask-role|="mask"]');
			let hiddenMaskedTextBox = $(hiddenMaskGroup).find('[data-hidden-mask-role|="hidden-mask"]');
			let visibilityToggleButton = $(hiddenMaskGroup).find('[data-hidden-mask-role|="visibility-toggle-button"]');

			if (maskedTextBox == null || hiddenMaskedTextBox == null || visibilityToggleButton == null) {
				return null;
			}

			let maskedTextBoxValuePropertyName = maskedTextBox.attr('data-value-property-name');
			let maskedTextBoxVisibilityPropertyName = maskedTextBox.attr('data-visibility-property-name');

			let hiddenMaskedTextBoxValuePropertyName = hiddenMaskedTextBox.attr('data-value-property-name');
			let hiddenMaskedTextBoxVisibilityPropertyName = hiddenMaskedTextBox.attr('data-visibility-property-name');

			let visibilityButtonTextPropertyName = visibilityToggleButton.attr('data-text-property-name');
			let visibilityButtonEnabledPropertyName = visibilityToggleButton.attr('data-enabled-property-name');

			if (maskedTextBoxVisibilityPropertyName == null
				|| hiddenMaskedTextBoxVisibilityPropertyName == null
				|| hiddenMaskedTextBoxValuePropertyName == null
				|| visibilityButtonTextPropertyName == null
				|| visibilityButtonEnabledPropertyName == null) {
				return null;
			}

			return {
				viewModel: viewModel,
				maskedTextBox: maskedTextBox,
				maskedTextBoxValuePropertyName: maskedTextBoxValuePropertyName,
				maskedTextBoxVisibilityPropertyName: maskedTextBoxVisibilityPropertyName,
				hiddenMaskedTextBox: hiddenMaskedTextBox,
				hiddenMaskedTextBoxValuePropertyName: hiddenMaskedTextBoxValuePropertyName,
				hiddenMaskedTextBoxVisibilityPropertyName: hiddenMaskedTextBoxVisibilityPropertyName,
				visibilityButtonTextPropertyName: visibilityButtonTextPropertyName,
				visibilityButtonEnabledPropertyName: visibilityButtonEnabledPropertyName
			};
		}

		static #getViewModel(element) {
			let mainGroup = $(element).closest('[viewmodelname]');

			if (mainGroup.length == 0) {
				return null;
			}

			let viewModelName = $(mainGroup).attr('viewmodelname');

			return window[viewModelName];
		}

		static #updateHiddenMaskValue(hiddenMaskData) {
			let viewModel = hiddenMaskData.viewModel;
			let maskedValue = viewModel.get(hiddenMaskData.maskedTextBoxValuePropertyName);
			let maskedTextBox = hiddenMaskData.maskedTextBox;
			let maskedCharacter = maskedTextBox.data('hiddenMaskCharacter');
			let maskedLength = maskedTextBox.data('hiddenMaskLength');

			if (maskedCharacter == null || maskedCharacter == '') {
				maskedCharacter = 'X';
			}

			let hiddenMaskValue = null;

			if (maskedValue != null && maskedValue != '') {
				if (maskedValue.length < maskedLength) {
					maskedLength = maskedValue.length;
				}

				hiddenMaskValue = maskedCharacter.repeat(maskedLength);

				if (maskedValue.length > maskedLength) {
					hiddenMaskValue += maskedValue.substring(maskedLength, maskedValue.length);
				}
			}

			let hiddenMaskedTextBoxValuePropertyName = hiddenMaskData.hiddenMaskedTextBoxValuePropertyName;

			viewModel.set(hiddenMaskedTextBoxValuePropertyName, hiddenMaskValue);
		}
	}
}