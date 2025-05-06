function finysAjax(p) {
	if (!p.hasOwnProperty("async")) p.async = true;
	if (!p.hasOwnProperty("triggerBookmark")) p.triggerBookmark = true;
	if (!p.hasOwnProperty("containerName")) p.containerName = "appContent";
	if (!p.hasOwnProperty("sourceUrlData")) p.sourceUrlData = "";
	if (!p.hasOwnProperty("data") && p.data == null) p.data = "";
	if (!p.hasOwnProperty("dataType") && p.dataType == null) p.dataType = "json";
	if (!p.hasOwnProperty("successFunc") && p.successFunc == null) p.successFunc = function (eventArgs) { };
	if (!p.hasOwnProperty("errorFunc") && p.errorFunc == null) p.errorFunc = function (eventArgs) { };
	if (!p.hasOwnProperty("contentType") && p.contentType == null) p.contentType = "application/x-www-form-urlencoded; charset=UTF-8";
	if (!p.hasOwnProperty("enableFinysProgressBar")) p.enableFinysProgressBar = true;
	if (!p.hasOwnProperty("processData")) p.processData = true;

	var pData = p.processData ? GetFinysAjaxData(p) : p.data;
	let w = null;
	kendo.ui.progress($('body'), true);

	if (p.enableFinysProgressBar == true)
		w = finys.wait();

	$.ajax({
		async: p.async,
		type: p.actionType,
		url: p.actionUrl,
		data: pData,
		cache: false,
		processData: p.processData,
		headers: {
			"Finys-Session": finys.ui.getSessionIdentifier()
		},
		dataType: p.dataType,
		contentType: p.contentType,
		success: function (result) {
			try {
				fnResetSessionDuration(); //Session Timeout
				if (result.hasOwnProperty('Type')) {
					if (result.Type === "View") {
						var eventArgs = { data: result, handled: false };
						p.successFunc(eventArgs);
						if (eventArgs.handled == false) {
							fnSetBrowserPageTitle(p, result); //Page Title
							if (p.triggerBookmark) {
								fnSetNavigationBookmark(p, result); //Bookmark
							}
							cleanupViewModels(p.containerName);
							kendo.destroy($("#" + p.containerName));
							$("#" + p.containerName).empty();
							$("#" + p.containerName).html(result.HTML);
							fnSetRequiredClasses(p.containerName);
							fnSetDisbledClasses(p.containerName);
						}
					}
					else if (result.Type === "Info") {
						var eventArgs = { data: result, handled: false };
						p.successFunc(eventArgs);
						if (eventArgs.handled == false) {
							ShowInfo(result);
						}
					}
					else if (result.Type == "DynamicControl") {
						var eventArgs = { data: result, handled: false };
						p.successFunc(eventArgs);
						if (eventArgs.handled == false) {
							//Add temp Update ViewModel
							$("#" + p.containerName).append(result.Data);

							$(".k-invalid").removeClass("k-invalid");
							$(".f-invalid").removeClass("f-invalid");
							var viewModel = window[result.ViewModel],
								updateViewModel = eval(result.UpdateViewModel);

							if (typeof viewModel != 'undefined' && viewModel != null && typeof updateViewModel != 'undefined' && updateViewModel != null) {
								var updatePropertyName = updateViewModel.get("PropertyName"),
									endorsementProperties = viewModel.get("EndorsementTriggerFields"),
									endorsementPaths = [],
									tabFlowProperties = viewModel.get("TabFlowTriggerFields"),
									updateTabFlow = tabFlowProperties.indexOf("dc." + updatePropertyName) != -1;

								//If Property that triggered Update is in Endorsement Properties, add to trigger Endorsement Widget update call (will not be added in Value Update below because NewValue == OldValue for this field)
								if (endorsementProperties.indexOf("dc." + updatePropertyName) != -1) {
									var smartPathFull = updatePropertyName,
										smartPath = smartPathFull.substring(0, smartPathFull.lastIndexOf('.'));

									endorsementPaths.push(smartPath);
								}

								viewModel.set("ViewModelUpdating", true);
								$.each(result.Controls, function (idx, control) {
									var controlElement = $("#" + control.Name);

									if (controlElement.length > 0) {
										var dataRole = $(controlElement).attr('data-role'),
											wrapperElement = controlElement,
											kendoControl;

										if (dataRole == 'dropdownlist') {
											kendoControl = controlElement.data("kendoDropDownList");
										}
										else if (dataRole == 'multiselect') {
											kendoControl = controlElement.data("kendoMultiSelect");
										}
										else if (dataRole == 'numerictextbox') {
											kendoControl = controlElement.data("kendoNumericTextBox");
										}
										else if (dataRole == 'maskedtextbox') {
											kendoControl = controlElement.data("kendoMaskedTextBox");
										}
										else if (dataRole == 'datepicker') {
											kendoControl = controlElement.data("kendoDatePicker");
										}

										if (typeof kendoControl != "undefined") {
											wrapperElement = kendoControl.wrapper;
										}

										var isVisible = wrapperElement.is(":visible") === true,
											isEditable = controlElement.is("[disabled]") === false,
											isRequired = controlElement.is("[required]") === true;

										if (control.ControlType == "Group") {
											//Visible
											if (control.Visible == true && isVisible == false) {
												//Show Group
												wrapperElement.show();
											} else if (control.Visible == false && isVisible == true) {
												//Hide Group
												wrapperElement.hide();
											}
										} else {
											//Visible
											if (control.Visible == true && isVisible == false) {
												//Show Control
												wrapperElement.closest(".fb-child").show();
											} else if (control.Visible == false && isVisible == true) {
												//Hide Control
												wrapperElement.closest(".fb-child").hide();
											}

											var hasParent = dataRole == "dropdownlist" && (controlElement.data("smartParents") != null || controlElement.data("cascadeFrom") != null);
											//Editable
											if (hasParent != true) {//Parented DropDownList - let kendo handle disabled based on parent value
												if (control.Editable == true && isEditable == false) {
													//Remove Disabled
													controlElement.removeAttr("disabled");
													controlElement.data("finysEditable", true);
													controlElement.attr("data-finys-editable", true);
													if (typeof kendoControl != "undefined") {
														kendoControl.enable();
													}
												} else if (control.Editable == false && isEditable == true) {
													//Add Disabled
													controlElement.attr("disabled", "");
													controlElement.data("finysEditable", false);
													controlElement.attr("data-finys-editable", false);
													if (typeof kendoControl != "undefined") {
														kendoControl.enable(false);
													}
												}
											}
											//Required
											if (control.Required == true && isRequired == false) {
												//Add Required
												controlElement.attr("required", "");
												controlElement.addClass("requiredStyle");
												if (dataRole == 'numerictextbox') {
													controlElement.siblings("input").addClass("requiredStyle");
												}
											} else if (control.Required == false && isRequired == true) {
												//Remove Required
												wrapperElement.removeAttr("required");
												wrapperElement.removeClass("requiredStyle");
												wrapperElement.find("[required]").removeAttr("required");
												wrapperElement.find(".requiredStyle").removeClass("requiredStyle");
											}

											//Value
											var propertyName = getSourceBindValue(control.Name);
											if (propertyName != null) {
												var newValue = updateViewModel.get(propertyName),
													oldValue = viewModel.get(propertyName);

												if (control.ControlType != "Button" && typeof oldValue != 'function' && oldValue != newValue) {
													//Update Value
													viewModel.set(propertyName, newValue);

													//If Property is in Endorsement Properties, add to trigger Endorsement Widget update call
													if (endorsementProperties.indexOf('dc.' + propertyName) != -1) {
														var smartPathFull = propertyName,
															smartpath = smartPathFull.substring(0, smartPathFull.lastIndexOf('.'));

														if (endorsementPaths.indexOf(smartPath) == -1) {
															endorsementPaths.push(smartPath);
														}
													}
													if (updateTabFlow == false && tabFlowProperties.indexOf("dc." + propertyName) != -1) {
														updateTabFlow = true;
													}
												}
											}
										}
									}
								});

								//Endorsement Widget Update - Based on SmartPath
								$.each(endorsementPaths, function (idx, path) {
									$('[data-widget-smart-path="' + path + '"][data-widget-type="Endorsement"]').find('[data-role="grid"]').each(function (idx, grid) {
										$(grid).data('kendoGrid').dataSource.read();
									});
								});

								//Update Tab visibility
								if (updateTabFlow && result.NavigationHeader && result.NavigationHeader != '') {
									cleanupViewModels('navDiv');
									kendo.destroy($('#navDiv'));
									$('#navDiv').empty();
									$('#navDiv').html(result.NavigationHeader);
								}

								viewModel.set("ViewModelUpdating", false);

								fnSetRequiredClasses(p.containerName);
								fnSetDisbledClasses(p.containerName);

								//remove temp Update ViewModel
								$("#" + result.UpdateViewModel + "_Script").remove();

								selectFocusElement();
							}
						}
					}
					else if (result.Type == "Repeater") {
						var eventArgs = { data: result, handled: false };
						p.successFunc(eventArgs);
						if (eventArgs.handled == false) {
							kendo.unbind($("#" + result.RepeaterGroup));

							var vm = eval(result.ViewModel);
							vm.set("dc." + result.DataSource, result.PageData);

							if (result.RepeaterDataSources != typeof undefined && result.RepeaterDataSources != null && result.RepeaterDataSources.length > 0) {
								$.each(result.RepeaterDataSources, function (index, repeaterDataSource) {
									var dsUrl = repeaterDataSource.SourceUrl;
									var serverFiltering = repeaterDataSource.ServerFiltering;
									var dsObj = {
										serverFiltering: serverFiltering,
										transport: {
											read: {
												url: (typeof GetFormattedURL == 'function' ? GetFormattedURL(dsUrl) : dsUrl),
												cache: false,
												dataType: 'json'
											},
											parameterMap: function (options, operation) {
												if (repeaterDataSource.ControlName != typeof undefined && repeaterDataSource.ControlName != '') {
													var filterObj = {
														options: options,
														operation: operation,
														controlName: repeaterDataSource.ControlName
													};
													fnSourceFilter(filterObj);

													return filterObj.options;
												}

												return options;
											}
										}
									};

									if (repeaterDataSource.ColumnSource && repeaterDataSource.ColumnSource != '') {
										dsObj.transport.read.data = function () {
											return {
												currentValue: vm.get(repeaterDataSource.ColumnSource)
											}
										}
									}

									var dataSource = new kendo.data.DataSource(dsObj);
									vm.set(repeaterDataSource.SourceName, undefined);
									vm.set(repeaterDataSource.SourceName, dataSource);
								});
							}
							$("#" + result.RepeaterGroup).empty();
							$("#" + result.RepeaterGroup).html(result.GroupContent);

							if (result.RepeaterReadyMethod != typeof undefined && result.RepeaterReadyMethod != null && result.RepeaterReadyMethod != '') {
								eval(result.RepeaterReadyMethod + "()");
							}

							if (typeof ($.fn.initFinysTooltips) === 'function') {
								$("#" + result.RepeaterGroup).initFinysTooltips();
							}

							kendo.unbind($("#" + result.RepeaterGroup), vm);
							kendo.bind($("#" + result.RepeaterGroup), vm);

							$.each($("#" + result.RepeaterGroup).find('[data-role="dropdownlist"]'), function (idx, value) {
								var sourceValue = $(value).data('kendoDropDownList').value();
								$(value).val(sourceValue);
							});

							if ($('#' + result.SourceName + '_Pager').length > 0) {
								var pager = $('#' + result.SourceName + '_Pager').data('kendoPager');
								pager.dataSource._total = result.DataTotal;

								var pagerPage = pager.page();
								if (result.CurrentPage != typeof undefined && result.CurrentPage > 0 && result.CurrentPage !== pagerPage) {
									pager.page(result.CurrentPage);
								}

								pager.refresh();
							}
						}
					} else if (result.Type == "DynamicView") {
						var eventArgs = { data: result, handled: false };
						p.successFunc(eventArgs);
						if (eventArgs.handled == false) {
							cleanupViewModels(result.DynamicGroup);
							kendo.destroy($("#" + result.DynamicGroup));
							$("#" + result.DynamicGroup).empty();
							$("#" + result.DynamicGroup).html(result.GroupContent);
							fnSetRequiredClasses(result.DynamicGroup);
							fnSetDisbledClasses(result.DynamicGroup);
						}
					} else if (result.Type == "FileToken") {
						var eventArgs = { data: result, handled: false };
						p.successFunc(eventArgs);
						ShowFile(result);
					}
				} else {
					p.successFunc(result);
				}
			}
			finally {
				finys.complete(w);
			}
		},
		error: function (XHR, status, error) {
			fnResetSessionDuration(); //Session Timeout

			finys.complete(w);

			var eventArgs = { XHR: XHR, status: status, error: error, handled: false };
			p.errorFunc(eventArgs);
			if (eventArgs.handled == false) {
				if (XHR.status == 500) {
					ShowInfo({
						Height: '90%',
						Width: '90%',
						IsException: true,
						Message: XHR.responseText
					});
				}
			}
		}
	});
}

