import { useEffect, useState } from "react";
import App from "../../../App";
import {
    useGetBudgetLineItemsQuery,
    useLazyGetBudgetLineItemsQuery,
    useLazyGetServicesComponentByIdQuery
} from "../../../api/opsAPI";
import AllBudgetLinesTable from "../../../components/BudgetLineItems/AllBudgetLinesTable";
import SummaryCardsSection from "../../../components/BudgetLineItems/SummaryCardsSection";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import { setAlert } from "../../../components/UI/Alert/alertSlice";
import { exportTableToXlsx } from "../../../helpers/tableExport.helpers";
import { formatDateNeeded, totalBudgetLineFeeAmount } from "../../../helpers/utils";
import icons from "../../../uswds/img/sprite.svg";
import BLIFilterButton from "./BLIFilterButton";
import BLIFilterTags from "./BLIFilterTags";
import BLITags from "./BLITabs";
import { uniqueBudgetLinesFiscalYears } from "./BudgetLineItems.helpers";
import { useBudgetLinesList } from "./BudgetLinesItems.hooks";

/**
 * @component Page for the Budget Line Item List.
 * @returns {import("react").JSX.Element} - The component JSX.
 */
const BudgetLineItemList = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const { myBudgetLineItemsUrl, filters, setFilters } = useBudgetLinesList();
    const {
        data: budgetLineItems,
        error: budgetLineItemsError,
        isLoading: budgetLineItemsIsLoading
    } = useGetBudgetLineItemsQuery({
        filters,
        page: currentPage - 1,
        onlyMy: myBudgetLineItemsUrl,
        includeFees: true,
        refetchOnMountOrArgChange: true
    });

    const [serviceComponentTrigger] = useLazyGetServicesComponentByIdQuery();
    const [budgetLineTrigger] = useLazyGetBudgetLineItemsQuery();

    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    if (budgetLineItemsIsLoading) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
    }
    if (budgetLineItemsError) {
        return (
            <App>
                <h1>Oops, an error occurred</h1>
            </App>
        );
    }

    const budgetLinesFiscalYears = uniqueBudgetLinesFiscalYears(budgetLineItems);
    const handleExport = async () => {
        try {
            // Get all the budgetlines
            const { data: allBudgetLines } = await budgetLineTrigger({
                filters
            });

            // Get the service component name for each budget line individually
            const serviceComponentPromises = allBudgetLines
                .filter((budgetLine) => budgetLine?.services_component_id)
                .map((budgetLine) => serviceComponentTrigger(budgetLine.services_component_id).unwrap());

            const serviceComponentResponses = await Promise.all(serviceComponentPromises);

            /** @type {Record<number, {service_component_name: string}>} */
            const budgetLinesDataMap = {};
            allBudgetLines.forEach((budgetLine) => {
                const response = serviceComponentResponses.find(
                    (resp) => resp && resp.id === budgetLine?.services_component_id
                );

                budgetLinesDataMap[budgetLine.id] = {
                    service_component_name: response?.display_name || "TBD" // Use optional chaining and fallback
                };
            });

            const header = [
                "BL ID #",
                "Agreement",
                "SC",
                "Obligate By",
                "FY",
                "CAN",
                "SubTotal",
                "Procurement shop fee",
                "Procurement shop fee rate",
                "Status"
            ];

            await exportTableToXlsx({
                data: allBudgetLines,
                headers: header,
                rowMapper: (/** @type {import("../../../helpers/budgetLines.helpers").BudgetLine} */ budgetLine) => {
                    const fees = totalBudgetLineFeeAmount(budgetLine?.amount, budgetLine?.proc_shop_fee_percentage);
                    const feeRate =
                        !budgetLine?.proc_shop_fee_percentage || budgetLine?.proc_shop_fee_percentage === 0
                            ? "0"
                            : `${(budgetLine?.proc_shop_fee_percentage * 100).toFixed(2)}%`;
                    return [
                        budgetLine.id,
                        budgetLine.agreement.name,
                        budgetLinesDataMap[budgetLine.id]?.service_component_name,
                        formatDateNeeded(budgetLine?.date_needed),
                        budgetLine.fiscal_year,
                        budgetLine.can.display_name,
                        budgetLine?.amount?.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD"
                        }) ?? "",
                        fees.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD"
                        }) ?? "",
                        feeRate,
                        budgetLine?.in_review ? "In Review" : budgetLine?.status
                    ];
                },
                filename: "budget_lines"
            });
        } catch (error) {
            console.error("Failed to export data:", error);
            setAlert({
                type: "error",
                heading: "Error",
                message: "An error occurred while exporting the data.",
                redirectUrl: "/error"
            });
        }
    };

    return (
        <App breadCrumbName="Budget Lines">
            <TablePageLayout
                title="Budget Lines"
                subtitle={myBudgetLineItemsUrl ? "My Budget Lines" : "All Budget Lines"}
                details={
                    myBudgetLineItemsUrl
                        ? "This is a list of the budget lines you are listed as a Team Member on. Please select filter options to see budget lines by Portfolio, Status, or Fiscal Year."
                        : "This is a list of budget lines across all OPRE projects and agreements, including drafts. Please select filter options to see budget lines by Portfolio, Status, or Fiscal Year."
                }
                TabsSection={<BLITags />}
                FilterTags={
                    <BLIFilterTags
                        filters={filters}
                        setFilters={setFilters}
                    />
                }
                TableSection={
                    <>
                        <AllBudgetLinesTable
                            currentPage={currentPage}
                            setCurrentPage={setCurrentPage}
                            budgetLineItems={budgetLineItems}
                            budgetLineItemsError={budgetLineItemsError}
                            budgetLineItemsIsLoading={budgetLineItemsIsLoading}
                        />
                    </>
                }
                FilterButton={
                    <>
                        <div className="display-flex">
                            <div>
                                {budgetLineItems.length > 0 && (
                                    <button
                                        style={{ fontSize: "16px" }}
                                        className="usa-button--unstyled text-primary display-flex flex-align-end"
                                        data-cy="budget-line-export"
                                        onClick={handleExport}
                                    >
                                        <svg
                                            className={`height-2 width-2 margin-right-05`}
                                            style={{ fill: "#005EA2", height: "24px", width: "24px" }}
                                        >
                                            <use xlinkHref={`${icons}#save_alt`}></use>
                                        </svg>
                                        <span>Export</span>
                                    </button>
                                )}
                            </div>
                            <div className="margin-left-205">
                                <BLIFilterButton
                                    filters={filters}
                                    setFilters={setFilters}
                                    budgetLinesFiscalYears={budgetLinesFiscalYears}
                                />
                            </div>
                        </div>
                    </>
                }
                SummaryCardsSection={
                    <SummaryCardsSection
                        budgetLines={budgetLineItems}
                        totalAmount={budgetLineItems[0]?._meta?.total_amount ?? 0}
                        totalDraftAmount={budgetLineItems[0]?._meta?.total_draft_amount ?? 0}
                        totalPlannedAmount={budgetLineItems[0]?._meta?.total_planned_amount ?? 0}
                        totalExecutingAmount={budgetLineItems[0]?._meta?.total_in_execution_amount ?? 0}
                        totalObligatedAmount={budgetLineItems[0]?._meta?.total_obligated_amount ?? 0}
                    />
                }
            />
        </App>
    );
};

export default BudgetLineItemList;
