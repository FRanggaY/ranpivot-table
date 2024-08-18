import React, { useEffect, useState } from 'react';

const RanPivotTable = ({ 
    data, 
    rowFields, 
    columnFields, 
    valueField, 
    aggregationFunction = 'sum', 
    heatmapOptions = {} 
}) => {
    const [columnGroups, setColumnGroups] = useState([]);
    const [rowHeaders, setRowHeaders] = useState([]);
    const [dataMatrix, setDataMatrix] = useState({});

    const generateKey = (fields, item) => {
        return fields.map(field => item[field]).join(' | ');
    };

    useEffect(() => {
        const processData = () => {
            let columnGroups = {};
            let rowHeaders = new Set();
            let dataMatrix = {};

            data.forEach((item) => {
                const rowKey = generateKey(rowFields, item);
                const columnKey = generateKey(columnFields, item);

                if (!columnGroups[columnKey]) {
                    columnGroups[columnKey] = { key: columnKey, items: [] };
                }
                columnGroups[columnKey].items.push(item);

                rowHeaders.add(rowKey);
                dataMatrix[rowKey] = dataMatrix[rowKey] || {};
                if (!dataMatrix[rowKey][columnKey]) {
                    dataMatrix[rowKey][columnKey] = [];
                }
                dataMatrix[rowKey][columnKey].push(item[valueField]);
            });

            for (let rowKey in dataMatrix) {
                for (let columnKey in dataMatrix[rowKey]) {
                    dataMatrix[rowKey][columnKey] = aggregate(dataMatrix[rowKey][columnKey]);
                }
            }

            setColumnGroups(Object.values(columnGroups).sort((a, b) => a.key.localeCompare(b.key)));
            setRowHeaders(Array.from(rowHeaders).sort());
            setDataMatrix(dataMatrix);
        };

        const aggregate = (values) => {
            switch (aggregationFunction) {
                case 'sum':
                    return values.reduce((a, b) => a + b, 0);
                case 'count':
                    return values.length;
                case 'countUnique':
                    return new Set(values).size;
                case 'average':
                    return values.reduce((a, b) => a + b, 0) / values.length;
                case 'median': {
                    values.sort((a, b) => a - b);
                    const mid = Math.floor(values.length / 2);
                    return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
                }
                default:
                    return values.reduce((a, b) => a + b, 0);
            }
        };

        processData();
    }, [data, rowFields, columnFields, valueField, aggregationFunction]);

    const getMinMaxValues = () => {
        let min = Infinity, max = -Infinity;
        for (let rowKey in dataMatrix) {
            for (let columnKey in dataMatrix[rowKey]) {
                const value = dataMatrix[rowKey][columnKey];
                if (value < min) min = value;
                if (value > max) max = value;
            }
        }
        return { min, max };
    };

    const getHeatmapColor = (value, min, max) => {
        const intensity = (value - min) / (max - min);
        const red = 255;
        const greenBlue = Math.round(255 * (1 - intensity));
        return `rgb(${red}, ${greenBlue}, ${greenBlue})`; // Ranges from white to red
    };

    const renderColumnHeaders = () => {
        const colLevels = columnFields.length;
        const headers = [];

        for (let i = 0; i < colLevels; i++) {
            const cols = [];
            rowFields.forEach((field, index) => {
                cols.push(<th key={`${field}-${i}`}>{index === 0 ? columnFields[i] : ''}</th>);
            });

            let previousColHeader = null;
            let colspan = 0;

            columnGroups.forEach((group, index) => {
                const colHeader = group.key.split(' | ')[i] || '';
                if (colHeader === previousColHeader) {
                    colspan++;
                } else {
                    if (colspan > 0) {
                        cols.push(<th key={`${previousColHeader}-${i}-${index}`} colSpan={colspan}>{previousColHeader}</th>);
                    }
                    previousColHeader = colHeader;
                    colspan = 1;
                }
                if (index === columnGroups.length - 1 && colspan > 0) {
                    cols.push(<th key={`${colHeader}-${i}-${index}`} colSpan={colspan}>{colHeader}</th>);
                }
            });
            headers.push(<tr key={`header-${i}`}>{cols}</tr>);
        }

        return headers;
    };

    const renderRowHeaders = () => (
        <tr>
            {rowFields.map((field, index) => (
                <th key={`row-header-${field}`}>{field}</th>
            ))}
        </tr>
    );

    const renderRowCells = (rowKey, rowIndex) => {
        return rowKey.split(' | ').map((key, index) => {
            if (rowIndex === 0 || key !== rowHeaders[rowIndex - 1].split(' | ')[index]) {
                let rowspan = 1;
                while (rowIndex + rowspan < rowHeaders.length && key === rowHeaders[rowIndex + rowspan].split(' | ')[index]) {
                    rowspan++;
                }
                return (
                    <td key={`row-cell-${rowIndex}-${index}`} rowSpan={rowspan}>{key}</td>
                );
            }
            return null;
        }).filter(cell => cell !== null);
    };

    const renderDataCells = (rowKey, colIndex, group) => {
        const value = dataMatrix[rowKey][group.key] || 0;
        const { min, max } = getMinMaxValues();

        let backgroundColor = 'inherit';
        if (heatmapOptions.enableHeatmap) {
            backgroundColor = getHeatmapColor(value, min, max);
        } else if (heatmapOptions.enableRowHeatmap) {
            const rowValues = Object.values(dataMatrix[rowKey]);
            const rowMin = Math.min(...rowValues);
            const rowMax = Math.max(...rowValues);
            backgroundColor = getHeatmapColor(value, rowMin, rowMax);
        } else if (heatmapOptions.enableColHeatmap) {
            const colValues = rowHeaders.map(rKey => dataMatrix[rKey][group.key] || 0);
            const colMin = Math.min(...colValues);
            const colMax = Math.max(...colValues);
            backgroundColor = getHeatmapColor(value, colMin, colMax);
        }

        return <td key={`data-${rowKey}-${colIndex}`} style={{ backgroundColor }}>{value}</td>;
    };

    return (
        <table border="1">
            <thead>
                {renderColumnHeaders()}
                {renderRowHeaders()}
            </thead>
            <tbody>
                {rowHeaders.map((rowKey, rowIndex) => (
                    <tr key={`row-${String(rowIndex)}`}>
                        {renderRowCells(rowKey, rowIndex)}
                        {columnGroups.map((group, colIndex) => renderDataCells(rowKey, colIndex, group))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default RanPivotTable;