function fnSourceFilter(filters) {
	if (filters.operation == 'read') {
		var control = $('#' + filters.controlName);
		if (control.length) {
			var filtersArray = fnAddParentValues(control);
			if (filtersArray.length > 1) {
				filters.options.filter["filters"] = filtersArray
			}
		}
	}
}

function fnAddParentValues(control, array) {
	if (array == typeof undefined || array == null) {
		array = [];
	}

	var cascadeFrom = control[0].getAttribute('data-cascade-from');
	if (cascadeFrom != typeof undefined && cascadeFrom != null && cascadeFrom != '') {
		var parentControl = $('#' + cascadeFrom);
		if (parentControl.length) {
			var parentValue = parentControl.val();
			array.unshift({ field: 'Code', operator: 'eq', value: parentValue });
			fnAddParentValues(parentControl, array);
		}
	}
	return array;
}

function fnSmartSourceFilter(filters) {
	if (filters.operation == 'read') {
		var control = $('#' + filters.controlName);
		if (control.length) {
			var filtersArray = fnAddSmartParentValues(control[0]);
			if (filtersArray.length > 0) {
				if (typeof filters.options.filter == 'undefined' || typeof filters.options.filter.filters == 'undefined') {
					filters.options.filter = { filters: [], logic: "and" }
				}

				filters.options.filter["filters"] = filtersArray;
			}
		}
	}
}

function fnAddSmartParentValues(control, array) {
	if (array == typeof undefined || array == null) {
		array = [];
	}
	var smartParents = control.getAttribute('data-smart-parents').split(",");
	if (typeof smartParents != 'undefined' && smartParents != '') {
		$.each(smartParents, function (idx, parentField) {
			var parentValue = getViewModel($(control)).get(parentField);
			if (parentValue != null) {
				array.unshift({ field: 'Code', operator: 'eq', value: parentValue });
			}
		})
	}
	return array;
}

function fnSetRequiredClasses(elementName) {
	$("#" + elementName + " input[class*=requiredStyle], #" + elementName + " select[class*=requiredStyle]").each(function () {
		if ($(this).attr('data-role') == 'dropdownlist') {
			$(this).prev().children().first().addClass('requiredStyle');
		}
		else if ($(this).attr('data-role') == 'multiselect') {
			$(this).parent().children().first().addClass('requiredStyle');
		}
		else if ($(this).attr('data-role') == 'numerictextbox') {
			$(this).parent().parent().removeClass('requiredStyle');
		}
	});
}

function fnSetDisbledClasses(elementName) {
	$(".k-textbox").each(function () {
		if ($(this).attr('disabled') == 'disabled') {
			$(this).addClass('k-disabled');
		}
		else {
			$(this).removeClass('k-disabled');
		}
	});
}

function GetFinysAjaxData(finysAjaxObj) {
	var pData = null;
	var sUrlData = GetDataAfterEval(finysAjaxObj.sourceUrlData);

	if (finysAjaxObj.hasOwnProperty("dataName") && finysAjaxObj.dataName != null && finysAjaxObj.dataName != "" && finysAjaxObj.data != "") {
		pData = finysAjaxObj.dataName + '=' + encodeURIComponent(kendo.stringify(finysAjaxObj.data)) + (sUrlData != "" ? "&" : '') + sUrlData;
	}
	else {
		pData = finysAjaxObj.data + (finysAjaxObj.data != "" && sUrlData != "" ? "&" : '') + sUrlData;
	}

	return pData;
}

function selectFocusElement() {
	var focusElement;

	if (typeof window['controlSelectionField_Override'] != 'undefined' && window['controlSelectionField_Override'] != null) {
		var propertyName = window['controlSelectionField_Override'];
		focusElement = getControlsByDataBind_Property(propertyName);
		if (typeof focusElement != 'undefined' && focusElement.length > 0) {
			window['controlSelectionField_Override'] = null;
			window['controlSelectionField'] = null;
		}
	}
	if (typeof window['controlSelectionField'] != 'undefined' && window['controlSelectionField'] != null) {
		var propertyName = window['controlSelectionField'];
		focusElement = getControlsByDataBind_Property(propertyName);
		if (typeof focusElement != 'undefined' && focusElement.length > 0) {
			window['controlSelectionField'] = null;
		}
	}
	else if (typeof window['controlSelectionName'] != 'undefined' && window['controlSelectionName'] != null) {
		focusElement = $('#' + window['controlSelectionName']);
		if (typeof focusElement != 'undefined' && focusElement.length > 0) {
			window['controlSelectionName'] = null;
		}
	}
	if (typeof focusElement != 'undefined' && focusElement.length > 0) {
		setFocusElement(focusElement);
	}
}
function setFocusElement(focusElement) {
	if (typeof focusElement != 'undefined' && focusElement !== false && focusElement != null) {
		var focusWait = 0.0;
		var setFocused = setInterval(function () {
			if ((document.readyState == 'complete' && (window.jQuery != null && jQuery.active == 0)) || focusWait >= 30) {
				setTimeout(function () {

					var keyEvent,
						keyEventTriggered = false;

					if (window['controlKeyDownEvent'] != null) {
						keyEvent = window['controlKeyDownEvent'];

						window['controlKeyDownEvent'] = null;

						//Clean up if Focus Element was not the trigger of the event
						if (typeof keyEvent.target != 'undefined' && $(keyEvent.target).attr("id") != $(focusElement).attr("id")) {
							keyEvent = null;
						}
					}

					$('.f-control-selected').removeClass('f-control-selected');
					$('.k-focused').removeClass('k-focused');

					var focusControl = focusElement;
					if (typeof focusControl == 'string') {
						focusControl = $('#' + focusElement);
					}

					var wrapperControl = focusControl;
					var kendoWidget = kendo.widgetInstance(focusControl)
					var dataRole = focusControl.data('role');
					if (typeof kendoWidget != 'undefined' && dataRole != 'datepicker') {
						wrapperControl = kendoWidget;
						focusControl = wrapperControl;
						if (typeof kendoWidget.wrapper != 'undefined') {
							wrapperControl = kendoWidget.wrapper;
							focusControl = wrapperControl;
							if (dataRole === 'numerictextbox') {
								focusControl = $(kendoWidget.wrapper).find('.k-formatted-value');
							}
						}
					}

					if (dataRole != 'dropdown' && typeof keyEvent != 'undefined' && keyEvent != null && keyEvent.which == 9) {
						var selectableControls = $("#tabNavigationMenu a, #bookmarkMenu, .k-formatted-value .fb-input, .gridWidgetField:not(.k-widget), .k-dropdown.gridWidgetField, .k-button:not(table a, .k-grid-toolbar a), .fb-input:not(.k-datepicker, .k-numerictextbox, [data-role='numerictextbox']), input[type='checkbox'], input:not([data-role='numerictextbox']), .k-pager-sizes span.k-dropdown-wrap").filter(function (idx, element) {
							//added data-role='numerictextbox' to ignore list to remove incorrect control for numerictextboxes
							//tabbing into NumericTextBox makes correct selectable control hidden, return true if hidden
							if ($(element).is(".k-formatted-value:not(:visible)") && $(element).siblings("input[data-role='numerictextbox']").is(":visible")) {
								return true;
							}
							return $(element).is(":visible:not([disabled], [disabled='disabled'], [aria-disabled='true'])");
						});
						var focusIndex = selectableControls.index(focusControl);

						if (focusIndex != -1) {
							if (keyEvent.shiftKey == true) {
								focusIndex--;
							} else {
								focusIndex++;
							}
							$(focusControl).trigger("focusout");
							if (document.activeElement != null) {
								document.activeElement.blur();
							}


							focusControl = $(selectableControls).get(focusIndex);
							wrapperControl = $(focusControl);
							keyEventTriggered = true;
						}

					}

					if (keyEvent == null || keyEventTriggered == true) {
						focusControl.focus();
						wrapperControl.addClass('f-control-selected');
					}

					if (focusWait >= 30) {
						console.error('Error in JavaScript has caused Focus Control to not set focus due to max timeout of 30 seconds');
					}
				}, window.validationTimeout);
				clearInterval(setFocused);
			}
			focusWait += 0.1;
		}, 100);
	}
}

function ShowFile(result) {
	if (result.hasOwnProperty('Type')) {
		if (result.Type === "FileToken") {
			window.open(result.URL);
		}
	}
}
function ShowConfirmation(message, confirmThisArg, confirmFunc, confirmFuncArgs) {
	var kendoWindow = $("<div />").kendoWindow({
		title: "Confirm",
		resizable: false,
		modal: true,
		maxWidth: '60%',
		maxHeight: '80%'
	});

	var temp = kendo.template($("#delete-confirmation").html());
	kendoWindow.data("kendoWindow").content(temp({ Message: message })).center().open();

	kendoWindow.find(".f-delete-confirm,.f-delete-cancel").click(function () {
		if ($(this).hasClass("f-delete-confirm")) {
			if (typeof confirmFunc == "function") {
				confirmFunc.call(confirmThisArg, confirmFuncArgs);
			}
		}

		kendoWindow.data("kendoWindow").destroy();
	}).end();
}
function DisplayMessage(message, confirmThisArg, confirmFunc, confirmFuncArgs) {
	var kendoWindow = $("<div />").kendoWindow({
		title: "Message",
		resizable: false,
		modal: true,
		maxWidth: '80%',
		maxHeigh: '80%'
	});

	var temp = kendo.template($("#display-message").html());
	kendoWindow.data("kendoWindow").content(temp({ Message: message })).center().open();

	kendoWindow.find(".f-delete-confirm").click(function () {
		if ($(this).hasClass("f-delete-confirm")) {
			if (typeof confirmFunc == "function") {
				confirmFunc.call(confirmThisArg, confirmFuncArgs);
			}
		}

		kendoWindow.data("kendoWindow").destroy();
	}).end();
}

function getRepeaterPageIndex(elementId) {
	jqElement = null;
	if (typeof elementId == "string")
		jqElement = $("#" + elementId);
	else
		jqElement = $(elementId);

	var pageIndex = jqElement.closest('div[pageIndex]').attr('pageIndex');

	return pageIndex;
}
function getRepeaterPrimaryKey(elementId) {
	jqElement = null;
	if (typeof elementId == "string")
		jqElement = $("#" + elementId);
	else
		jqElement = $(elementId);

	var primaryKey = jqElement.closest('div[primaryKey]').attr('primaryKey');

	return primaryKey;
}
function getViewModel(elementId) {
	jqElement = null;
	if (typeof elementId == "string")
		jqElement = $("#" + elementId);
	else
		jqElement = $(elementId);

	return eval(jqElement.closest("[viewModelName]").attr("viewModelName"));
}
function getViewModelValue(elementId) {
	var valueStr = getSourceBindValue(elementId);

	if (valueStr != null) {
		return getViewModel(elementId).get(valueStr);
	}
	return null;
}
function setViewModelValue(elementId, value) {
	var valueStr = getSourceBindValue(elementId);

	if (valueStr != null) {
		getViewModel(elementId).set(valueStr, value);
		getElementFromId(elementId).trigger("change");

		return true;
	}
	return false;
}
function getSourceBindValue(elementId) {
	var element = getElementFromId(elementId);
	if (element != null) {
		var valueStr = element.data().bind;

		if (typeof (valueStr) != 'undefined' && valueStr != null && valueStr.trim() != '') {
			var valueProperty = null;
			if (valueStr.indexOf("value") >= 0) {
				valueProperty = "value";
			}
			else if (valueStr.indexOf("checked") >= 0) {
				valueProperty = "checked";
			}
			if (valueProperty != null) {
				valueStr = valueStr.substring(valueStr.indexOf(valueProperty) + 5, valueStr.length);
				valueStr = valueStr.substring(valueStr.indexOf(":") + 1, valueStr.length);

				if (valueStr.indexOf(",") > 0) {
					valueStr = valueStr.substring(0, valueStr.indexOf(","));
				}

				return valueStr.trim();
			}
		}
	}
	return null;
}
function getSourceBindEvent(elementId, eventName) {
	var element = getElementFromId(elementId);
	if (element != null) {
		var eventStr = element.data().bind;

		if (typeof (eventStr) != 'undefined' && eventStr != null && eventStr.trim() != '' && eventStr.indexOf("events") >= 0) {
			eventStr = eventStr.substring(eventStr.indexOf("events") + 6, eventStr.length);
			eventStr = eventStr.substring(eventStr.indexOf("{"), eventStr.indexOf("}"));

			eventStr = eventStr.substring(eventStr.indexOf(eventName) + 5, eventStr.length);
			eventStr = eventStr.substring(eventStr.indexOf(":") + 1, eventStr.length);

			if (eventStr.indexOf(",") > 0) {
				eventStr = eventStr.substring(0, eventStr.indexOf(","));
			}

			return eventStr.trim();
		}
	}
	return null;
}
function getElementFromId(elementId) {
	var element = null;
	if (typeof elementId == "string" && document.getElementById(elementId) != null) {
		element = $(document.getElementById(elementId));
	} else if ($(elementId).length > 0) {
		element = $(elementId);
	}
	return element;
}
function getControlsByDataBind_Property(vmPropertyName) {
	return $("[data-bind*='value:'],[data-bind*='checked:']").filter(function (idx, ctrl) { return $(ctrl).data("bind").split(',').filter(function (item) { return $.trim(item.replace("value:", "")) == vmPropertyName || $.trim(item.replace("checked:", "")) == vmPropertyName; }).length > 0; });
}
function getControlsByDataBind_Source(vmSourceName) {
	return $("[data-bind*='source:']").filter(function (idx, ctrl) { return $(ctrl).data("bind").split(',').filter(function (item) { return $.trim(item.replace("source:", "")) == vmSourceName; }).length > 0; });
}

