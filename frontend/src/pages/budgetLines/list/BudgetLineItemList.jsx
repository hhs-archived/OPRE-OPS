import React from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import _ from "lodash";
import App from "../../../App";
import { useGetBudgetLineItemsQuery, useGetCansQuery, useGetAgreementsQuery } from "../../../api/opsAPI";
import Breadcrumb from "../../../components/UI/Header/Breadcrumb";
import Alert from "../../../components/UI/Alert";
import TablePageLayout from "../../../components/UI/Layouts/TablePageLayout";
import AllBudgetLinesTable from "../../../components/UI/AllBudgetLinesTable";

/**
 * Page for the Budget Line Item List.
 * @returns {React.JSX.Element} - The component JSX.
 */
export const BudgetLineItemList = () => {
    const [searchParams] = useSearchParams();
    const isAlertActive = useSelector((state) => state?.alert?.isActive);
    const loggedInUserId = useSelector((state) => state?.auth?.activeUser?.id);
    const activeUser = useSelector((state) => state?.auth?.activeUser);
    const [filters, setFilters] = React.useState({});
    const {
        data: budgetLineItems,
        error: budgetLineItemsError,
        isLoading: budgetLineItemsIsLoading,
    } = useGetBudgetLineItemsQuery();
    const { data: cans, error: cansError, isLoading: cansIsLoading } = useGetCansQuery();
    const { data: agreements, error: agreementsError, isLoading: agreementsAreError } = useGetAgreementsQuery();

    const myBudgetLineItemsUrl = searchParams.get("filter") === "my-budget-line-items";

    if (budgetLineItemsIsLoading || cansIsLoading || agreementsAreError) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
    }
    if (budgetLineItemsError || cansError || agreementsError) {
        return (
            <App>
                <h1>Oops, an error occurred</h1>
            </App>
        );
    }

    const sortBLIs = () => {};

    // FILTERS
    let filteredBudgetLineItems = _.cloneDeep(budgetLineItems);

    let sortedBLIs = [];
    if (myBudgetLineItemsUrl) {
        const myBLIs = filteredBudgetLineItems.filter(() => {
            return true;
        });
        sortedBLIs = sortBLIs(myBLIs);
    } else {
        // all-budget-line-items
        sortedBLIs = sortBLIs(filteredBudgetLineItems);
    }

    console.log("filters", filters);
    console.log("setFilters", setFilters);
    console.log("activeUser", activeUser);
    console.log("sortedBLIs", sortedBLIs);

    const budgetLinesWithCanAndAgreementName = budgetLineItems.map((budgetLine) => {
        const can = cans.find((can) => can.id === budgetLine.can_id);
        const agreement = agreements.find((agreement) => agreement.id === budgetLine.agreement_id);
        const isLoggedInUserTheProjectOfficer = agreement.project_officer === loggedInUserId;
        const isLoggedInUserTheAgreementCreator = agreement?.created_by === loggedInUserId;
        const isLoggedInUserATeamMember = agreement?.team_members?.some(
            (teamMember) => teamMember.id === loggedInUserId
        );
        const isLoggedInUserAllowedToEdit =
            isLoggedInUserTheProjectOfficer || isLoggedInUserTheAgreementCreator || isLoggedInUserATeamMember;
        const procurementShopAbbr = agreement?.procurement_shop?.abbr;
        const procurementShopFee = agreement?.procurement_shop?.fee;

        return {
            ...budgetLine,
            can_number: can?.number,
            agreement_name: agreement?.name,
            isAllowedToEdit: isLoggedInUserAllowedToEdit,
            procShopCode: procurementShopAbbr,
            procShopFee: procurementShopFee,
        };
    });

    return (
        <App>
            <Breadcrumb currentName={"Budget Lines"} />
            {isAlertActive && <Alert />}
            <TablePageLayout
                title="Budget Lines"
                subtitle={myBudgetLineItemsUrl ? "My Budget Lines" : "All Budget Lines"}
                details={
                    myBudgetLineItemsUrl
                        ? "This is a list of the budget lines you are listed as a Team Member on. Please select filter options to see budget lines by Portfolio, Status, or Fiscal Year."
                        : "This is a list of budget lines across all OPRE projects and agreements, including drafts. Please select filter options to see budget lines by Portfolio, Status, or Fiscal Year."
                }
                buttonText="Add Budget Lines"
                buttonLink="/budget-lines/create"
                TableSection={<AllBudgetLinesTable budgetLines={budgetLinesWithCanAndAgreementName} />}
            />
        </App>
    );
};
