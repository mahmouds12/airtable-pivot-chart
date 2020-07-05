import {
    initializeBlock,
    useBase,
    useRecords,
    useGlobalConfig,
    TablePickerSynced,
    ViewPickerSynced,
    FieldPickerSynced,
    Box,
    FormField,
    SelectButtonsSynced,
    SwitchSynced
    // Select
} from '@airtable/blocks/ui';
import React from 'react';

// This block uses chart.js and the react-chartjs-2 packages.
// Install them by running this in the terminal:
// npm install chart.js react-chartjs-2
import { Bar } from 'react-chartjs-2';

const GlobalConfigKeys = {
    TABLE_ID: 'tableId',
    VIEW_ID: 'viewId',
    X_FIELD_ID: 'xFieldId',
    Y_FIELD_ID: 'yFieldId',
    Y_MAX: 'yMax',
    Y_MIN: 'yMin',
    Y_MEDIAN: 'yMedian',
    Y_AVERAGE: 'yAverage',
    Y_SUM: 'ySum',
    Y_SCALE: 'yScale',
    SHOW_EMPTY: 'showEmpty'

};

function SimpleChartBlock() {
    const base = useBase();
    const globalConfig = useGlobalConfig();

    const tableId = globalConfig.get(GlobalConfigKeys.TABLE_ID);
    const table = base.getTableByIdIfExists(tableId);

    const viewId = globalConfig.get(GlobalConfigKeys.VIEW_ID);
    const view = table ? table.getViewByIdIfExists(viewId) : null;

    const xFieldId = globalConfig.get(GlobalConfigKeys.X_FIELD_ID);
    const xField = table ? table.getFieldByIdIfExists(xFieldId) : null;

    const yFieldId = globalConfig.get(GlobalConfigKeys.Y_FIELD_ID);
    const yField = table ? table.getFieldByIdIfExists(yFieldId) : null;

    const yMedian = globalConfig.get(GlobalConfigKeys.Y_MEDIAN);
    const yMin = globalConfig.get(GlobalConfigKeys.Y_MIN);
    const yMax = globalConfig.get(GlobalConfigKeys.Y_MAX);
    const yAverage = globalConfig.get(GlobalConfigKeys.Y_AVERAGE);
    const ySum = globalConfig.get(GlobalConfigKeys.Y_SUM);
    const yScale = globalConfig.get(GlobalConfigKeys.Y_SCALE);
    const showEmpty = globalConfig.get(GlobalConfigKeys.SHOW_EMPTY);
    console.log('yScale', yScale);

    const records = useRecords(view);

    const data = records && xField ? getChartData({ records, xField, yField, yMedian, yMax, yMin, yAverage, ySum, showEmpty }) : null;

    function showRecords(event, arr){

        // TODO: show records

        // console.log('alertme event',event);
        // console.log('alertme arr',arr);
        // console.log('alertme data',data);
    }
    console.log('data', data);
    return (
        <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            display="flex"
            flexDirection="column"
        >
            <Settings table={table} />
            {data && (
                <Box position="relative" flex="auto" padding={3}>
                    <Bar
                        data={data}
                        options={{
                            maintainAspectRatio: false,
                            scales: {
                                yAxes: [
                                    {
                                        ticks: {
                                            // Include k for thousands and M for millions
                                            callback: function (value, index, values) {
                                                if (value > 999 && value < 1000000) {
                                                    return (value / 1000) + 'k'
                                                } else if (value >= 1000000) {
                                                    return (value / 1000000) + 'M'
                                                }
                                            },
                                            beginAtZero: true
                                        },

                                        // ticks: {
                                        //     beginAtZero: true,
                                        // },
                                        type: yScale ? yScale : 'linear'
                                    },
                                ],
                            },
                            legend: {
                                display: true,
                            },
                            onClick: showRecords
                        }}
                    />
                </Box>
            )}
        </Box>
    );
}
// Getting Chart Data to populate chart
function getChartData({ records, xField, yField, yMedian, yMax, yMin, yAverage, ySum, showEmpty }) {
    console.log('yFIELD', yField);
    const recordsByXValueString = new Map();

    // Loop through records
    for (const record of records) {

        // Getting the value of the cell in X Direction... returns an object with keys=> record id (id), cell value (name), cell color (color)
        // console.log(record.getCellValue(xField));
        const xValue = record.getCellValue(xField);

        // Getting cell value as string (gets only the 'name' key as string)
        let xValueString = xValue === null ? null : record.getCellValueAsString(xField);

        console.log('xValueString', xValueString);
        if (!showEmpty) {
            if (xValueString == '') {
                xValueString = null;
            }
        }
        // const yValueNumber = record.getCellValue(yField);
        // console.log('yField Value', record.getCellValue(yField));

        // Check if the cell value 'xValueString' is NOT already added to the 'recordsByXValueString' map  
        if (!recordsByXValueString.has(xValueString)) {

            // Add a new object containing key = xValueString, and value = array containing the current record in the loop
            if (showEmpty) {
                recordsByXValueString.set(xValueString, [record]);
            } else if (xValueString) {
                recordsByXValueString.set(xValueString, [record]);
            }
        } else {
            // Else if the 'xValueString' is Already added, we will get the key and push the current record to the array
            if (showEmpty) {
                recordsByXValueString.get(xValueString).push(record);
            } else if (xValueString) {
                recordsByXValueString.get(xValueString).push(record);
            }
        }
    }
    console.log('recordsByXValueString', recordsByXValueString);

    // labels is the x axis
    const labels = [];

    // points are numeric values for the y Axis
    // const points = [];
    const minPoints = [];
    const maxPoints = [];
    const medianPoints = [];
    const averagePoints = [];
    const sumPoints = [];
    const datasets = [];


    for (const [xValueString, records] of recordsByXValueString.entries()) {
        const label = xValueString === null ? 'Empty' : xValueString;
        labels.push(label);

        //console.log('records', records);
        // using y axis as records count
        // points.push(records.length);

        if (yMax) {
            maxPoints.push(GetMaximumValue(records, yField));
        }
        if (yMin) {
            minPoints.push(GetMinimumValue(records, yField));
        }
        if (yMedian) {
            medianPoints.push(GetMedian(records, yField));
        }
        if (yAverage) {
            averagePoints.push(GetAverage(records, yField));
        }
        if (ySum) {
            sumPoints.push(GetSum(records, yField));
        }
    }
    if (yMax) {
        datasets.push({ data: maxPoints, label: 'Max', backgroundColor: '#bdffd4' });
    }
    if (yMin) {
        datasets.push({ data: minPoints, label: 'Min', backgroundColor: '#ffd9bd' });
    }
    if (yMedian) {
        datasets.push({ data: medianPoints, label: 'Median', backgroundColor: '#bdd6ff' });
    }
    if (yAverage) {
        datasets.push({ data: averagePoints, label: 'Average', backgroundColor: '#eabdff' });
    }
    if (ySum) {
        datasets.push({ data: sumPoints, label: 'Sum', backgroundColor: '#ffbdd3' });

    }

    const data = {
        labels,
        datasets
        // [
        //     {
        //         backgroundColor: '#4380f1',
        //         data: points,
        //     },
        //     {
        //         backgroundColor: '#4380f1',
        //         data: points,
        //     },
        // ],
    };
    return data;
}