function resetSmartChildren(parentField, mainGroup) {
	var parentControl = getControlsByDataBind_Property(parentField);
	if (parentControl.length == 0) {
		parentControl = mainGroup;
	}

	var smartChildren = getSmartChildControls(mainGroup, parentField);

	if (smartChildren.length > 0) {
		var parentValue = getViewModel(parentControl).get(parentField);

		$.each(smartChildren, function (idx, smartChild) {
			if ($(smartChild).is("[data-role='dropdownlist']")) {
				if ($(smartChild).data("kendoDropDownList").dataSource.data().length > 0) {
					setViewModelValue($(smartChild).attr("id"), null);
					$(smartChild).data("kendoDropDownList").dataSource.fetch();
				}
				var isEnabled = parentValue != null;

				$(smartChild).data("finysEditable", isEnabled);
				$(smartChild).data("kendoDropDownList").enable(isEnabled);
			}
		});
	}
}

function getSmartChildControls(mainGroup, parentField) {
	var smartChildren = $(mainGroup).find("[data-smart-parents*='" + parentField + "']");

	return smartChildren
}

// function for getting ajax source data
function GetDataAfterEval(str) {
	if (str == null) return "";
	str = str.replace(/{.*}/g, function (all) {
		all = all.replace("{", "");
		all = all.replace("}", "");
		return eval(all);
	});
	return str;
}

// function for creating Hierarchical data from flat data
function unflatten(flatData, keys) {
	var ret = {}, unflattenRow = function (flat, keys, obj) {
		if (!$.isEmptyObject(flat)) {
			if (keys.length) {
				if (flat.hasOwnProperty(keys[0])) {
					var objKey = flat[keys[0]];
					if (!$.isPlainObject(obj[objKey])) obj[objKey] = {};
					delete flat[keys[0]];
					unflattenRow(flat, keys.slice(1), obj[objKey]);
				}
			}
		}
	};

	$.each(flatData, function () { unflattenRow(this, keys, ret); });
	return ret;
}

// Kendo Custom Validator
function CustomValidator(name) {
	var validator = $("#" + name).kendoValidator({
		validateOnBlur: false,
		messages: {
			required: function (input) {
				return "";
			}
		},
		errorTemplate: ''
	}).data("kendoValidator");
	return validator;
}

function CustomValidator_Validate(name) {
	var validator = CustomValidator(name),
		valid = validator.validate(),
		container = $("#" + name),
		recaptcha = container
			.find('.recaptcha-control > div'),
		response = container
			.find('.g-recaptcha-response');
	$('#' + name + ' .f-invalid').removeClass('f-invalid');
	if (response.length) {
		if (response.val())
			recaptcha.removeClass('k-invalid');
		else {
			recaptcha.addClass('k-invalid');
			valid = false;
		}
	}
	if (valid === false) {
		$('#' + name + ' .k-invalid').each(function () {
			var dataRole = $(this).attr('data-role');
			if (dataRole == 'dropdownlist') {
				$(this).parent().children('span.k-dropdown-wrap').addClass('f-invalid');
			}
			else if (dataRole == 'multiselect') {
				$(this).parent().addClass('f-invalid');
			}
			else if (dataRole == 'numerictextbox' || dataRole == 'datepicker') {
				$(this).parent().addClass('f-invalid');
			}
			else {
				$(this).addClass('f-invalid');
			}
		});
	}
	return valid;
}


function ShowCustomValidationErrors(errorLabel, errors) {
	var messageText = "";
	$.each(errors, function (idx, error) {
		if (messageText != "") {
			messageText += "<br />";
		}
		messageText += error;
	});
	errorLabel.html(messageText);
	errorLabel.parent("div.fb-child").show();
}

// Info infrastructure BEGIN
function ShowInfo(infoObject) {

	if (!infoObject.hasOwnProperty("Width")) infoObject.Width = "300px";
	if (!infoObject.hasOwnProperty("Height")) infoObject.Height = "110px";

	//create kendo window
	var kendoWindow = $("<div />").kendoWindow({
		title: "Message",
		resizable: true,
		modal: true,
		width: infoObject.Width,
		height: infoObject.Height
	});

	var temp = kendo.template($("#InfoTemplate").html());
	kendoWindow.data("kendoWindow")
		.content(temp(infoObject))
		.center()
		.open();

	kendoWindow.find(".f-info-okay")
		.on("click", () => kendoWindow.data("kendoWindow").destroy());

	kendoWindow.find(".f-info-copy")
		.on("click", () => {
			navigator.clipboard.writeText(infoObject.Message);
			ShowInfo({
				IsException: false,
				Message: "Error message copied to clipboard",
				Width: '300px',
				Height: '150px'
			});
		});
}

function cleanupViewModels(containerName) {
	$("#" + containerName + " [viewModelName]").each(function (index, element) {
		var name = $(element).attr('viewModelName'),
			vm = window[name];
		try {
			if (vm) {
				if (window.errorWin) {
					var win = $(window);
					$(window.errorWin.wrapper).off('transitionend', vm.errorWin_OnTransitionEnd);
					win.off('scroll', vm.errorWin_OnWindowScroll);
					win.off('resize', vm.errorWin_OnWindowResize);
					window.errorWin.wrapper.find('.k-window-actions').off('click', vm.errorWin_OnPinClick);
				}
				if (vm.unload)
					vm.unload();
			}
		} catch (e) { };

		window[name] = undefined;
		delete window[name];
	});
}
// Info infrastructure END

// Tooltips START
(function ($) {
	$.fn.initFinysTooltips = function () {
		var elements = this.find('[data-finys-tool-tip-type="Info"]')
			.map(function () {
				var widget = kendo.widgetInstance($(this));
				if (widget !== undefined && (widget instanceof kendo.ui.DropDownList || widget instanceof kendo.ui.NumericTextBox))
					return widget.wrapper[0];
				return this;
			}),
			elementsWithoutTooltipWrapper = $.grep(elements, function (e) {
				return $(e).prev('.f-tooltip-wrapper').length == 0;
			});

		$.each(elementsWithoutTooltipWrapper, function (i, e) {
			$(e).before('<div class="f-tooltip-wrapper" style="margin: auto; width: 20px; display: inline-flex;"><span class="k-icon k-i-note pToolTip" style="width:16px;height:16px;text-decoration:none;"></span></div>');
		});

		this.find('span.k-icon.k-i-note.pToolTip')
			.kendoTooltip({
				autoHide: true,
				width: 'Auto',
				height: 'Auto',
				showOn: 'mouseenter',
				show: function () { this.refresh(); },
				content: function (e) {
					var ttTarget = $(e.target),
						origEl = ttTarget.closest(".fb-child").find('[data-finys-tool-tip-type]');

					if (origEl.length == 0) {
						origEl = ttTarget.closest(".fb-group").find('[data-finys-tool-tip-type]');
					}

					if (origEl.length > 0) {
						origEl = origEl.first();
					}

					var tType = origEl.data('finysToolTipType');

					if (tType == 'Info') {
						var detailsLink;
						if (origEl.data('finysDetailsLink') != undefined && origEl.data('finysDetailsLink') != '') {
							detailsLink = "<a href='#' onclick='openNewWindowCentered(800, 600, 50, \"" + origEl.data('finysDetailsLink') + "\", \"Details Link\");return false;' >Click Here For Details</a>";
						}

						if (origEl.data('finysToolTipDescription') != undefined && origEl.data('finysToolTipDescription') != '') {
							var tooltip = origEl.data('finysToolTipDescription');

							if (typeof detailsLink != 'undefined' && detailsLink != '') {
								tooltip += "\r\n\r\n" + detailsLink;
							}
							return tooltip;
						}
						else if (origEl.data('finysDynamicMethodName') != undefined && origEl.data('finysDynamicMethodName') != '') {
							try {
								if (typeof (eval(origEl.data('finysDynamicMethodName'))) === 'function') {
									var tooltip = eval(origEl.data('finysDynamicMethodName'));

									if (typeof detailsLink != 'undefined' && detailsLink != '') {
										tooltip += "\r\n\r\n" + detailsLink;
									}
									return tooltip;
								}
								else {
									return "Method Name - '" + origEl.data('finysDynamicMethodName') + "' could not be found. Please ensure the method exists and/or is spelled correctly.";
								}
							}
							catch (ex) {
							}
						}
						else if (typeof detailsLink != 'undefined' && detailsLink != '') {
							return detailsLink;
						}
					}
				}
			});

		this.find('.pToolTip')
			.parent("div")
			.prev('label')
			.each(function (idx, toolTipLabel) {
				$(toolTipLabel).addClass("fb-label-tooltip");
			});

		return this;
	}
}(jQuery));

function openNewWindowCentered(windowWidth, windowHeight, windowOuterHeight, url, wname, features) {
	var centerLeft = parseInt((window.screen.width - windowWidth) / 2);
	var centerTop = parseInt(((window.screen.height - windowHeight) / 2) - windowOuterHeight);

	var misc_features;
	if (features) {
		misc_features = ', ' + features;
	}
	else {
		misc_features = ', status=yes, location=yes, scrollbars=yes, resizable=yes';
	}
	var windowFeatures = 'width=' + windowWidth + ',height=' + windowHeight + ',left=' + centerLeft + ',top=' + centerTop + misc_features;
	var win = window.open(url, wname, windowFeatures);
	win.focus();
	return win;
}
// ToolTips END

function gotoHome() {


	var qs = (function (a) {
		if (a == "") return {};
		var b = {};
		for (var i = 0; i < a.length; ++i) {
			var p = a[i].split('=', 2);
			if (p.length == 1)
				b[p[0]] = "";
			else
				b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
		}
		return b;
	})(window.location.search.substr(1).split('&'));
	window.open(qs["RequestURL"], '_self');
}



