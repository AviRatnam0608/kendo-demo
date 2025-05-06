// finys namespace
var finys = window.finys ||= {};

{
    // spreadsheet namespace
    const spreadsheet = finys.spreadsheet = finys.spreadsheet || {};

    spreadsheet.DataType = {
        INTEGER: 1,
        DECIMAL: 2,
        MONEY: 3,
        DATE: 4,
        BOOLEAN: 5,
        STRING: 6,
        LIST: 7
    };

    spreadsheet.WorkBook = function (e) {
        this.Sheets = [];
        this.Toolbar = e.Toolbar;
        this.Columns = e.Columns;
        this.Rows = e.Rows;
        this.Parent = e.Parent || null;
        this.Spreadsheet = null;
        this.Waiting = [];

        for (let i = 0; e.Sheets && i < e.Sheets.length; i++) {
            const cur = e.Sheets[i];
            if (!(cur instanceof spreadsheet.Worksheet))
                cur = new spreadsheet.Worksheet(cur);
            cur.Parent = this;
            this.Sheets.push(cur);
        }
    };

    spreadsheet.WorkBook.prototype.validate = function (dateInISO) {
        const active = this.getActiveSheet().Name;

        this.wait("validating");

        this.refresh(dateInISO);

        let result = true;
        for (let i = 0; i < this.Sheets.length; i++)
            if (!this.Sheets[i].validate())
                result = false;

        this.selectSheet(active);

        this.complete("validating");
        return result;
    };

    spreadsheet.WorkBook.prototype.create = function () {
        if (!this.Spreadsheet)
            return;

        this.Spreadsheet.unbind('renameSheet');

        for (let i = 0; i < this.Sheets.length; i++)
            this.Sheets[i].create();

        // remove default sheet created by kendo
        this.Spreadsheet.removeSheet(this.Spreadsheet.activeSheet());

        if (this.Sheets.length > 0)
            // validate only current sheet for performance and lazy validate when user switch to any sheet
            this.Spreadsheet.trigger('selectSheet');

        this.Spreadsheet.bind('renameSheet', function (e) { e.preventDefault() });
    };

    spreadsheet.WorkBook.prototype.build = function (element) {
        const $e = $(element),
            w = this,
            c = function () { w.onChange.apply(w, arguments) };

        if (this.Spreadsheet) {
            this.Spreadsheet.destroy();
            $e.html("");
            this.Spreadsheet = null;
        }

        this.Spreadsheet = $e.kendoSpreadsheet(
            {
                toolbar: this.Toolbar,
                columns: this.Columns,
                rows: this.Rows,
                change: c
            })
            .data('kendoSpreadsheet');

        this.create();
    };

    spreadsheet.WorkBook.prototype.tryChangePageSize = function (value, dateInISO) {
        if (!this.Spreadsheet
            || this.Rows == value)
            return false;

        let u = true;

        for (let i = 0; i < this.Sheets.length; i++) {
            const sheet = this.Sheets[i];
            // Refresh data in sheet by re-loading data from the data source into the raw sheet data
            sheet.importData(dateInISO);
            if (sheet < sheet.Data.length)
                u = false;
        }

        if (u)
            // Update page size
            this.Rows = value;

        this.rebuild();
        return u;
    };

    spreadsheet.WorkBook.prototype.clear = function () {
        for (let i = 0; i < this.Sheets.length; i++)
            this.Sheets[i].Data = [];

        this.rebuild();
    };

    spreadsheet.WorkBook.prototype.refresh = function (dateInISO) {
        for (let i = 0; i < this.Sheets.length; i++)
            this.Sheets[i].importData(dateInISO);

        this.rebuild();
    };

    spreadsheet.WorkBook.prototype.rebuild = function () {
        if (!this.Spreadsheet)
            return;

        const active = this.getActiveSheet().Name;

        this.build(this.Spreadsheet.element);
        this.selectSheet(active);
    };

    spreadsheet.WorkBook.prototype.getSheet = function (name) {
        for (let i = 0; i < this.Sheets.length; i++) {
            const sheet = this.Sheets[i];
            if (sheet.Name == name)
                return sheet;
        }
        return null;
    };

    spreadsheet.WorkBook.prototype.onChange = function (e) {
        if (this.isWaiting())
            return;

        const sheet = this.getSheet(e.range.sheet().name());
        if (sheet)
            sheet.onChange(e);
    };

    spreadsheet.WorkBook.prototype.getActiveSheet = function () {
        if (!this.Spreadsheet)
            return null;

        const activeSheet = this.Spreadsheet.activeSheet();

        return this.getSheet(activeSheet.name());
    };

    spreadsheet.WorkBook.prototype.selectSheet = function (name) {
        if (!this.Spreadsheet)
            return;

        const activeSheet = this.Spreadsheet.activeSheet();

        if (activeSheet.name() == name)
            return;

        this.getSheet(name)
            .select();
    };

    spreadsheet.WorkBook.prototype.getData = function (dateInISO) {
        const result = [];

        for (let s = 0; s < this.Sheets.length; s++) {
            const sheet = this.Sheets[s],
                data = sheet.getData(dateInISO);

            for (let i = 0; i < data.length; i++)
                result.push(data[i]);
        }
        return result;
    };

    spreadsheet.WorkBook.prototype.wait = function (task) {
        this.Waiting.push(task);
    };

    spreadsheet.WorkBook.prototype.complete = function (task) {
        const index = this.Waiting.indexOf(task);
        this.Waiting.splice(index, 1);
    };

    spreadsheet.WorkBook.prototype.isWaiting = function () {
        return this.Waiting.length > 0;
    };


    spreadsheet.Worksheet = function (e) {
        this.Name = e.Name || null;
        this.Schema = [];
        this.Data = e.Data || [];
        this.Visited = e.Visited || null;
        this.Parent = e.Parent || null;
        this.LockedRows = e.LockedRows || [];
        this.Waiting = [];

        for (let i = 0; e.Schema && i < e.Schema.length; i++) {
            const cur = e.Schema[i];
            if (!(cur instanceof spreadsheet.ColumnProperties))
                cur = new spreadsheet.ColumnProperties(cur);
            cur.Parent = this;
            this.Schema.push(cur);
        }
    };

    spreadsheet.Worksheet.prototype.sanitizeAll = function () {
        const kendoSheet = this.getKendoSheet(),
            data = kendoSheet.dataSource.data();

        for (let i = 0; i < data.length; i++)
            this.sanitize(data[i]);
    }

    spreadsheet.Worksheet.prototype.sanitize = function (row) {
        for (let i = 0; i < this.Schema.length; i++)
            this.Schema[i].sanitize(row);
    }

    spreadsheet.Worksheet.prototype.clear = function () {
        this.Data = [];

        for (let i = 0; i < this.Parent.Sheets.length; i++) {
            const sheet = this.Parent.Sheets[i];
            if (this.Name != sheet.Name)
                sheet.importData(false);
        }

        this.Parent.rebuild();
    };

    spreadsheet.Worksheet.prototype.select = function () {
        if (!this.Parent.Spreadsheet)
            return;

        this.Parent.Spreadsheet.activeSheet(this.getKendoSheet());
    };

    spreadsheet.Worksheet.prototype.wait = function (task) {
        this.Waiting.push(task);
    };

    spreadsheet.Worksheet.prototype.complete = function (task) {
        const index = this.Waiting.indexOf(task);
        this.Waiting.splice(index, 1);
    };

    spreadsheet.Worksheet.prototype.isWaiting = function () {
        return this.Parent.isWaiting()
            || this.Waiting.length > 0;
    };

    spreadsheet.Worksheet.prototype.formatColumns = function (startRow, endRow) {
        if (endRow < 1
            || endRow < startRow)
            return;

        for (let i = 0; i < this.Schema.length; i++)
            this.Schema[i].format(startRow, endRow);
    };

    spreadsheet.Worksheet.prototype.validate = function (startRow, endRow) {
        this.select();

        if (startRow === undefined)
            startRow = 2;
        if (endRow === undefined)
            endRow = this.getKendoSheet()
                .dataSource
                .data()
                .length + 1;

        let result = true;

        if (endRow < startRow)
            return result;

        this.wait("validating-sheet");

        for (let i = 0; i < this.Schema.length; i++)
            if (!this.Schema[i].validate(startRow, endRow))
                result = false;

        this.complete("validating-sheet");
        return result;
    };

    spreadsheet.Worksheet.prototype.getKendoSheet = function () {
        const sheets = this.Parent.Spreadsheet.sheets();

        for (let i = 0; i < sheets.length; i++) {
            const sheet = sheets[i];
            if (sheet.name() == this.Name)
                return sheet;
        }
        return null;
    };

    spreadsheet.Worksheet.prototype.importData = function (dateInISO) {
        const kendoSheet = this.getKendoSheet();
        this.Data = this.convertData(kendoSheet.dataSource.data(), dateInISO);
    };

    spreadsheet.Worksheet.prototype.getData = function (dateInISO) {
        this.importData(dateInISO);
        return this.Data;
    };

    spreadsheet.Worksheet.prototype.convertData = function (data, dateInISO) {
        const key = this.getPrimaryKey(),
            result = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i],
                newRow = {};

            if (!row[key.Name]
                || this.isEmpty(row))
                continue;

            for (let c = 0; c < this.Schema.length; c++) {
                const col = this.Schema[c];

                newRow[col.Name] = col.parse(row, dateInISO);
            }
            result.push(newRow);
        }
        return result;
    };

    spreadsheet.Worksheet.prototype.getModel = function () {
        const fields = {};

        for (let i = 0; i < this.Schema.length; i++) {
            const column = this.Schema[i];

            if (!column) continue;

            fields[column.Name] = column.toModel();
        }

        return fields;
    };

    spreadsheet.Worksheet.prototype.create = function () {
        if (!this.Parent.Spreadsheet)
            return;

        const result = this.Parent.Spreadsheet.insertSheet({
            columns: this.Schema.length,
            rows: this.Parent.Spreadsheet.options.rows,
            dataSource: new kendo.data.DataSource({
                data: [{}],
                schema: {
                    model: {
                        fields: this.getModel()
                    }
                }
            })
        });
        this.Parent.Spreadsheet.renameSheet(result, this.Name);
        this.init();
        return result;
    };

    spreadsheet.Worksheet.prototype.init = function () {
        const kendoSheet = this.getKendoSheet();

        this.wait("initializing");

        // Assign datasource
        kendoSheet.dataSource.data(this.Data);

        for (let i = 0; i < this.Schema.length; i++)
            kendoSheet.columnWidth(i, this.Schema[i].Width || 100);

        this.Visited = true;

        // Set header styles
        this.formatRows();

        // Validate and format the data
        this.formatColumns(2, this.Parent.Spreadsheet.options.rows);

        this.complete("initializing");
    };

    spreadsheet.Worksheet.prototype.formatRows = function () {
        const maxCol = this.Schema[this.Schema.length - 1].Range || 'A',
            kendoSheet = this.getKendoSheet();

        kendoSheet.range(`A1:${maxCol}1`)
            .background('grey')
            .color('white')
            .textAlign('center');
        kendoSheet.frozenRows(1);
        kendoSheet.range(`A1:${maxCol}X`)
            .enable(false);

        kendoSheet.range(`A2:${maxCol}X`)
            .enable(true);

        // Disable locked rows
        for (let i = 0; i < this.LockedRows.length; i++) {
            const cur = this.LockedRows[i];
            const curPlusOne = cur + 1;
            kendoSheet.range(`A${curPlusOne}:${maxCol}${curPlusOne}`)
                .color('blue')
                .enable(false);
        }

        // Always disable Id columns
        const keyCol = this.Schema[0];
        if (keyCol && keyCol.isPrimaryKey()) {
            kendoSheet.range(`A1:A${this.Parent.Spreadsheet.options.rows}`)
                .background('grey')
                .textAlign('left')
                .color('white')
                .enable(false);
        }
    };

    spreadsheet.Worksheet.prototype.getPrimaryKey = function () {
        for (let i = 0; i < this.Schema.length; i++) {
            const cur = this.Schema[i];
            if (cur.isPrimaryKey())
                return cur;
        }
        return null;
    }

    spreadsheet.Worksheet.prototype.getDataRow = function (id) {
        const kendoSheet = this.getKendoSheet(),
            data = kendoSheet.dataSource.data(),
            key = this.getPrimaryKey();

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (row[key.Name] == id)
                return row;
        }
        return null;
    }

    spreadsheet.Worksheet.prototype.getEmptyRows = function () {
        const kendoSheet = this.getKendoSheet(),
            data = kendoSheet.dataSource.data(),
            key = this.getPrimaryKey(),
            result = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (this.isEmpty(row))
                result.push(row[key.Name]);
        }

        return result;
    }

    spreadsheet.Worksheet.prototype.isEmpty = function (row) {
        for (let i = 0; i < this.Schema.length; i++) {
            const col = this.Schema[i];

            if (col.isPrimaryKey())
                continue;

            if (!col.isEmpty(row))
                return false;
        }
        return true;
    }

    spreadsheet.Worksheet.prototype.onChange = function (e) {
        if (this.isWaiting())
            return;

        this.wait("change");

        const kendoSheet = this.getKendoSheet(),
            key = this.getPrimaryKey(),
            items = kendoSheet.dataSource.data(),
            topPosition = e.range._ref.topLeft,
            bottomPosition = e.range._ref.bottomRight,
            startRow = Math.max(1, Math.min(topPosition.row, items.length)),
            endRow = bottomPosition.row;

        let maxId = items.reduce(
            function (prev, current) {
                return current[key.Name] > prev ? current[key.Name] : prev
            }, 0);

        // update id so that we know which rows are actualy updated and which rows are null
        for (let i = startRow; i <= endRow; i++) {
            const range = kendoSheet.range(`A${i + 1}:A${i + 1}`),
                value = range.values()[0][0];

            if (!value) {
                const id = ++maxId;

                range.value(id);
                this.onGenerateRow(this.getDataRow(id));
            }
        }

        e.range.clearFormat();

        for (let i = topPosition.col; i <= bottomPosition.col; i++)
            this.Schema[i]
                .format(startRow + 1, endRow + 1);

        this.complete("change");
    };

    spreadsheet.Worksheet.prototype.onGenerateRow = function (row) {
        for (let i = 0; i < this.Schema.length; i++)
            this.Schema[i].onGenerateRow(row);
    };


    spreadsheet.ColumnProperties = function (e) {
        this.Name = e.Name || null;
        this.Range = e.Range || null;
        this.Type = e.Type || spreadsheet.DataType.STRING;
        this.Width = e.Width || null;
        this.Required = e.Required || null;
        this.Values = e.Values || null;
        this.Parent = e.Parent || null;
        this.DependentColumns = e.DependentColumns || [];

        if (this.Required === null)
            this.Required = false;
    };

    spreadsheet.ColumnProperties.prototype.isPrimaryKey = function () {
        return this.Name
            && this.Name.toLowerCase() === "id";
    };

    spreadsheet.ColumnProperties.prototype.getValidationData = function () {
        switch (this.Type) {
            case spreadsheet.DataType.BOOLEAN:
                return {
                    validation: {
                        dataType: 'list',
                        showButton: true,
                        comparerType: 'list',
                        from: '{ true, false }',
                        allowNulls: !this.Required,
                        type: 'reject',
                        messageTemplate: 'Valid values are true and false',
                    },
                    format: null,
                    editor: null
                };
            case spreadsheet.DataType.DATE:
                return {
                    validation: {
                        from: 'DATEVALUE("1/1/1900")',
                        to: 'DATEVALUE("1/1/2100")',
                        comparerType: 'between',
                        dataType: 'date',
                        type: 'reject',
                        showButton: true,
                        allowNulls: !this.Required,
                        messageTemplate: 'Date is not valid',
                    },
                    format: 'mm/dd/yyyy',
                    editor: null
                };
            case spreadsheet.DataType.MONEY:
                return {
                    validation: {
                        from: '-2147483648',
                        to: '2147483647',
                        comparerType: 'between',
                        type: 'reject',
                        dataType: 'number',
                        allowNulls: !this.Required,
                        messageTemplate: 'Money is not valid.',
                    },
                    format: '$#,##0.00',
                    editor: null
                };
            case spreadsheet.DataType.DECIMAL:
                return {
                    validation: {
                        from: '-2147483648',
                        to: '2147483647',
                        comparerType: 'between',
                        type: 'reject',
                        dataType: 'number',
                        allowNulls: !this.Required,
                        messageTemplate: 'Decimal is not valid.',
                    },
                    format: '#,##0.00',
                    editor: null
                };
            case spreadsheet.DataType.INTEGER:
                return {
                    validation: {
                        from: '-2147483648',
                        to: '2147483647',
                        comparerType: 'between',
                        type: 'reject',
                        dataType: 'number',
                        allowNulls: !this.Required,
                        messageTemplate: 'Number is not valid.',
                    },
                    format: null,
                    editor: null
                };
            case spreadsheet.DataType.LIST:
                const result = {
                    validation: {
                        from: null,
                        comparerType: 'list',
                        allowNulls: !this.Required,
                        type: 'reject',
                        dataType: 'list',
                        showButton: true,
                        titleTemplate: 'Invalid',
                        messageTemplate: 'Please select valid value from the dropdown.',
                    },
                    format: null,
                    editor: null
                };
                switch (typeof this.Values) {
                    case 'string':
                        result.validation.from = this.Values;
                        break;
                    case 'function':
                        result.validation.from = JSON.stringify(this.Values())
                            .replace('[', '{')
                            .replace(']', '}');
                        break;
                    default:
                        result.validation.from = JSON.stringify(this.Values)
                            .replace('[', '{')
                            .replace(']', '}');
                        break;
                }
                return result;
            case spreadsheet.DataType.STRING:
                if (!this.Required)
                    return null;
                return {
                    validation: {
                        from: "AND(TRUE)",
                        allowNulls: false,
                        type: 'reject',
                        dataType: 'custom',
                        titleTemplate: 'Invalid',
                        messageTemplate: 'Please enter a value.',
                    },
                    format: null,
                    editor: null
                };
        }

        return null;
    };

    spreadsheet.ColumnProperties.prototype.onGenerateRow = function (row) {
        if (!this.isPrimaryKey())
            row[this.Name] = null;
    };

    spreadsheet.ColumnProperties.prototype.format = function (startRow, endRow) {
        if (endRow < startRow)
            return;

        const data = this.getValidationData(),
            range = this.getRange(startRow, endRow);

        if (data && data.format)
            range.format(data.format);

        if (this.Required)
            range.background("#FFFF99");
    };

    spreadsheet.ColumnProperties.prototype.getRange = function (startRow, endRow) {
        return this.Parent.getKendoSheet()
            .range(`${this.Range}${startRow}:${this.Range}${endRow}`);
    };

    spreadsheet.ColumnProperties.prototype.toModel = function () {
        switch (this.Type) {
            case spreadsheet.DataType.DATE:
                return {
                    type: 'date',
                    required: this.Required,
                    nullable: !this.Required
                };
            case spreadsheet.DataType.BOOLEAN:
                return {
                    type: 'boolean',
                    required: this.Required,
                    nullable: !this.Required
                };
            case spreadsheet.DataType.DECIMAL:
            case spreadsheet.DataType.INTEGER:
            case spreadsheet.DataType.MONEY:
                return {
                    type: 'number',
                    required: this.Required,
                    nullable: !this.Required
                };
            case spreadsheet.DataType.STRING:
            case spreadsheet.DataType.LIST:
                return {
                    type: 'string',
                    required: this.Required,
                    nullable: !this.Required
                };
            default: return {
                type: 'string',
                required: this.Required,
                nullable: !this.Required
            };
        }
    };

    spreadsheet.ColumnProperties.prototype.isEmpty = function (row) {
        const val = row[this.Name];

        if (val === undefined
            || val === null)
            return true;

        switch (this.Type) {
            case spreadsheet.DataType.DATE:
                return val < new Date(1900, 1, 1);
            case spreadsheet.DataType.BOOLEAN:
            case spreadsheet.DataType.STRING:
            case spreadsheet.DataType.LIST:
                return val === '';
        }
        return false;
    };

    spreadsheet.ColumnProperties.prototype.sanitize = function (row) {
        if (this.isEmpty(row))
            row[this.Name] = null;
    }

    spreadsheet.ColumnProperties.prototype.validate = function (startRow, endRow) {
        if (endRow < startRow)
            return true;

        const validation = this.getValidationData();

        if (!validation || !validation.validation)
            return true;

        this.Parent.wait("validating-column");

        const range = this.getRange(startRow, endRow),
            emptyRows = this.Parent.getEmptyRows(),
            kendoSheet = this.Parent.getKendoSheet(),
            data = kendoSheet.dataSource.data();
        let result = true;

        for (let i = 0; i < data.length; i++)
            this.sanitize(data[i]);

        range.validation(validation.validation);
        range.forEachCell(function (row, col, cell) {
            if (emptyRows.includes(row))
                return;
            if (cell.validation.value === false)
                result = false;
        });

        this.Parent.complete("validating-column");
        return result;
    };

    spreadsheet.ColumnProperties.prototype.parse = function (row, dateInISO) {
        const value = row[this.Name];
        switch (this.Type) {
            case spreadsheet.DataType.BOOLEAN:
                return value === 'true'
                    || value === true;
            case spreadsheet.DataType.INTEGER:
            case spreadsheet.DataType.DECIMAL:
            case spreadsheet.DataType.MONEY:
                return value;
            case spreadsheet.DataType.DATE:
                // convert kendo number date to date
                if (value == null)
                    return null;

                if (typeof value === 'number') {
                    const days = parseFloat(value + ''),
                        ms = Math.abs((value - days) * 8.64e7);
                    value = new Date(1899, 11, 30 + days, 0, 0, 0, ms);
                }
                if (value < new Date(1900, 1, 1))
                    return null;
                return dateInISO
                    && value instanceof Date
                    ? value.toISOString().substr(0, 10) + 'T00:00:00Z'
                    : value;
            case spreadsheet.DataType.STRING:
            case spreadsheet.DataType.LIST:
                if (value != null)
                    return value + '';
                break;
        }
        return null;
    };

    spreadsheet.DependentColumns = function (e) {
        this.Range = e.Range || null;
        this.Values = e.Values || null;
    };
}