function initializeSmartDocumentation(smartDocumentations, fsdTableName, endpointPath, viewmodel)
{
    function replacePeriods(inputString) {
        let parts = inputString.split('.');
        let result = parts.map((part, index) => {
            if (index < 2) {
                return part + '_';
            } else if (index === 2) { 
                return part + '.';
            } else { 
                return part + '_';
            }
        }).join('');

        result = result.replace(/_$/, '');

        return result;
    }

    function replaceEndpointPathWithTableName(propertyPath, fsdTableName, endpointPath) {
        let modifiedPath = propertyPath.replace(endpointPath, fsdTableName);
        let dotIndex = modifiedPath.indexOf('.', modifiedPath.indexOf('.') + 1);

        if (dotIndex !== -1) {
            modifiedPath = modifiedPath.substring(0, dotIndex) + '_' + modifiedPath.substring(dotIndex + 1).replace(".", "_");
        }


        return modifiedPath;
    }

    const smartDocObj = JSON.parse(smartDocumentations);

    $.each(smartDocObj, function (index, value) {

        let modifiedPropertyPath;
        if (endpointPath == null || fsdTableName == null) {
            modifiedPropertyPath = replacePeriods(value.PropertyPath);
        }
        else {
            modifiedPropertyPath = replaceEndpointPathWithTableName(value.PropertyPath, fsdTableName, endpointPath);
        }

        let control = $(`[data-bind*="value: dc.${modifiedPropertyPath}"], [data-dcbind="value: dc.${modifiedPropertyPath}"]`);
        if (control.length > 0) {

            switch (value.ControlTypeCode) {
                case 'TimePicker':
                    let kendoTimePicker = control.data('kendoTimePicker');

                    function setTime(timeString) {
                        var timeParts = timeString.split(':');
                        var hours = parseInt(timeParts[0], 10);
                        var minutes = parseInt(timeParts[1], 10);

                        var date = new Date();
                        date.setHours(hours, minutes, 0);

                        kendoTimePicker.value(date);
                    }

                    if (value.TimeProperties.ExistingValue != null) {
                        setTime(value.TimeProperties.ExistingValue);
                    }

                    break;
                case 'TextSingleLine':
                    // existing value handled by data-bind
                    let kendoTextBox = control.data("kendoTextBox");
                    break;
                case 'TextMultiLine':
                    // existing value handled by data-bind
                    break;
                case 'Dropdown':
                    let dropdownValues = value.DropdownProperties.Values;
                    let kendoDropdownList = control.data("kendoDropDownList");

                    let newKendoDataSource = dropdownValues.map(function (item) {
                        return {
                            Code: item.Item1,
                            DisplayValue: item.Item2
                        };
                    });

                    kendoDropdownList.setDataSource(newKendoDataSource);

                    kendoDropdownList.value(value.DropdownProperties.ExistingSelectionCode);
                    if (value.Disabled === true) {
                        kendoDropdownList.enable(false);
                    }

                    break;
                case 'MultiselectDropdown':
                    let multiselectDropdownValues = value.DropdownProperties.Values;
                    let kendoMultiselect = control.data("kendoMultiSelect");

                    let newMultiselectKendoDataSource = multiselectDropdownValues.map(function (item) {
                        return {
                            Code: item.Item1,
                            DisplayValue: item.Item2
                        };
                    });

                    kendoMultiselect.setDataSource(newMultiselectKendoDataSource);
                    kendoMultiselect.value(value.DropdownProperties.ExistingSelectionCodes);

                    break;
                case 'CheckboxHierarchy':

                    function buildDataSource(array) {
                        let cheArray = [];
                        $.each(array, function (index, child) {
                            cheArray.push(buildDataSourceNode(child));
                        });
                        return cheArray;
                    }

                    function buildDataSourceNode(item) {
                        var node = {
                            id: item.Id,
                            text: item.DisplayName,
                            expanded: true,
                            checked: item.ExistingValue ?? false,
                            summary: item.DisplaySummary,
                            enabled: !item.Disabled
                        };
                        if (item.Children && item.Children.length > 0) {
                            node.items = buildDataSource(item.Children);
                        }
                        return node;
                    }

                    function setPropByStringPath(obj, propertyPath, value) {
                        const parts = propertyPath.split('.');
                        const last = parts.pop();
                        const target = parts.reduce((acc, part) => {
                            if (!acc[part]) acc[part] = {}; // Create an empty object if it doesn't exist
                            return acc[part];
                        }, obj);
                        target[last] = value;
                    }

                    let kendoTreeView = control.kendoTreeView({
                        checkboxes: {
                            checkParent: false
                        },
                        dataSource: buildDataSource(value.Checkboxes),
                        template: `<div class="f-flex-container" style="display: flex; flex-direction: column;"><span class="k-in">#: item.text #</span></div>`, // Node label only
                        check: function (e) {
                            setPropByStringPath(viewmodel, `dc.${modifiedPropertyPath}`, $(e.sender.element).data('kendoTreeView').value());
                        }
                    }).data('kendoTreeView');

                    kendoTreeView.value = function (valueArray) {
                        if (valueArray === undefined) {
                            var checkedNodes = [];
                            (function checkNodeIds(nodes) {
                                nodes.forEach((node) => {
                                    if (node.checked) {
                                        checkedNodes.push(node.id);
                                    }
                                    if (node.hasChildren) {
                                        checkNodeIds(node.children.view());
                                    }
                                });
                            })(this.dataSource.view());
                            return checkedNodes;
                        } else {
                            (function uncheckAllNodes(nodes) {
                                nodes.forEach((node) => {
                                    node.set("checked", false);
                                    if (node.hasChildren) {
                                        uncheckAllNodes(node.children.view());
                                    }
                                });
                            })(this.dataSource.view());

                            (function checkNodesById(nodes, ids) {
                                nodes.forEach((node) => {
                                    if (ids.includes(node.id)) {
                                        node.set("checked", true);
                                    }
                                    if (node.hasChildren) {
                                        checkNodesById(node.children.view(), ids);
                                    }
                                });
                            })(this.dataSource.view(), valueArray);
                        }
                    };

                    setPropByStringPath(viewmodel, `dc.${modifiedPropertyPath}`, kendoTreeView.value());

                    break;
                default:
                    console.log(`smartdoc js not implemented control type: ${value.ControlTypeCode}`);
            }
        }
    });
}