////////////////////////
function GetSum(records, field) {
    let sum = 0;
    records.forEach(record => {
        sum += record.getCellValue(field);
    });
    console.log('sum', sum);
    return sum;
}

function GetAverage(records, field) {
    return Math.round(GetSum(records, field) / records.length);
}

function GetMedian(records, field) {
    const numbersArray = records.map(record => record.getCellValue(field));
    const mid = Math.floor(numbersArray.length / 2),
        nums = [...numbersArray].sort((a, b) => a - b);
    console.log('Median', numbersArray.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2)
    return numbersArray.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

function GetMaximumValue(records, field) {
    // console.log('records', records);
    let maxValue = records[0].getCellValue(field);
    records.forEach(record => {
        if (record.getCellValue(field) > maxValue) {
            maxValue = record.getCellValue(field);
        }
    });
    console.log('maxValue', maxValue);
    return maxValue;
}

function GetMinimumValue(records, field) {
    // console.log('records', records);
    let minValue = records[0].getCellValue(field);
    records.forEach(record => {
        if (record.getCellValue(field) < minValue) {
            minValue = record.getCellValue(field);
        }
    });
    console.log('minValue', minValue);
    return minValue;
}
//////////////////////



function Settings({ table }) {
    const options = [
        { value: "linear", label: "linear" },
        { value: "logarithmic", label: "logarithmic" }
    ];
    // const [value, setValue] = useState(options[0].value);


    return (
        [
            <Box key={0} display="flex" padding={3} borderBottom="thick">
                <FormField label="Table" width="25%" paddingRight={1} marginBottom={0}>
                    <TablePickerSynced globalConfigKey={GlobalConfigKeys.TABLE_ID} />
                </FormField>
                {table && (
                    <FormField label="View" width="25%" paddingX={1} marginBottom={0}>
                        <ViewPickerSynced table={table} globalConfigKey={GlobalConfigKeys.VIEW_ID} />
                    </FormField>
                )}
                {table && (
                    <FormField label="X-axis field" width="25%" paddingLeft={1} marginBottom={0}>
                        <FieldPickerSynced
                            table={table}
                            globalConfigKey={GlobalConfigKeys.X_FIELD_ID}
                        />
                    </FormField>
                )}

                {table && (
                    <FormField label="Y-axis field" width="25%" paddingLeft={1} marginBottom={0}>
                        <FieldPickerSynced
                            table={table}
                            globalConfigKey={GlobalConfigKeys.Y_FIELD_ID}
                        />
                    </FormField>
                )}

                {/* <FormField label="Select Rollup" width="25%" paddingLeft={1} marginBottom={0}>
                <SelectSynced
                    options={options}
                    globalConfigKey={GlobalConfigKeys.Y_ROLLUP}
                />
            </FormField> */}

            </Box>,
            <Box key={1} display="flex" padding={3} >
                <SwitchSynced
                    globalConfigKey={GlobalConfigKeys.Y_MAX}
                    label="Max"
                    size="small"
                    width='fitContent'
                    paddingLeft={1}
                    backgroundColor="transparent"
                />
                <SwitchSynced
                    globalConfigKey={GlobalConfigKeys.Y_MIN}
                    label="Min"
                    size="small"
                    width='fitContent'
                    paddingLeft={3}
                    backgroundColor="transparent"
                />
                <SwitchSynced
                    globalConfigKey={GlobalConfigKeys.Y_MEDIAN}
                    label="Median"
                    size="small"
                    width='fitContent'
                    paddingLeft={3}
                    backgroundColor="transparent"
                />
                <SwitchSynced
                    globalConfigKey={GlobalConfigKeys.Y_AVERAGE}
                    label="Average"
                    size="small"
                    width='fitContent'
                    paddingLeft={3}
                    backgroundColor="transparent"
                />
                <SwitchSynced
                    globalConfigKey={GlobalConfigKeys.Y_SUM}
                    label="Sum"
                    size="small"
                    width='fitContent'
                    paddingLeft={3}
                    backgroundColor="transparent"
                />
                <SwitchSynced
                    globalConfigKey={GlobalConfigKeys.SHOW_EMPTY}
                    label="Show Empty"
                    size="small"
                    width='fitContent'
                    paddingLeft={3}
                    backgroundColor="transparent"
                />
                <SelectButtonsSynced
                    globalConfigKey={GlobalConfigKeys.Y_SCALE}
                    options={options}
                    // label="Scale"
                    // size="small"
                    width='25%'
                    defaultValue={{ label: "linear", value: 'linear' }}
                // paddingLeft={3}
                // backgroundColor="transparent"
                />
            </Box>
        ]
    );
}

initializeBlock(() => <SimpleChartBlock />);
