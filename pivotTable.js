(function (global) {
    class PivotTable {
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
            let html = '<table border="1"><thead><tr>';

            // Build the column headers with multiple levels
            let colLevels = this.columnFields.length;
            for (let i = 0; i < colLevels; i++) {
                html += '<tr>';
                this.rowFields.forEach(() => html += '<th></th>'); // Empty row headers for this row
                columnGroups.forEach(group => {
                    let colHeader = group.key.split(' | ')[i] || '';
                    html += `<th>${colHeader}</th>`;
                });
                html += '</tr>';
            }

            // Build the row header columns
            this.rowFields.forEach(field => {
                html += `<th>${field}</th>`;
            });

            html += '</thead><tbody>';

            // Fill in the data rows
            rowHeaders.forEach(rowKey => {
                html += `<tr>${rowKey.split(' | ').map(key => `<td>${key}</td>`).join('')}`;
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

    global.PivotTable = PivotTable;
})(window);