function getParameterByName(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		results = regex.exec(location.search);
	return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// Navigate Manager START
var _FINYS_MAIN_NAVIGATE = "finysMainNavigate";
window.onbeforeunload = function (e) {
	//if (!bookmarkStack.isReturning && securityModel.get("userLoggedIn")) {
	//    var src = { type: "window", source: "browser_close" };
	//    $('body').trigger(_FINYS_MAIN_NAVIGATE, src);
	//    fnDoLogout(src.source, false);
	//    return "";
	//}
};

function fnAddCleanupEvent(eventDelegate) {
	$('body').off(_FINYS_MAIN_NAVIGATE);
	$('body').one(_FINYS_MAIN_NAVIGATE, eventDelegate);
}
function fnRemoveCleanupEvent() {
	$('body').off(_FINYS_MAIN_NAVIGATE);
}
// Navigate Manager END

// Security start
function fnDoLogout(source, successFunction) {
	finysAjax({
		async: false,
		actionUrl: "/Login/Logout",
		actionType: "POST",
		dataType: "json",
		contentType: "application/json",
		data: kendo.stringify({
			source: source,
			sessionID: securityModel.get("sessionID")
		}),
		successFunc: successFunction
	});
}
function setLogoutURL(logoutURL) {
	$("#logout").show();
	headerModel.set("logoutURL", logoutURL);
}

var headerModel = kendo.observable({
	logoutVisible: false,
	logoutURL: null,
	logoutClick: function (e) {
		bookmarkSyncing.clearBookmarks();
		$('body').trigger(_FINYS_MAIN_NAVIGATE, { type: e.type, source: "logout" });
		fnDoLogout(e.type, function (result) {
			if (result.Message == "Success") {
				result.handled = true;
				window.onbeforeunload = null;
				if (e.type && e.type == "session_timeout" && headerModel.get("timeoutURL") != null && headerModel.get("timeoutURL") != '') {
					window.location = headerModel.get("timeoutURL");
				} else if (headerModel.get("logoutURL") == null || headerModel.get("logoutURL") == '') {
					window.location.replace(!!(window.location.origin) ? window.location.origin : (window.location.protocol + '//' + window.location.hostname + (window.location.port ? (':' + window.location.port) : '')));
				} else {
					window.location = headerModel.get("logoutURL");
				}
			}
		});
	}

});
var securityModel = kendo.observable({
	userLoggedIn: false,
	userName: "",
	runtimeVisible: false,
	runtimeDateTime: null,
	environmentVisible: false,
	environment: null
});

//#region BOOKMARK SYNCING OBJECT
var bookmarkSyncing = {
	loadBookmarksFromSessionStorage: function () {
		const bookmarkJson = sessionStorage.getItem("finys-bookmark");
		const bookmarkIndex = sessionStorage.getItem("finys-bookmark-index");

		if (!bookmarkJson) {
			return;
		}

		const bookmarkData = JSON.parse(bookmarkJson);
		if (typeof bookmarkIndex != "undefined" && bookmarkIndex != "undefined") {
			bookmarkData.bookmarkIndex = JSON.parse(bookmarkIndex);
		}
		return bookmarkData;
	},
	clearBookmarks: function () {
		if (bookmarkStack.get("handshakeBookmarkEnabled") === true) {
			sessionStorage.removeItem("finys-bookmark");
			sessionStorage.removeItem("finys-bookmark-index");

			const bookmarkWin = document.getElementById('FinysBookmark_ifr');

			if (bookmarkWin != null) {
				bookmarkWin.contentWindow.postMessage({
					message: "ClearBookmarks"
				}, "*");
			}
		}
	},
	syncBookmarks: function (index) {
		if (bookmarkStack.get("handshakeBookmarkEnabled") === true) {
			const bookmarkWin = document.getElementById('FinysBookmark_ifr');

			if (bookmarkWin != null) {
				bookmarkWin.contentWindow.postMessage({
					index: JSON.stringify(index),
					bookmarkJson: JSON.stringify({ "itemToBeAdded": bookmarkStack.itemToBeAdded, "items": bookmarkStack.items }),
				}, "*");
			}
		}
	}
}
//#endregion


$(document).ready(function () {
	//kendo.bind($("#appHeader"), headerModel);
	//kendo.bind($("#bookmarkMenu"), bookmarkStack);
	//finysAjax({
	//	async: false,
	//	actionUrl: "/FinysPortal/Login/GetLoginInfo",
	//	successFunc: function (result) {
	//		result.handled = true;
	//		securityModel.set("userLoggedIn", result.UserLoggedIn);
	//		securityModel.set("userName", result.UserName);
	//		securityModel.set("runtimeVisible", result.RuntimeVisible);
	//		securityModel.set("runtimeDateTime", result.RuntimeDateTime);
	//		securityModel.set("environmentVisible", result.EnvironmentVisible);
	//		securityModel.set("environment", result.Environment);

	//		headerModel.set('logoutVisible', result.LogoutVisible);

	//		kendo.bind($("#appInfo"), securityModel);

	//		if (typeof result.LogoutURL != 'undefined' && result.LogoutURL != null && result.LogoutURL != '') {
	//			headerModel.set("logoutURL", result.LogoutURL);
	//		}
	//		if (typeof result.TimeoutURL != 'undefined' && result.TimeoutURL != null && result.TimeoutURL != '') {
	//			headerModel.set("timeoutURL", result.TimeoutURL);
	//		}

	//		if (typeof result.HomeURL != 'undefined' && result.HomeURL != null && result.HomeURL != '') {
	//			bookmarkStack.set("homeURL", result.HomeURL);
	//		}
	//		if (typeof result.BookmarkHTML != "undefined" && result.BookmarkHTML != null && result.BookmarkHTML != '') {
	//			bookmarkStack.set("handshakeBookmarkEnabled", true);

	//			let iframe = document.createElement("iframe");

	//			iframe.style.display = "none";
	//			iframe.src = result.BookmarkHTML;
	//			iframe.id = "FinysBookmark_ifr";
	//			document.body.appendChild(iframe);

	//			const bookmarkData = bookmarkSyncing.loadBookmarksFromSessionStorage();
	//			if (bookmarkData !== undefined) {
	//				bookmarkStack.set("items", bookmarkData.items);
	//				bookmarkStack.set("itemToBeAdded", bookmarkData.itemToBeAdded);
	//				bookmarkStack.renderBookmarkMenu();

	//				if (bookmarkData.bookmarkIndex !== undefined && bookmarkData.bookmarkIndex !== null) {
	//					const bookmarkObj = bookmarkStack.items[bookmarkData.bookmarkIndex];
	//					fnNavigateToBookmark(bookmarkObj);
	//				}
	//			}
	//		} else {
	//			bookmarkStack.set("handshakeBookmarkEnabled", false);
	//		}
	//	}
	//});
});
// Security end

// START grid pagesize persistence
var userPreferences = new kendo.observable({
	pageSize: {}
});

function fnGetGridPageSize(gridKey, defaultPageSize) {
	if (userPreferences.pageSize.hasOwnProperty(gridKey) === false) {
		userPreferences.pageSize[gridKey] = defaultPageSize;
	}
	return userPreferences.pageSize[gridKey];
}

function fnSetGridPageSize(gridKey, newPageSize) {
	userPreferences.set("pageSize." + gridKey, newPageSize);
}
// END grid pagesize persistence


// START SrollTop
$(document).ready(function () {
	var container = $('#appContentContainer');
	var appScrollTop = $('.f-app-scroll-top');
	var onScroll = function () {
		var scroll = container.scrollTop();
		if (scroll > 50) {
			appScrollTop.fadeIn(200);
		} else {
			appScrollTop.fadeOut(200);
		}
	};

	if (container[0]?.addEventListener) {
		container[0].addEventListener('scroll', onScroll, false);
	} else if (container[0]?.attachEvent) {
		container[0].attachEvent('onscroll', onScroll);
	}

	var onClick = function () {
		container.animate({ scrollTop: 0 }, 200);
	};

	if (appScrollTop[0]?.addEventListener) {
		appScrollTop[0].addEventListener('click', onClick, false);
	} else if (appScrollTop[0]?.attachEvent) {
		appScrollTop[0].attachEvent('onclick', onClick);
	}
});
// END ScrollTop

// Sticky Plugin v1.0.0 for jQuery
// =============
// Author: Anthony Garand
// Improvements by German M. Bravo (Kronuz) and Ruud Kamphuis (ruudk)
// Improvements by Leonardo C. Daronco (daronco)
// Created: 2/14/2011
// Date: 2/12/2012
// Website: http://labs.anthonygarand.com/sticky
// Description: Makes an element on the page stick on the screen as you scroll
//       It will only set the 'top' and 'position' of your element, you
//       might need to adjust the width in some cases.
(function ($) {
	var defaults = {
		className: 'is-sticky',
		wrapperClassName: 'sticky-wrapper',
		topSpacing: 10
	},
		container = $(window),
		sticked = [],
		scroller = function () {
			if (container.length == 0)
				return;

			var scrollTop = container.scrollTop(),
				containerTop = container.offset().top;

			for (var i = 0; i < sticked.length; i++) {
				var stickedElement = sticked[i],
					wrapperTop = stickedElement.stickyWrapper.offset().top,
					wrapperWidth = stickedElement.stickyWrapper.outerWidth(),
					referenceTop = wrapperTop - stickedElement.options.topSpacing,
					wrapperLeft = stickedElement.stickyWrapper.offset().left;

				if (scrollTop == 0 || referenceTop > containerTop) {
					if (stickedElement.currentTop !== null) {
						stickedElement.stickyElement.css('position', '').css('z-index', 'auto').css('top', '');
						stickedElement.stickyElement.css('padding-top', parseInt(stickedElement.stickyElement.css('padding-top')) - stickedElement.options.topSpacing + 'px');
						stickedElement.stickyElement.removeClass(stickedElement.options.className);
						stickedElement.currentTop = null;
					}

					if (stickedElement.currentLeft !== null) {
						stickedElement.stickyElement.css('left', '');
						stickedElement.currentLeft = null;
					}

					if (stickedElement.currentClip !== null) {
						stickedElement.stickyElement.css('clip-path', '');
						stickedElement.currentClip = null;
					}
				} else {
					if (stickedElement.currentTop != containerTop) {
						stickedElement.stickyElement.css('position', 'fixed').css('z-index', '10000').css('top', containerTop)
						stickedElement.stickyElement.addClass(stickedElement.options.className);

						if (stickedElement.currentTop == null) {
							stickedElement.stickyElement.css('padding-top', parseInt(stickedElement.stickyElement.css('padding-top')) + stickedElement.options.topSpacing + 'px');
						}

						stickedElement.currentTop = containerTop;
					}

					if (stickedElement.currentLeft != wrapperLeft) {

						stickedElement.stickyElement.css('left', wrapperLeft);
						stickedElement.currentLeft = wrapperLeft;
					}

					var extra = 0;
					if (container[0] == window) {
						extra = container[0].innerWidth - $(document).outerWidth();
					} else {
						extra = container[0].offsetWidth - container[0].clientWidth;
					}

					var clipWidth = wrapperWidth + wrapperLeft - window.innerWidth + extra;

					if (stickedElement.currentClip != clipWidth) {
						stickedElement.stickyElement.css('clip-path', 'inset(0px ' + clipWidth + 'px -' + stickedElement.stickyElement.css('padding-top') + ' 0px)');
						stickedElement.currentClip = clipWidth;
					}
				}
			}
		},
		methods = {
			init: function (options) {
				options = $.extend({}, defaults, options);

				var getInheritedBackgroundColor = function (element) {
					var color = element.css('background-color');
					if (color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
						return color;
					}

					if (element.is('body')) {
						return false;
					} else {
						return getInheritedBackgroundColor(element.parent());
					}
				}

				return this.each(function () {
					var stickyElement = $(this),
						stickyWrapper = stickyElement.parent('.' + options.wrapperClassName);
					if (stickyWrapper.length == 0) {
						var stickyId = stickyElement.attr('id'),
							wrapper = $('<div></div>').attr('id', stickyId + '-sticky-wrapper').addClass(options.wrapperClassName);

						stickyElement.wrapAll(wrapper);
						stickyWrapper = stickyElement.parent();
					}

					var width = stickyElement.outerWidth();
					stickyWrapper.css('width', width);
					stickyElement.css('width', width);

					var height = stickyElement.outerHeight();
					stickyWrapper.css('height', height);
					stickyElement.css('height', height);

					var marginBottom = stickyElement.css('margin-bottom');
					stickyWrapper.css('margin-bottom', marginBottom);

					var marginTop = stickyElement.css('margin-top');
					stickyWrapper.css('margin-top', marginTop);

					var backgroundColor = getInheritedBackgroundColor(stickyElement);
					stickyWrapper.css('background-color', backgroundColor);
					stickyElement.css('background-color', backgroundColor);

					var currentTop = null,
						currentLeft = null,
						currentClip = null;
					if (stickyElement.hasClass(options.className)) {
						currentTop = stickyElement.css('top');
						currentLeft = stickyElement.css('left');
						currentClip = parseInt(stickyElement.css('clip-path').replace('inset(0px ', '').replace('px 0px 0px)', '')) || null;
					}

					sticked = [];
					sticked.push({
						stickyElement: stickyElement,
						stickyWrapper: stickyWrapper,
						currentTop: currentTop,
						currentLeft: currentLeft,
						currentClip: currentClip,
						options: options
					});
				});
			},
			update: scroller
		};

	$.fn.sticky = function (method) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on jQuery.sticky');
		}
	};

	$(function () {
		container = $('#appContentContainer');

		if (container[0]?.addEventListener) {
			container[0].addEventListener('scroll', scroller, false);
			window.addEventListener('resize', scroller, false);
		} else if (container[0]?.attachEvent) {
			container[0].attachEvent('onscroll', scroller);
			window.attachEvent('onresize', scroller);
		}

		setTimeout(scroller, 0);
	});
})(jQuery);
// STICKY END

// LIST PAGER VIEW START
// Uses AMD or browser globals to create a jQuery plugin.

