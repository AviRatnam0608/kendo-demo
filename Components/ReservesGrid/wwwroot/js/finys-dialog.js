var finys = finys || {};

finys.dialog = class Dialog {
	//static ShowDialog(message, options) {
	//	let kendoWindow = this.#CreateKendoWindow(options);
	//	let template = kendo.template($("#display-message").html());

	//	let content = template({
	//		Message: message
	//	});

	//	kendoWindow.data("kendoWindow").content(content).center().open();
	//}

	static #CreateKendoWindow(options) {
		var kendoWindow = $('<div />').kendoWindow({
			title: options.title,
			resizable: false,
			modal: true,
			maxWidth: '80%',
			maxHeigh: '80%'
		});

		return kendoWindow;
	}

	static ShowMessage(message, options) {
		let kendoWindow = this.#CreateKendoWindow({ title: 'Message' });
		let template = kendo.template($('#display-message').html());
		let content = template({ Message: message });

		kendoWindow.data("kendoWindow").content(content).center().open();

		kendoWindow.find(".f-delete-confirm").click(function () {
			if ($(this).hasClass("f-delete-confirm")) {
				if (typeof confirmFunc == "function") {
					confirmFunc.call(confirmThisArg, confirmFuncArgs);
				}
			}

			kendoWindow.data("kendoWindow").destroy();
		}).end();
	}

	static ShowConfirmation(message, options) {
		let kendoWindow = this.#CreateKendoWindow({ title: 'Confirm' });
		let template = kendo.template($('#display-message').html());
		let content = template({ Message: message });

		kendoWindow.data("kendoWindow").content(content).center().open();

		kendoWindow.find(".f-delete-confirm,.f-delete-cancel").click(function () {
			if ($(this).hasClass("f-delete-confirm")) {
				if (typeof confirmFunc == "function") {
					confirmFunc.call(confirmThisArg, confirmFuncArgs);
				}
			}

			kendoWindow.data("kendoWindow").destroy();
		}).end();
	}
}