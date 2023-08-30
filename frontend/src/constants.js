const constants = {
    notFilledInText: "--",
    colors: [
        "#336A90",
        "#A1D0BE",
        "#B50909",
        "#E5A000",
        "#6F3331",
        "#C07B96",
        "#264A64",
        "#3A835B", // Tim: Changed this from #3E8D61 to meet WCAG 2 AA a11y testing
        "#D67625",
        "#429195",
    ],
    fiscalYears: [2020, 2021, 2022, 2023, 2024],
    barChartColors: [
        {
            color: "hsla(116, 44%, 32%, 1)", // dark green
        },
        {
            color: "hsla(157, 33%, 72%, 1)", // mid green
        },
        {
            color: "hsla(153, 49%, 47%, 1)", // light green
        },
    ],
};

export const All_BUDGET_LINES_TABLE_HEADINGS = ["Description", "Agreement", "Need By", "FY", "CAN", "Total", "Status"];
export const BUDGET_LINE_TABLE_HEADERS = ["Description", "Need By", "FY", "CAN", "Amount", "Fee", "Total", "Status"];

export default constants;