// It does not try to register in a CommonJS environment since
// jQuery is not likely to run in those environments.
// See jqueryPluginCommonJs.js for that version.
(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery', 'finys'], factory);
	} else {
		// Browser globals
		factory(window.jQuery, window.finys);
	}
}(function ($, finys) {

	// shorten references to variables. this is better for uglification
	var ui = kendo.ui,
		Widget = ui.Widget;

	var ListViewAndPager = Widget.extend({

		// options that are avaiable to the user when initializing the widget
		options: {
			name: "ListViewAndPager",
			autoBind: true,
			template: "<a href=''>Value</a>&nbsp;",
			onSelect: function (e) { }
		},
		// method called when a new kendoYouTube widget is created
		init: function (element, options) {
			var that = this,
				id,
				_listView,
				_pager,
				CHANGE = "change";

			// base call to initialize widget
			Widget.fn.init.call(that, element, options);

			// append the element that will be the list view
			_listView = $("<div id='linksTooltip'><div></div></div>");
			that.element.append(_listView);

			// append the element that will be the pager
			_pager = $("<div class='k-pager-wrap'><div class='k-pager'></div></div>");
			that.element.append(_pager);

			that.dataSource = kendo.data.DataSource.create(that.options.dataSource);

			// results listview
			that.listView = _listView.kendoListView({
				autoBind: that.options.autoBind,
				dataSource: that.dataSource,
				template: that.options.template,
				selectable: true,
				change: window[options.onSelect]
			}).data("kendoListView");

			// pager widget
			that.pager = _pager.kendoPager({
				dataSource: that.dataSource
			}).data("kendoPager");
		}
	});

	ui.plugin(ListViewAndPager);

}));
// LIST PAGER VIEW END

// BOOKMARK START
var bookmarkStack = kendo.observable({
	items: [],
	homeTitle: "Home",
	itemToBeAdded: { title: "Home", origin: window.location.origin, isHome: true },
	poppedURL: "",
	showReturn: false,
	isReturning: false,
	handshakeBookmarkEnabled: false,
	homeURL: null,
	IsRequestFromCT: false,
	renderBookmarkMenu: function () {
		var menu = $("#bookmarkMenu").data("kendoMenu");
		$("#bookmarkMenu li").each(function (idx, menuElement) {
			if (!$(menuElement).attr("data-bookmark-return")) {
				menu.remove($(menuElement));
			}
		});
		var items = $($(bookmarkStack.items).get().reverse())
		items.each(function (index, addValue) {
			try {
				var itemIndex = bookmarkStack.items.indexOf(addValue);
				var itemID = "BookmarkItem_" + itemIndex;
				menu.append("<li id='" + itemID + "' class='k-item k-item-left'><span class='k-link' data-bind='text:items[" + itemIndex + "].title'></span></li>", "li:first-child");
				kendo.bind($("#" + itemID), bookmarkStack);
			}
			catch (ex) {
			}
		});

		//remove extra menu elements that kendo is adding
		//work around with the version of the kendo menu that has a problem
		$(".k-menu-popup").each(function (index) {
			if ($(this).children().length == 0) {
				var parent = $(this).parent();
				if (parent.attr("class") == 'k-child-animation-container')
					parent.remove();
				$(this).remove();
			}
		});
		//if any of the LI elements arent in the ul, prepend them to it.
		var itemTags = $("li[id^='BookmarkItem_']");
		itemTags.each((index) =>
		{
			var item = $(itemTags[index]);
			var parent = item.parent();
			if (parent.prop('nodeName') != "UL") {
				var trueParent = parent.find("ul");
				item.prependTo(trueParent);
			}

		})
		bookmarkStack.set("showReturn", (bookmarkStack.items.length > 0));

		if (window.location.pathname == '/Portal/Landing')
			this.cleanupBookmarkOnHome();
	},
	cleanupBookmarkOnHome: function () {
		bookmarkStack.set("showReturn", false);
		for (let i = 0; i < bookmarkStack.items.length; i++) {
			var length = bookmarkStack.items.length
			if (bookmarkStack.items[length - 1].isHome == false)
				bookmarkStack.items.pop();
		}
	},
	onSelect: function (e) {
		$('body').trigger(_FINYS_MAIN_NAVIGATE, { type: "app", source: "bookmark" });

		var text = $(e.item).children("span.k-link").text();
		var bookmarkReturn = $(e.item).attr("data-bookmark-return");
		var stackObj = null;

		try {//Close Error window if open
			window.errorWin.close();
		} catch (e) { }


		if (bookmarkReturn) {
			fnNavigateToPreviousBookmark(false);
		}
		else {
			$($(bookmarkStack.items).get().reverse()).each(function (index, val) {
				if (val.title == text) {
					stackObj = val;
					return false;
				}
			});
			fnNavigateToBookmark(stackObj);
		}
	}
});

bookmarkStack.bind("change", function (e) {
	if (e.field == "homeURL") {
		if (bookmarkStack.items.length > 0 && bookmarkStack.items[0].isHome === true) {
			bookmarkStack.set("items[0].origin", bookmarkStack.get(e.field));
		} else if (bookmarkStack.itemToBeAdded != null && bookmarkStack.itemToBeAdded.isHome === true) {
			bookmarkStack.set("itemToBeAdded.origin", bookmarkStack.get(e.field));
		}
	}
	else if (e.field == "homeTitle") {
		if (bookmarkStack.items.length > 0 && bookmarkStack.items[0].isHome === true) {
			bookmarkStack.set("items[0].title", bookmarkStack.get(e.field));
		} else if (bookmarkStack.itemToBeAdded != null && bookmarkStack.itemToBeAdded.isHome === true) {
			bookmarkStack.set("itemToBeAdded.title", bookmarkStack.get(e.field));
		}
	}
	else if (e.field != "items") {
		return;
	}

	if (e.action == "add" || e.action == "remove") {
		bookmarkStack.renderBookmarkMenu();
	}
});


function fnNavigateToBookmark(bookmarkObj) {
	if (bookmarkStack.isReturning == false) {
		bookmarkStack.set("isReturning", true);
	}
	else {
		bookmarkSyncing.syncBookmarks();
		return;
	}

	var stackObj = null;
	var stackObjIndex = null;

	$($(bookmarkStack.items).get().reverse()).each(function (index, val) {
		stackObj = val;
		bookmarkStack.itemToBeAdded = stackObj;
		if (stackObj.title == bookmarkObj.title) {
			stackObjIndex = bookmarkStack.items.indexOf(val);
			return false;
		}
		bookmarkStack.set("poppedURL", stackObj.title);
		bookmarkStack.items.pop();
	});

	try {//Close Error window if open
		window.errorWin.close();
	} catch (e) { }

	if (stackObj.title === bookmarkStack.get("homeTitle")) {
		kendo.ui.progress($('body'), true);
		bookmarkSyncing.clearBookmarks();

		if (bookmarkStack.IsRequestFromCT == true && bookmarkStack.handshakeBookmarkEnabled == false) {
			finysAjax({
				actionUrl: '/Policy/Handshake/ProcessHandshakeHome',
				containerName: 'appContent',
				actionType: 'GET',
				successFunc: function (response) {
					$("#appContent").html(response.script);
				}
			});
		}
		else if (stackObj.origin != window.location.origin) {
			finysAjax({
				actionUrl: "/Portal/Handshake/PerformHandshake",
				actionType: "POST",
				dataType: "json",
				contentType: "application/json",
				processData: false,
				data: kendo.stringify({ actionName: "Home" }),
				successFunc: function (response) {
					response.handled = true;
					$("#appContent").html(response.script);
				}
			});

		} else {
			//window.location.replace(window.location.href.split('#').shift());
			window.location.replace(stackObj.origin);
		}
		return;
	}
	else if (stackObj.origin !== window.location.origin) {
		// This will be assigned in the sister site
		bookmarkStack.itemToBeAdded = null;

		bookmarkSyncing.syncBookmarks(stackObjIndex);

		kendo.ui.progress($("body"), true);
		finysAjax({
			actionUrl: "/Portal/Handshake/PerformHandshake",
			actionType: "POST",
			dataType: "json",
			contentType: "application/json",
			processData: false,
			data: kendo.stringify({ actionName: "Bookmark" }),
			successFunc: function (response) {
				response.handled = true;
				$("#appContent").html(response.script);
			}
		});

		return;
	}
	else {
		finysAjax(stackObj.dataObj);
	}

	bookmarkStack.items.pop();
	bookmarkSyncing.syncBookmarks();
}

function fnNavigateToPreviousBookmark(clearTrigger) {
	if (clearTrigger) {
		fnRemoveCleanupEvent();
	}

	fnNavigateToBookmark(bookmarkStack.items[bookmarkStack.items.length - 1]);
}

function fnSetNavigationBookmark(data, result) {
	if (bookmarkStack.handshakeBookmarkEnabled == false) {
		var str = data.actionUrl;
		var matchstr = "IsRequestFromCT=True";
		if (str.indexOf(matchstr) > 0 && bookmarkStack.get("IsRequestFromCT") == false) {
			//Bookmark or Returning (reload base bookmarkstack)
			finysAjax({
				async: false,
				actionUrl: "/Policy/Handshake/SetBookmarkLogout",
				dataType: "json",
				successFunc: function (handshakeResult) {
					try {
						handshakeResult.handled = true;
						bookmarkStack.set("IsRequestFromCT", true);
						bookmarkStack.set("showReturn", true);
						if (handshakeResult.hasOwnProperty("BookmarkItems")) {
							//Clear Bookmark Items and Add CT Items
							bookmarkStack.set("itemToBeAdded", null);
							bookmarkStack.items.splice(0, bookmarkStack.items.length);
							bookmarkStack.set("homeTitle", "NO HOME ACTION");

							$(handshakeResult.BookmarkItems).each(function (idx, bookmarkItem) {
								var bookmarkStackItem = eval("(function(){ return " + bookmarkItem + "; })();");
								bookmarkStack.items.push(bookmarkStackItem);
							});
						}
						else if (handshakeResult.hasOwnProperty("HomeTitle")) {
							bookmarkStack.set("homeTitle", handshakeResult.HomeTitle);
						}

						if (handshakeResult.hasOwnProperty("LogoutURL")) {
							setLogoutURL(handshakeResult.LogoutURL);
						}
						if (handshakeResult.hasOwnProperty("TimeoutURL")) {
							headerModel.set("timeoutURL", handshakeResult.TimeoutURL);
						}
					}
					catch (ex) {
						ShowInfo({ IsException: true, Message: ex });
					}
				}
			})
		}
	}
	if ($("#bookmarkMenu") == null || data.containerName != "appContent") {
		return;
	}
	else if (bookmarkStack.isReturning) {
		bookmarkSyncing.syncBookmarks();
		bookmarkStack.set("isReturning", false);
		return;
	}

	if (bookmarkStack.itemToBeAdded != null) {        //Remove any duplicate bookmark
		$($(bookmarkStack.items).get().reverse()).each(function (index, val) {
			if (val.title == bookmarkStack.itemToBeAdded.title) {
				bookmarkStack.items.remove(val); return false; //Only one if exists so stop when found
			}
		});

		// 1st add itemToBeAdded to stack
		bookmarkStack.items.push(bookmarkStack.itemToBeAdded);
		bookmarkStack.itemToBeAdded = null;

	}

	// add current screen's bookmark based on condition
	if (result.SetBookmark == false) {
		bookmarkSyncing.syncBookmarks();
		return;
	}

	var bookmarkObj = { title: result.Title, dataObj: data, origin: window.location.origin, isHome: false };
	bookmarkStack.itemToBeAdded = bookmarkObj;

	bookmarkSyncing.syncBookmarks();
}
// BOOKMARK END

// PAGE TITLE START
function fnSetBrowserPageTitle(data, result) {
	if (data.containerName != "appContent" || result.hasOwnProperty("Title") == false)
		return;

	const doc = $(document);
	if (result.Title)
		doc.attr('title', `Finys - ${result.Title}`);
	else doc.attr('title', "Finys");
}
// PAGE TITLE END

// SESSION TIMEOUT START
function fnSetTimeoutDuration() {
	if (!securityModel.get("userLoggedIn")) {//user authenticated
		return;
	}

	if (typeof SM_TimeoutDuration === 'undefined' || typeof SM_WarningDuration === 'undefined') {//if duration are not set, retrieve them
		$.ajax({
			async: false,
			type: "GET",
			url: '/FinysPortal/Session/GetSessionInfo',
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			success: function (json) {
				if (typeof SM_TimeoutDuration === 'undefined' || typeof SM_WarningDuration === 'undefined') {
					SM_TimeoutDuration = covertToMilliseconds(json.TimeoutDuration);
					SM_WarningDuration = covertToMilliseconds(json.WarningDuration);

					if (typeof SM_MainTimer !== 'undefined') {
						clearTimeout(SM_MainTimer);
					}

					SM_MainTimer = setTimeout(fnWarningTimeout, SM_TimeoutDuration - SM_WarningDuration);
				}
			}
		});
	}
	else {
		if (typeof SM_MainTimer !== 'undefined') {
			clearTimeout(SM_MainTimer);
		}

		SM_MainTimer = setTimeout(fnWarningTimeout, SM_TimeoutDuration - SM_WarningDuration);
	}
}

function covertToMilliseconds(minutes) {
	return minutes * 60 * 1000; //milliseconds
}

function formatTimer(totalSeconds) {
	var minutes = Math.floor(totalSeconds / 60);
	var seconds = totalSeconds - (minutes * 60);

	var strMinutes = (minutes < 10) ? "0" + minutes.toString() : minutes.toString();
	var strSeconds = (seconds < 10) ? "0" + seconds.toString() : seconds.toString();

	return strMinutes + ":" + strSeconds;
}

