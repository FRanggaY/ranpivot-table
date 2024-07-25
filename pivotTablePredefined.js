(function (global) {
    class PivotTable {
        constructor(data, config) {
            this.data = data;
            this.rowFields = config.rowFields;
            this.columnFields = config.columnFields;
            this.valueField = config.valueField;
            this.columns = new Set();
        }

        groupData() {
            const grouped = {};
            this.data.forEach(item => {
                let rowKey = this.rowFields.map(field => item[field]).join(' | ');
                let columnKey = this.columnFields.map(field => item[field]).join(' | ');
                this.columns.add(columnKey);
                if (!grouped[rowKey]) {
                    grouped[rowKey] = {};
                }
                if (!grouped[rowKey][columnKey]) {
                    grouped[rowKey][columnKey] = [];
                }
                grouped[rowKey][columnKey].push(item[this.valueField]);
            });
            return grouped;
        }

        calculateSum(values) {
            return values ? values.reduce((sum, current) => sum + current, 0) : 0;
        }

        renderTable() {
            const groupedData = this.groupData();
            let columns = Array.from(this.columns);
            let html = '<table border="1"><thead><tr>';

            // Header
            html += `<th>${this.rowFields.join(' | ')}</th>`;
            columns.forEach(column => {
                html += `<th>${column}</th>`;
            });
            html += '</tr></thead><tbody>';

            // Rows
            for (const rowKey in groupedData) {
                html += `<tr><td>${rowKey}</td>`;
                columns.forEach(column => {
                    let sum = this.calculateSum(groupedData[rowKey][column]);
                    html += `<td>${sum}</td>`;
                });
                html += '</tr>';
            }
            html += '</tbody></table>';
            return html;
        }
    }



    global.PivotTable = PivotTable;
})(window);
