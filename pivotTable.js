(function (global) {
    class RanPivotTable {
        constructor(data, rowFields, columnFields, valueField) {
            this.data = data;
            this.rowFields = rowFields;
            this.columnFields = columnFields;
            this.valueField = valueField;
        }

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
                dataMatrix[rowKey][columnKey] = (dataMatrix[rowKey][columnKey] || 0) + item[this.valueField];
            });

            return {
                columnGroups: Object.values(columnGroups).sort((a, b) => a.key.localeCompare(b.key)),
                rowHeaders: Array.from(rowHeaders).sort(),
                dataMatrix
            };
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

    global.RanPivotTable = RanPivotTable;
})(window);