function fnWarningTimeout() {
	if (typeof SM_WarningTimer !== 'undefined') {
		clearTimeout(SM_WarningTimer);
	}

	var topPosition = window.innerHeight / 2 - ((window.innerHeight * 0.7) / 2);
	var leftPosition = window.innerWidth / 2 - ((window.innerWidth * 0.7) / 2);

	if (typeof SM_NotificationPopup !== 'undefined') {
		SM_NotificationPopup.hide();
	}

	SM_NotificationPopup = $("#timeoutNotification").kendoNotification({
		position: {
			pinned: true,
			top: topPosition,
			left: leftPosition
		},
		autoHideAfter: 0,
		hideOnClick: false,
		show: fnBringNotificationToFront,
		width: "70%",
		height: "70%",
		templates: [{
			type: "info",
			template: $("#countdownTemplate").html()
		}]
	}).data("kendoNotification");

	SM_WarningTimer = setTimeout(fnSessionTimeout, SM_WarningDuration);
	SM_CountdownDuration = SM_WarningDuration;

	SM_NotificationPopup.info({
		message: "The session will timeout in"
	});

	$('#countdownTime').text(formatTimer((SM_CountdownDuration) / 1000));
	$("#extendSession").bind("click", fnExtendSessionClick);

	SM_CountdownTimer = setInterval(function () {
		SM_CountdownDuration = SM_CountdownDuration - 1000;
		$('#countdownTime').text(formatTimer((SM_CountdownDuration) / 1000));
	}, 1000);
}

function fnExtendSessionClick() {
	$.ajax({
		type: "POST",
		url: '/FinysPortal/Session/ExtendSession',
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (json) {
			fnResetSessionDuration();

			var topPosition = window.innerHeight / 2 - ((window.innerHeight * 0.7) / 2);
			var leftPosition = window.innerWidth / 2 - ((window.innerWidth * 0.7) / 2);

			if (SM_NotificationPopup !== null) {
				SM_NotificationPopup.hide();
			}

			SM_NotificationPopup = $("#timeoutNotification").kendoNotification({
				position: {
					pinned: true,
					top: topPosition,
					left: leftPosition
				},
				autoHideAfter: 4000,
				hideOnClick: true,
				show: fnBringNotificationToFront,
				width: "70%",
				height: "70%",
				templates: [{
					type: "info",
					template: $("#extendSessionTemplate").html()
				}]
			}).data("kendoNotification");

			$('#countdownTime').text("");
			SM_NotificationPopup.info({
				message: "The session has been extended"
			});
		}
	});
}

function fnBringNotificationToFront(e) {
	e.element[0].parentElement.style.zIndex = 10004;
}

function fnSessionTimeout() {
	if (typeof SM_MainTimer !== 'undefined') {
		clearTimeout(SM_MainTimer);
	}

	if (typeof SM_WarningTimer !== 'undefined') {
		clearTimeout(SM_WarningTimer);
	}

	if (typeof SM_CountdownTimer !== 'undefined') {
		clearInterval(SM_CountdownTimer);
	}

	if (typeof SM_NotificationPopup !== 'undefined') {
		SM_NotificationPopup.hide();
	}
	$('#countdownTime').text(formatTimer(0));
	document.cookie = "logoutType=SessionTimeout";
	headerModel.logoutClick(new $.Event("session_timeout")); //Logout function will handle Session.Abandon and save
}

function fnResetSessionDuration() {
	if (typeof SM_MainTimer !== 'undefined') {
		clearTimeout(SM_MainTimer);
	}

	if (typeof SM_WarningTimer !== 'undefined') {
		clearTimeout(SM_WarningTimer);
	}

	if (typeof SM_CountdownTimer !== 'undefined') {
		clearInterval(SM_CountdownTimer);
	}

	if (typeof SM_NotificationPopup !== 'undefined') {
		SM_NotificationPopup.hide();
	}

	fnSetTimeoutDuration();
}
// SESSION TIMEOUT END

// Theme Builder START
var themeBuilderViewModel = kendo.observable({
	accentColor: "#4682B4",
	widgetBase: "#e9e9e9",
	widgetBackground: "#ffffff",
	normalBackground: "#00334d",
	normalText: "#2e2e2e",
	normalGradient: "rgba(255, 255, 255, 0.6) 0px, rgba(255, 255, 255, 0) 100%",
	hoverBackground: "#bcb4b0",
	hoverText: "#2e2e2e",
	hoverGradient: "rgba(255, 255, 255, 0.4) 0px, rgba(255, 255, 255, 0) 100%",
	selectedBackground: "#4682B4",
	selectedText: "#ffffff",
	selectedGradient: "rgba(255, 255, 255, 0.2) 0px, rgba(255, 255, 255, 0) 100%",
	updateLess: function (e) {
		less.modifyVars({
			'@accent': this.accentColor,
			'@base': this.widgetBase,
			'@background': this.widgetBackground,
			'@normal-background': this.normalBackground,
			'@normal-text-color': this.normalText,
			'@normal-gradient': this.normalGradient,
			"@hover-background": this.hoverBackground,
			"@hover-text-color": this.hoverText,
			"@hover-gradient": this.hoverGradient,
			"@selected-background": this.selectedBackground,
			"@selected-text-color": this.selectedText,
			"@selected-gradient": this.selectedGradient
		});
	},
	saveLess: function (e) {
		var lessStyle = $("style").filter(function () { return typeof $(this).attr("id") != "undefined" && $(this).attr("id") != "" && $(this).attr("id").indexOf("less") > -1; }).get(0);
		var lessCSS = $(lessStyle).text();

		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(lessCSS));
		element.setAttribute('download', "finys.custom.css");

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
	}
});

function fn_showThemeBuilderPanel() {
	var tbTreeViewHtml = '<div id="tb_treeview"> <div> <label id="accentColorLbl">Accent Color</label> <input id="accentColor" data-role="colorpicker" data-bind="value: accentColor, events:{change: updateLess}" style="display:inline-block; width:100px;"/> </div></br> <div> <label id="widgetBaseLbl">Widget Base</label> <input id="widgetBase" data-role="colorpicker" data-bind="value: widgetBase, events:{change: updateLess}" style="display:inline-block; width:100px;"/> </div></br> <div> <label id="widgetBackgroundLbl">Widget Background</label> <input id="widgetBackground" data-role="colorpicker" data-bind="value: widgetBackground, events:{change: updateLess}" style="display:inline-block; width:100px;"/> </div></br><div> <label id="normalBackgroundLbl">Normal Background</label> <input id="normalBackground" data-role="colorpicker" data-bind="value: normalBackground, events:{change: updateLess}" style="display:inline-block; width:100px;"/> </div></br> <div> <label id="normalTextLbl">Normal Text</label> <input id="normalText" data-role="colorpicker" data-bind="value: normalText, events:{change: updateLess}" style="display:inline-block; width:100px;"/> </div></br> <div> <label id="hoverBackgroundLbl">Hover Background</label> <input id="hoverBackground" data-role="colorpicker" data-bind="value: hoverBackground, events:{change: updateLess}" style="display:inline-block; width:100px;"/> </div></br> <div> <label id="hoverTextLbl">Hover Text</label> <input id="hoverText" data-role="colorpicker" data-bind="value: hoverText, events:{change: updateLess}" style="display:inline-block; width:100px;"/> </div></br> <div> <label id="selectedTextLbl">Selected Text</label> <input id="selectedText" data-role="colorpicker" data-bind="value: selectedText, events:{change: updateLess}" style="display:inline-block; width:100px;"/> </div></br><div><input id="saveLessBtn" data-role="button" data-bind="events:{click: saveLess}" value="Save CSS"/></div></div>';
	if (window['themeBuilderWin'] == undefined) {
		window.themeBuilderWin = $('<div id="themeBuilderWin" class="f-theme-builder-win f-theme-builder-win-default" name="themeBuilderWin" />').append('body').kendoWindow({
			title: 'Theme Builder',
			actions: ['pin'],
			resizable: false,
			draggable: false,
			pinned: true,
			animation: false,
			activate: function (e) {
			},
			close: function (e) {
				$('#appContentContainer').css({ marginLeft: 'auto' });
				$('#themeBuilderWin').html('');
			}
		}).data('kendoWindow');
		$(window.themeBuilderWin.wrapper).on('transitionend', themeBuilderWin_OnTransitionEnd);
		$(window).on('scroll', themeBuilderWin_OnWindowScroll);
		$(window).on('resize', themeBuilderWin_OnWindowResize);
		$(window.themeBuilderWin.wrapper).addClass('f-themeBuilderWinWrapper').addClass('f-theme-builder-win-pinned');

		window.themeBuilderWin.content(tbTreeViewHtml).center().open();
		window.themeBuilderWin.wrapper.find('.k-window-actions').on('click', themeBuilderWin_OnPinClick);

		themeBuilderWin_RepositionWindow(window.themeBuilderWin.options.pinned);

		kendo.bind($('#tb_treeview'), themeBuilderViewModel);
	}
	else {
		window.themeBuilderWin.pin();
		$(window.themeBuilderWin.wrapper).on('transitionend', themeBuilderWin_OnTransitionEnd);
		$(window).on('scroll', themeBuilderWin_OnWindowScroll);
		$(window).on('resize', themeBuilderWin_OnWindowResize);
		$(window.themeBuilderWin.wrapper).removeClass('f-theme-builder-win-unpinned').addClass('f-themeBuilderWinWrapper').addClass('f-theme-builder-win-pinned');

		window.themeBuilderWin.content(tbTreeViewHtml).center().open();
		window.themeBuilderWin.wrapper.find('.k-window-actions').on('click', themeBuilderWin_OnPinClick);

		themeBuilderWin_RepositionWindow(window.themeBuilderWin.options.pinned);

		kendo.bind($('#tb_treeview'), themeBuilderViewModel);
	}
}

function themeBuilderWin_OnPinClick(e) {
	var themeBuilderWinWrapper = $(window.themeBuilderWin.wrapper);
	$(window).scrollLeft(0);
	themeBuilderWin_OnWindowScroll();
	if (window.themeBuilderWin.options.pinned) {
		var newLeft = themeBuilderWinWrapper.offset().left + window.pageXOffset;

		$('#appContentContainer').css({ marginLeft: 'auto' });
		$(window.themeBuilderWin.wrapper).animate({ left: '-=' + newLeft }, 0, function () { $(window.themeBuilderWin.wrapper).removeClass('f-theme-builder-win-unpinned-hover'); });

		themeBuilderWinWrapper.removeClass('f-theme-builder-win-pinned').removeClass('f-theme-builder-win-unpinned-hover').addClass('f-theme-builder-win-unpinned');
	}
	else {
		themeBuilderWinWrapper.removeClass('f-theme-builder-win-unpinned').addClass('f-theme-builder-win-pinned');
		$('#appContentContainer').css({ marginLeft: 'auto' });
		var diffX = window.pageXOffset;

		var containerLeftMargin = $('#appContentContainer').offset().left;
		var themeBuilderWinOuterWidth = window.themeBuilderWin.wrapper.outerWidth() + diffX;

		if (themeBuilderWinOuterWidth > containerLeftMargin) {
			$('#appContentContainer').css({ marginLeft: themeBuilderWinOuterWidth });
		}
	}
}
function themeBuilderWin_OnWindowResize(e) {
	themeBuilderWin_RepositionWindow(window.themeBuilderWin.options.pinned);
}
function themeBuilderWin_OnTransitionEnd(e) {
	if (window.themeBuilderWin.options.pinned == false) {
		$(window.themeBuilderWin.wrapper).addClass('f-theme-builder-win-unpinned-hover');
		if ($(window.themeBuilderWin.wrapper).offset().left < 0) {
			themeBuilderWin_RepositionWindow(false);
		}
	}
	else {
		$(window.themeBuilderWin.wrapper).removeClass('f-theme-builder-win-unpinned-hover');
	}
}
function themeBuilderWin_OnWindowScroll(e) {
	if (typeof window.themeBuilderWinX == 'undefined') {
		window.themeBuilderWinX = window.pageXOffset;
	}

	if (window.themeBuilderWinX > 0) {
		$(window.themeBuilderWin.wrapper).removeClass('f-theme-builder-win-pinned').removeClass('themeBuilderWinPinnedHover');
	}

	var diffX = window.themeBuilderWinX - window.pageXOffset;
	window.themeBuilderWinX = window.pageXOffset;

	$(window.themeBuilderWin.wrapper).animate({ left: '+=' + diffX }, 0, function () {
		if (window.themeBuilderWin.options.pinned) {
			$(window.themeBuilderWin.wrapper).removeClass('f-theme-builder-win-unpinned-hover');
		}
		else {
			$(window.themeBuilderWin.wrapper).addClass('f-theme-builder-win-unpinned-hover');
		}
	});
}
function themeBuilderWin_RepositionWindow(pinned) {
	if (pinned) {
		$('#appContentContainer').css({ marginLeft: 'auto' });
		if (typeof window.themeBuilderWinX == 'undefined') {
			window.themeBuilderWinX = window.pageXOffset;
		}

		var diffX = window.themeBuilderWinX - window.pageXOffset;
		var containerLeftMargin = $('#appContentContainer').offset().left;
		var themeBuilderWinOuterWidth = window.themeBuilderWin.wrapper.outerWidth() + diffX;

		if (themeBuilderWinOuterWidth > containerLeftMargin) {
			$('#appContentContainer').css({ marginLeft: themeBuilderWinOuterWidth });
		}
	}
	else {
		var themeBuilderWinOuterWidth = window.themeBuilderWin.wrapper.outerWidth();
		var themeBuilderWinLeftMargin = $(window.themeBuilderWin.wrapper).offset().left - window.pageXOffset;
		var windowWidth = $(window).width();
		var containerWidth = $('#appContentContainer').width();

		if (windowWidth < containerWidth + (themeBuilderWinOuterWidth + themeBuilderWinLeftMargin)) {
			$('#appContentContainer').css({ marginLeft: themeBuilderWinOuterWidth + themeBuilderWinLeftMargin });
		}
		else {
			$('#appContentContainer').css({ marginLeft: 'auto' });
		}
	}
}

