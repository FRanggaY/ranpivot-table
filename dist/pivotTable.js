class RanPivotTable {
    /**
     * Creates an instance of RanPivotTable.
     * @param {Array<Object>} data - The data to be processed.
     * @param {Array<string>} rowFields - The fields to be used for rows.
     * @param {Array<string>} columnFields - The fields to be used for columns.
     * @param {string} valueField - The field to be aggregated.
     * @param {string} [aggregationFunction='sum'] - The aggregation function to be used ('sum', 'count', 'countUnique', 'average', 'median').
     * @param {Object} [heatmapOptions] - Optional heatmap settings.
     * @param {boolean} [heatmapOptions.enableHeatmap=false] - Enable overall heatmap.
     * @param {boolean} [heatmapOptions.enableRowHeatmap=false] - Enable row-based heatmap.
     * @param {boolean} [heatmapOptions.enableColHeatmap=false] - Enable column-based heatmap.
     * @param {boolean} [heatmapOptions.showLegend=false] - Show the color legend for the heatmap.
     */
    constructor(data, rowFields, columnFields, valueField, aggregationFunction = 'sum', heatmapOptions = {}) {
        this.data = data;
        this.rowFields = rowFields;
        this.columnFields = columnFields;
        this.valueField = valueField;
        this.aggregationFunction = aggregationFunction;

        // Heatmap settings
        this.heatmapOptions = {
            enableHeatmap: heatmapOptions.enableHeatmap || false,
            enableRowHeatmap: heatmapOptions.enableRowHeatmap || false,
            enableColHeatmap: heatmapOptions.enableColHeatmap || false,
            showLegend: heatmapOptions.showLegend || false
        };
    }

    /**
     * Renders the pivot table.
     * @returns {string} The HTML string of the rendered pivot table.
     */
    render() {
        const { columnGroups, rowHeaders, dataMatrix } = this.processData();
        let html = this.buildHtml(columnGroups, rowHeaders, dataMatrix);
        
        // If showLegend is enabled, append the legend to the HTML
        if (this.heatmapOptions.showLegend) {
            const { min, max } = this.getMinMaxValues(dataMatrix);
            html += this.buildLegend(min, max);
        }

        return html;
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

        // Calculate min and max values for heatmap
        const { min, max } = this.getMinMaxValues(dataMatrix);

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
                const color = this.getHeatmapColor(value, min, max, rowKey, group.key, dataMatrix);
                html += `<td style="background-color: ${color};">${value}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        return html;
    }

    getMinMaxValues(dataMatrix) {
        let min = Infinity, max = -Infinity;

        for (let rowKey in dataMatrix) {
            for (let columnKey in dataMatrix[rowKey]) {
                const value = dataMatrix[rowKey][columnKey];
                if (value < min) min = value;
                if (value > max) max = value;
            }
        }

        return { min, max };
    }

    getHeatmapColor(value, min, max, rowKey, columnKey, dataMatrix) {
        const intensity = (value - min) / (max - min);
        const heatmapBaseColor = [255, 0, 0]; // Red color
        const whiteColor = [255, 255, 255];

        const interpolateColor = (startColor, endColor, factor) => {
            return startColor.map((color, i) => Math.min(255, Math.max(0, Math.round(color + factor * (endColor[i] - color)))));
        };

        const calculateColor = (factor) => {
            return interpolateColor(whiteColor, heatmapBaseColor, factor);
        };

        let color;

        if (this.heatmapOptions.enableHeatmap) {
            color = `rgb(${calculateColor(intensity).join(',')})`;
        } else if (this.heatmapOptions.enableRowHeatmap) {
            const rowMax = Math.max(...Object.values(dataMatrix[rowKey]));
            const rowIntensity = value / rowMax;
            color = `rgb(${calculateColor(rowIntensity).join(',')})`;
        } else if (this.heatmapOptions.enableColHeatmap) {
            const colValues = Object.values(dataMatrix).map(row => row[columnKey] || 0);
            const colMax = Math.max(...colValues);
            const colIntensity = value / colMax;
            color = `rgb(${calculateColor(colIntensity).join(',')})`;
        } else {
            color = `rgb(${calculateColor(intensity).join(',')})`;
        }

        return color;
    }

    buildLegend(min, max) {
        const gradientColors = [];
        const steps = 10; // Number of gradient steps
        const stepValue = (max - min) / steps;

        for (let i = 0; i < steps; i++) {
            const startValue = min + stepValue * i;
            const endValue = min + stepValue * (i + 1);
            const color = this.getHeatmapColor(startValue, min, max, null, null, null);
            gradientColors.push({ color, range: `${startValue.toFixed(2)} - ${endValue.toFixed(2)}` });
        }

        let legendHtml = '<div style="display: flex; align-items: center; margin-top: 10px;">';
        legendHtml += '<div style="margin-right: 10px;">Legend:</div>';
        
        gradientColors.forEach((entry) => {
            legendHtml += `
                <div style="display: flex; align-items: center; margin-right: 15px;">
                    <div style="width: 20px; height: 20px; background-color: ${entry.color}; margin-right: 5px;"></div>
                    <div>${entry.range}</div>
                </div>`;
        });

        legendHtml += '</div>';
        
        return legendHtml;
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
