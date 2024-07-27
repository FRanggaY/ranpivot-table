class RanPivotTable {
    /**
     * Creates an instance of RanPivotTable.
     * @param {Array<Object>} data - The data to be processed.
     * @param {Array<string>} rowFields - The fields to be used for rows.
     * @param {Array<string>} columnFields - The fields to be used for columns.
     * @param {string} valueField - The field to be aggregated.
     * @param {string} [aggregationFunction='sum'] - The aggregation function to be used ('sum', 'count', 'countUnique', 'average', 'median').
     */
    constructor(data, rowFields, columnFields, valueField, aggregationFunction = 'sum') {
        this.data = data;
        this.rowFields = rowFields;
        this.columnFields = columnFields;
        this.valueField = valueField;
        this.aggregationFunction = aggregationFunction;
    }

    /**
     * Renders the pivot table.
     * @returns {string} The HTML string of the rendered pivot table.
     */
    render() {
        const { columnGroups, rowHeaders, dataMatrix } = this.processData();
        return this.buildHtml(columnGroups, rowHeaders, dataMatrix);
    }

    processData() {
        let columnGroups = {};
        let rowHeaders = new Set();
        let dataMatrix = {};

        // Initialize column groups and data matrix
        this.data.forEach(item => {
            const rowKey = this.rowFields.map(field => item[field]).join(' | ');
            const columnKey = this.columnFields.map(field => item[field]).join(' | ');

            if (!columnGroups[columnKey]) {
                columnGroups[columnKey] = { key: columnKey, items: [] };
            }
            columnGroups[columnKey].items.push(item);

            rowHeaders.add(rowKey);
            dataMatrix[rowKey] = dataMatrix[rowKey] || {};
            if (!dataMatrix[rowKey][columnKey]) {
                dataMatrix[rowKey][columnKey] = [];
            }
            dataMatrix[rowKey][columnKey].push(item[this.valueField]);
        });

        // Apply aggregation function to data matrix
        for (let rowKey in dataMatrix) {
            for (let columnKey in dataMatrix[rowKey]) {
                dataMatrix[rowKey][columnKey] = this.aggregate(dataMatrix[rowKey][columnKey]);
            }
        }

        return {
            columnGroups: Object.values(columnGroups).sort((a, b) => a.key.localeCompare(b.key)),
            rowHeaders: Array.from(rowHeaders).sort(),
            dataMatrix
        };
    }

    aggregate(values) {
        switch (this.aggregationFunction) {
            case 'sum':
                return values.reduce((a, b) => a + b, 0);
            case 'count':
                return values.length;
            case 'countUnique':
                return new Set(values).size;
            case 'average':
                return values.reduce((a, b) => a + b, 0) / values.length;
            case 'median':
                values.sort((a, b) => a - b);
                const mid = Math.floor(values.length / 2);
                return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
            default:
                return values.reduce((a, b) => a + b, 0);
        }
    }

    buildHtml(columnGroups, rowHeaders, dataMatrix) {
        let html = '<table border="1"><thead>';

        // Build the column headers with multiple levels
        let colLevels = this.columnFields.length;
        for (let i = 0; i < colLevels; i++) {
            html += '<tr>';
            this.rowFields.forEach((field, index) => {
                html += `<th>${index === 0 ? this.columnFields[i] : ''}</th>`;
            });
            let previousColHeader = null;
            let colspan = 0;
            columnGroups.forEach((group, index) => {
                let colHeader = group.key.split(' | ')[i] || '';
                if (colHeader === previousColHeader) {
                    colspan++;
                } else {
                    if (colspan > 0) {
                        html += `<th colspan="${colspan}">${previousColHeader}</th>`;
                    }
                    previousColHeader = colHeader;
                    colspan = 1;
                }
                if (index === columnGroups.length - 1 && colspan > 0) {
                    html += `<th colspan="${colspan}">${colHeader}</th>`;
                }
            });
            html += '</tr>';
        }

        // Build the row header columns
        html += '<tr>';
        this.rowFields.forEach(field => {
            html += `<th>${field}</th>`;
        });

        // Fill in the data rows
        rowHeaders.forEach((rowKey, rowIndex) => {
            html += '<tr>';
            rowKey.split(' | ').forEach((key, index) => {
                if (rowIndex === 0 || key !== rowHeaders[rowIndex - 1].split(' | ')[index]) {
                    let rowspan = 1;
                    while (rowIndex + rowspan < rowHeaders.length && key === rowHeaders[rowIndex + rowspan].split(' | ')[index]) {
                        rowspan++;
                    }
                    html += `<td rowspan="${rowspan}">${key}</td>`;
                }
            });
            columnGroups.forEach(group => {
                const value = dataMatrix[rowKey][group.key] || 0;
                html += `<td>${value}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        return html;
    }
}

// For modern JavaScript frameworks and tools that support ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RanPivotTable; // CommonJS
} else if (typeof define === 'function' && define.amd) {
    define([], function () {
        return RanPivotTable; // AMD
    });
} else {
    // For native HTML and global exposure
    if (typeof window !== 'undefined') {
        window.RanPivotTable = RanPivotTable;
    }
}