// Theme Builder END
(function (datePickerFN) {
	var FinysDatePicker = kendo.ui.DatePicker.extend({
		init: function (element, options) {
			var that = this;
			datePickerFN.init.call(this, element, options);
			that.element.bind("keydown", function (e) {
				that._finysKeydown(e);
			});
			that.element.bind("blur", function (e) {
				that._finysBlur(e);
			});
		},
		_finysOldValue: null,
		value: function (value) {
			var element = this.element[0],
				datePicker = this.element.data('kendoDatePicker'),
				monthIndexes = [0, 1],
				dayIndexes = [3, 4];

			if (value === undefined) {
				var dateValue = datePickerFN.value.call(this, value);
				var oldValue = this._finysOldValue;
				var strValue = $(datePicker.element).val();

				if (strValue == "") {
					this._finysOldValue = null;
				} else {
					if (typeof dateValue == "undefined" || dateValue == null) {
						datePickerFN.value.call(this, oldValue);
					} else {
						this._finysOldValue = dateValue;
					}
				}

				strValue = $(datePicker.element).val();
				var valueArray = strValue.split('');

				if (strValue.indexOf("/") == -1 || strValue.indexOf("/") <= 2) {
					if (strValue.indexOf("/") > -1) {
						var monthStr = strValue.substring(0, strValue.indexOf("/"));
						if (monthStr.length == 1) {
							monthIndexes = [0];
							dayIndexes = [2, 3];
						}
						var noMonths = strValue.substring(strValue.indexOf("/") + 1, strValue.length);
						if (noMonths != "") {
							var hasSlash = false;
							var yearStr = noMonths.substring(noMonths.indexOf("/") + 1, noMonths.length);

							if (noMonths.indexOf("/") > -1) {
								hasSlash = true;
								noMonths = noMonths.substring(0, noMonths.indexOf("/"));
							}

							if (noMonths.length == 2) {
								if (monthIndexes.length == 1) {
									dayIndexes = [2, 3];
								}
							} else if (noMonths.length == 1 && hasSlash) {
								if (monthIndexes.length == 2) {
									dayIndexes = [3];
								} else {
									dayIndexes = [2];
								}
							}
						}
					}
				}

				var month = parseInt(fn_GetValueFromArray(valueArray, monthIndexes[0], monthIndexes[monthIndexes.length - 1])),
					day = parseInt(fn_GetValueFromArray(valueArray, dayIndexes[0], dayIndexes[dayIndexes.length - 1]));
				if (typeof month != "undefined" && typeof day != "undefined") {
					if (month < 10 && day < 10) {
						fn_SetDatePickerOptions(this.element, "M/d/yyyy", ["M/d/yyyy", "M/d/yy"]);
					} else if (month < 10 && day >= 10) {
						fn_SetDatePickerOptions(this.element, "M/dd/yyyy", ["M/dd/yyyy", "M/dd/yy"]);
					} else if (month >= 10 && day < 10) {
						fn_SetDatePickerOptions(this.element, "MM/d/yyyy", ["MM/d/yyyy", "MM/d/yy"]);
					} else {
						fn_SetDatePickerOptions(this.element, "MM/dd/yyyy", ["MM/dd/yyyy", "MM/dd/yy"]);
					}
				}

				return datePickerFN.value.call(this);
			}
			datePickerFN.value.call(this, value);
		},
		_finysBlur: function (e) {
			var element = this.element[0],
				valueArray = element.value.split(''),
				datePicker = this.element.data('kendoDatePicker');

			datePicker.value(valueArray.join(""));

			var newDate = datePicker.value();
			var oldDate = this._finysOldValue;

			if (typeof newDate == "undefined" || newDate == null) {
				datePicker.value(oldDate);
			} else {
				this._finysOldValue = newDate;
			}
		},
		_finysKeydown: function (e) {
			var element = this.element[0],
				keyValue = e.key,
				keyCode = e.keyCode,
				selection = kendo.caret(element),
				valueArray = element.value.split(''),
				datePicker = this.element.data('kendoDatePicker'),
				format = datePicker.options.format,
				monthIndexes = [0, 1],
				dayIndexes = [3, 4],
				canProceed = true;

			if (selection[0] !== selection[1]) {
				for (var i = selection[1]; i >= selection[0]; --i) {
					valueArray.splice(i, 1);
				}
			}

			if ((keyCode >= 48 && keyCode <= 57) || (keyCode >= 96 && keyCode <= 105) || (keyCode == 191 || keyCode == 111)) {
				valueArray.splice(selection[0], 0, keyValue);
			}
			var value = valueArray.join(""),
				slashFilter = valueArray.filter(function (strValue) { return strValue === "/"; }),
				numOfSlashes = slashFilter.length;

			if (value.indexOf("/") == -1 || value.indexOf("/") <= 2) {
				if (value.indexOf("/") > -1) {
					var monthStr = value.substring(0, value.indexOf("/"));
					if (monthStr.length == 1) {
						monthIndexes = [0];
						dayIndexes = [2, 3];
					}
					var noMonths = value.substring(value.indexOf("/") + 1, value.length);
					if (noMonths != "") {
						var hasSlash = false;
						var yearStr = noMonths.substring(noMonths.indexOf("/") + 1, noMonths.length);

						if (noMonths.indexOf("/") > -1) {
							hasSlash = true;
							noMonths = noMonths.substring(0, noMonths.indexOf("/"));
						}

						if (noMonths.length == 2) {
							if (monthIndexes.length == 1) {
								dayIndexes = [2, 3];
							}
						} else if (noMonths.length == 1 && hasSlash) {
							if (monthIndexes.length == 2) {
								dayIndexes = [3];
							} else {
								dayIndexes = [2];
							}
						}
						if (selection[0] == value.length - 1 && yearStr.length > 4) {
							canProceed = false;
						}
					}
				}
			}

			var month = parseInt(fn_GetValueFromArray(valueArray, monthIndexes[0], monthIndexes[monthIndexes.length - 1]));
			var day = parseInt(fn_GetValueFromArray(valueArray, dayIndexes[0], dayIndexes[dayIndexes.length - 1]));

			if (value == "") {
				month = parseInt(keyValue)
			}

			/*backspace, delete, escape, tab, enter*/                        /*Ctrl+A,C,or V (Select All, Copy, Paste*/               /*home, end, left, right, down, up*/               /*F1 - F12*/
			if ($.inArray(keyCode, [46, 8, 27, 110, 9, 13]) !== -1 || (e.ctrlKey === true && (keyCode == 65 || keyCode == 86 || keyCode == 67)) || (keyCode >= 35 && keyCode <= 40) || (keyCode >= 112 && keyCode <= 123)) {
				return;
			} else if ((keyCode >= 48 && keyCode <= 57) || (keyCode >= 96 && keyCode <= 105)) {/*numeric keys*/
				if (canProceed == false) {
					fn_SetPreventDefault();
				} else {
					if (selection[0] === monthIndexes[0]) {
						if ($.inArray(keyValue, ["2", "3", "4", "5", "6", "7", "8", "9"]) > -1) {
							fn_SetPreventDefault();
							if (typeof day != "undefined" && day < 10 && format != "M/d/yyyy") {
								fn_SetDatePickerOptions(this.element, "M/d/yyyy", ["M/d/yyyy", "M/d/yy"]);
							} else if ((typeof day == "undefined" || day >= 10) && format != "M/dd/yyyy") {
								fn_SetDatePickerOptions(this.element, "M/dd/yyyy", ["M/dd/yyyy", "M/dd/yy"]);
							}
							if (numOfSlashes < 2) {
								valueArray.splice(selection[0] + 1, 0, "/");
								$(this.element).val(valueArray.join(""));
								fn_SetCaretPosition(element.id, selection[0] + 2);
							} else {
								$(this.element).val(valueArray.join(""));
								fn_SetCaretPosition(element.id, selection[0] + 1);
							}
						}
					} else if (monthIndexes.length == 2 && selection[0] == monthIndexes[1]) {
						fn_SetPreventDefault();
						if (typeof day != "undefined" && day < 10 && format != "MM/d/yyyy") {
							fn_SetDatePickerOptions(this.element, "MM/d/yyyy", ["MM/d/yyyy", "MM/d/yy"]);
						} else if ((typeof day == "undefined" || day >= 10) && format != "MM/dd/yyyy") {
							fn_SetDatePickerOptions(this.element, "MM/dd/yyyy", ["MM/dd/yyyy", "MM/dd/yy"]);
						}
						if (numOfSlashes < 2) {
							if (month > 12) {
								valueArray.splice(selection[0], 0, "/");
							} else {
								valueArray.splice(selection[0] + 1, 0, "/");
							}
							$(this.element).val(valueArray.join(""));
							fn_SetCaretPosition(element.id, selection[0] + 2);
						} else {
							$(this.element).val(valueArray.join(""));
							fn_SetCaretPosition(element.id, selection[0] + 1);
						}
					} else if (monthIndexes.length == 2 && selection[0] == monthIndexes[1] + 1) {
						fn_SetPreventDefault();
						if (typeof day != "undefined" && day < 10 && format != "MM/d/yyyy") {
							fn_SetDatePickerOptions(this.element, "MM/d/yyyy", ["MM/d/yyyy", "MM/d/yy"]);
						} else if ((typeof day == "undefined" || day >= 10) && format != "MM/dd/yyyy") {
							fn_SetDatePickerOptions(this.element, "MM/dd/yyyy", ["MM/dd/yyyy", "MM/dd/yy"]);
						}
						if (numOfSlashes < 2) {
							valueArray.splice(selection[0], 0, "/");
							$(this.element).val(valueArray.join(""));
							fn_SetCaretPosition(element.id, selection[0] + 2);
						} else {
							$(this.element).val(valueArray.join(""));
							fn_SetCaretPosition(element.id, selection[0] + 1);
						}
					} else if (selection[0] == dayIndexes[0]) {
						var singleDigitDays = ["4", "5", "6", "7", "8", "9"];
						if (month == 2) {
							singleDigitDays.unshift("3");
						}
						if ($.inArray(keyValue, singleDigitDays) > -1) {
							fn_SetPreventDefault();
							if (typeof month != "undefined" && month < 10 && format != "M/d/yyyy") {
								fn_SetDatePickerOptions(this.element, "M/d/yyyy", ["M/d/yyyy", "M/d/yy"]);
							} else if ((typeof month == "undefined" || month >= 10) && format != "MM/d/yyyy") {
								fn_SetDatePickerOptions(this.element, "MM/d/yyyy", ["MM/d/yyyy", "MM/d/yy"]);
							}
							if (numOfSlashes < 2) {
								valueArray.splice(selection[0] + 1, 0, "/");
								$(this.element).val(valueArray.join(""));
								fn_SetCaretPosition(element.id, selection[0] + 2);
							} else {
								$(this.element).val(valueArray.join(""));
								fn_SetCaretPosition(element.id, selection[0] + 1);
							}
						} else {
							fn_SetPreventDefault();
							if (typeof month != "undefined" && month < 10 && format != "M/d/yyyy") {
								fn_SetDatePickerOptions(this.element, "M/d/yyyy", ["M/d/yyyy", "M/d/yy"]);
							} else if ((typeof month == "undefined" || month >= 10) && format != "MM/d/yyyy") {
								fn_SetDatePickerOptions(this.element, "MM/d/yyyy", ["MM/d/yyyy", "MM/d/yy"]);
							}
							$(this.element).val(valueArray.join(""));
							fn_SetCaretPosition(element.id, selection[0] + 1);
						}
					} else if (dayIndexes.length == 2 && selection[0] == dayIndexes[1]) {
						fn_SetPreventDefault();
						if ((month == 2 && day > 29) || (month !== 2 && day > 31)) {
							if (typeof month != "undefined" && month < 10 && format != "M/d/yyyy") {
								fn_SetDatePickerOptions(this.element, "M/d/yyyy", ["M/d/yyyy", "M/d/yy"]);
							} else if ((typeof month == "undefined" || month >= 10) && format != "MM/d/yyyy") {
								fn_SetDatePickerOptions(this.element, "MM/d/yyyy", ["MM/d/yyyy", "MM/d/yy"]);
							}
							if (numOfSlashes == 1) {
								valueArray.splice(selection[0], 0, "/");
								$(this.element).val(valueArray.join(""));
								fn_SetCaretPosition(element.id, selection[0] + 2);
							} else {
								$(this.element).val(valueArray.join(""));
								fn_SetCaretPosition(element.id, selection[0] + 1);
							}
						} else {
							if (typeof month != "undefined" && month < 10 && format != "M/dd/yyyy") {
								fn_SetDatePickerOptions(this.element, "M/dd/yyyy", ["M/dd/yyyy", "M/dd/yy"]);
							} else if ((typeof month == "undefined" || month >= 10) && format != "MM/dd/yyyy") {
								fn_SetDatePickerOptions(this.element, "MM/dd/yyyy", ["MM/dd/yyyy", "MM/dd/yy"]);
							}
							if (numOfSlashes == 1) {
								valueArray.splice(selection[0] + 1, 0, "/");
								$(this.element).val(valueArray.join(""));
								fn_SetCaretPosition(element.id, selection[0] + 2);
							} else {
								$(this.element).val(valueArray.join(""));
								fn_SetCaretPosition(element.id, selection[0] + 1);
							}
						}
					} else if (dayIndexes.length == 2 && selection[0] == dayIndexes[1] + 1) {
						fn_SetPreventDefault();
						if (numOfSlashes == 1) {
							valueArray.splice(selection[0], 0, "/")
							$(this.element).val(valueArray.join(""));
							fn_SetCaretPosition(element.id, selection[0] + 2);
						} else {
							$(this.element).val(valueArray.join(""));
							fn_SetCaretPosition(element.id, selection[0] + 1);
						}
					}
				}
			} else if (keyCode == 191 || keyCode == 111) { /*forward slash*/
				if (numOfSlashes == 3 && fn_GetValueFromArray(valueArray, selection[0] + 1, selection[0] + 1) === "/") {
					fn_SetPreventDefault();
					fn_SetCaretPosition(element.id, selection[0] + 1);
				} else if (numOfSlashes <= 2) {
					if (selection[0] == monthIndexes[monthIndexes.length - 1] + 1) {
						fn_SetPreventDefault();
						if (typeof day != "undefined" && day < 10 && format != "M/d/yyyy") {
							fn_SetDatePickerOptions(this.element, "M/d/yyyy", ["M/d/yyyy", "M/d/yy"]);
						} else if ((typeof month == "undefined" || month >= 10) && format != "M/dd/yyyy") {
							fn_SetDatePickerOptions(this.element, "M/dd/yyyy", ["M/dd/yyyy", "M/dd/yy"]);
						}
						if (fn_GetValueFromArray(valueArray, selection[0] - 1, selection[0] - 1) === "/") {
							valueArray.splice(selection[0], 1);
							$(this.element).val(valueArray.join(""));
							fn_SetCaretPosition(element.id, selection[0]);
						} else {
							$(this.element).val(valueArray.join(""));
							fn_SetCaretPosition(element.id, selection[0] + 1);
						}
					} else if (selection[0] == dayIndexes[dayIndexes.length - 1] + 1) {
						fn_SetPreventDefault();
						if (typeof month != "undefined" && month < 10 && format != "M/d/yyyy") {
							fn_SetDatePickerOptions(this.element, "M/d/yyyy", ["M/d/yyyy", "M/d/yy"]);
						} else if ((typeof month == "undefined" || month >= 10) && format != "MM/dd/yyyy") {
							fn_SetDatePickerOptions(this.element, "MM/d/yyyy", ["MM/d/yyyy", "MM/d/yy"]);
						}
						if (fn_GetValueFromArray(valueArray, selection[0] - 1, selection[0] - 1) === "/") {
							valueArray.splice(selection[0], 1);
							$(this.element).val(valueArray.join(""));
							fn_SetCaretPosition(element.id, selection[0]);
						} else {
							$(this.element).val(valueArray.join(""));
							fn_SetCaretPosition(element.id, selection[0] + 1);
						}
					} else {
						if (fn_GetValueFromArray(valueArray, selection[0] - 1, selection[0] - 1) === "/") {
							fn_SetPreventDefault();
							valueArray.splice(selection[0], 1);
							$(this.element).val(valueArray.join(""));
							fn_SetCaretPosition(element.id, selection[0]);
						}
					}
				} else if (numOfSlashes >= 3 || canProceed == false) {
					fn_SetPreventDefault();
				}
			}
			else {
				fn_SetPreventDefault();
			}
		}
	});
	kendo.ui.plugin(FinysDatePicker);
})(kendo.ui.DatePicker.fn);

(function (maskedTextBoxFN) {
	var FinysMaskedTextBox = kendo.ui.MaskedTextBox.extend({
		init: function (element, options) {
			var that = this;
			var mask = $(element).data("mask");
			if (typeof mask != 'undefined') {
				options.mask = mask.toString();
			}
			maskedTextBoxFN.init.call(this, element, options);

			$(element).on('focus', function (e) {
				that._finysOnFocus(e);
			});
			$(element).on('focusout', function (e) {
				that._finysOnFocusOut(e);
			});
		},
		options: {
			dualMasks: true
		},
		_finysOldValue: null,
		value: function (value) {
			if (value === undefined) {
				if (this.options.unmaskOnPost) {
					return this.raw();
				}
				return maskedTextBoxFN.value.call(this);
			}

			if (value != null) {
				var that = this;
				var maskType = that._getMaskType();
				var dualMasks = that.options.dualMasks;
				if (maskType != null && dualMasks === true) {
					if (maskType.indexOf('Zip') > -1) {
						if (value.length <= 5) {
							$.extend(that.options, { mask: '00000' });
							that._tokenize();
						} else {
							$.extend(that.options, { mask: '00000-0000' });
							that._tokenize();
						}
					} else if (maskType.indexOf('Phone') > -1) {
						if (value.length <= 10) {
							$.extend(that.options, { mask: '(000) 000-0000' });
							that._tokenize();
						} else {
							$.extend(that.options, { mask: '(000) 000-0000 x0000' });
							that._tokenize();
						}
					}
				}
			}

			maskedTextBoxFN.value.call(this, value);
		},
		_getMaskType: function () {
			var currentMask = this.options.mask;
			if (currentMask === "00000") {
				return "Zip5";
			} else if (currentMask === "00000-0000") {
				return "Zip9";
			} else if (currentMask === "(000) 000-0000") {
				return "Phone";
			} else if (currentMask === "(000) 000-0000 x0000") {
				return "PhoneExt";
			}

			return null;
		},
		_finysOnFocus: function (e) {
			var that = this;
			var maskType = that._getMaskType();
			var rawValue = that.raw();
			var dualMasks = that.options.dualMasks;

			if (maskType != null && dualMasks === true) {
				if (maskType.indexOf("Zip") > -1) {
					$.extend(that.options, { mask: '00000-0000' });
					that._tokenize();
				} else if (maskType.indexOf("Phone") > -1) {
					$.extend(that.options, { mask: '(000) 000-0000 x0000' });
					that._tokenize();
				}
			}

			// Always reapply mask - this fixes an issue with non-finys masks
			that.element.val(that._emptyMask);
			that._mask(0, that._maskLength, rawValue);
		},
		_finysOnFocusOut: function () {
			var that = this;
			var maskType = that._getMaskType();
			var rawValue = that.raw();
			var dualMasks = that.options.dualMasks;

			if (maskType != null && dualMasks === true) {
				var updated = false;
				if (maskType.indexOf("Zip") > -1 && rawValue.length <= 5) {
					$.extend(that.options, { mask: '00000' });
					updated = true;
				} else if (maskType.indexOf("Phone") > -1 && rawValue.length <= 10) {
					$.extend(that.options, { mask: '(000) 000-0000' });
					updated = true;
				}

				if (updated && rawValue != '') {
					that._tokenize();
					that.element.val(that._emptyMask);
					that._mask(0, that._maskLength, rawValue);
					that._togglePrompt(false);
				}
			}
		}
	});
	kendo.ui.plugin(FinysMaskedTextBox);
})(kendo.ui.MaskedTextBox.fn);

(function (numericTextBoxFN) {
	var FinysNumericTextBox = kendo.ui.NumericTextBox.extend({
		init: function (element, options) {
			var that = this;
			var format = $(element).data("format");
			if (typeof format != 'undefined') {
				options.format = format.toString();
			}
			numericTextBoxFN.init.call(this, element, options);
		}
	});
	kendo.ui.plugin(FinysNumericTextBox);
})(kendo.ui.NumericTextBox.fn);

(function (dropDownListFN) {
	var FinysDropDownList = kendo.ui.DropDownList.extend({
		init: function (element, options) {
			var that = this;
			dropDownListFN.init.call(this, element, options);
			this.bind("dataBound", this._defaultDataBound);
		},
		_defaultDataBound: function (e) {
			var defaultValue = $(this.element).data("finysEditable");
			if (typeof defaultValue != "undefined") {
				this.enable(defaultValue);
			}
		}
	});
	kendo.ui.plugin(FinysDropDownList);
})(kendo.ui.DropDownList.fn);

function fn_SetDatePickerOptions(element, format, parseFormats) {
	var datePicker = element.data("kendoDatePicker");

	if (typeof parseFormats === 'undefined') {
		parseFormats = [format];
	}

	datePicker.setOptions({
		format: format,
		parseFormats: parseFormats
	});
}

function fn_GetValueFromArray(array, startIndex, endIndex) {
	if (startIndex < 0 || endIndex < 0 || startIndex > array.length || endIndex > array.length) {
		return "";
	}
	var newArray = []
	$.each(array, function (idx, item) {
		if (idx >= startIndex && idx <= endIndex) {
			newArray.push(item);
		}
	});
	return newArray.join("");
}

function fn_SetCaretPosition(elemId, caretPos) {
	var elem = document.getElementById(elemId);

	if (elem != null) {
		if (elem.createTextRange) {
			var range = elem.createTextRange();
			range.move('character', caretPos);
			range.select();
		} else {
			if (elem.selectionStart) {
				elem.focus();
				elem.setSelectionRange(caretPos, caretPos);
			} else
				elem.focus();
		}
	}
}

function fn_SetPreventDefault() {
	if (event.preventDefault) {
		event.preventDefault();
	} else {
		event.returnValue = false;
	}
}

function UpdateCompanyCSS(newComCode) {
	var searchPattern = "type=CSS";

	$('link[rel="stylesheet"]').each(function () {
		if (this.href.search(new RegExp("GetCompanyContent", 'i')) > 0 && this.href.search(new RegExp(searchPattern, 'i')) > 0) {
			var searchIndex = this.href.indexOf(searchPattern);
			var url = this.href.substring(0, searchIndex);
			this.href = url + "type=CSS&comCode=" + newComCode;
		}
	});
}
function UpdateCompanyImage(newComCode) {
	var searchPattern = "type=IMAGE";

	$('img').each(function () {
		if (this.src.search(new RegExp("GetCompanyContent", 'i')) > 0 && this.src.search(new RegExp(searchPattern, 'i')) > 0) {
			var searchIndex = this.src.indexOf(searchPattern);
			var url = this.src.substring(0, searchIndex);
			this.src = url + "type=IMAGE&comCode=" + newComCode;
		}
	});
}

$.extend({
	findFirst: function (elems, validateCb) {
		var i;
		for (i = 0; i < elems.length; ++i) {
			if (validateCb(elems[i], i))
				return elems[i];
		}
		return undefined;
	}
});

if (!String.format) {
	String.format = function (format) {
		var args = Array.prototype.slice.call(arguments, 1);
		return format.replace(/{(\d+)}/g, function (match, number) {
			return typeof args[number] != 'undefined' ? args[number] : match;
		});
	};
}


window.addEventListener("TODO LATER error", (event) => {
	const e = event.error || event;
	if (!e.message)
		return;
	finysAjax({
		actionType: 'POST',
		actionUrl: '/JsException',
		contentType: 'application/json',
		data: JSON.stringify({
			stack: e.stack || e.message,
			message: e.message,
		})
	})
});