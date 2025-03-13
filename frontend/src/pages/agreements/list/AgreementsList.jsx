import _ from "lodash";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import App from "../../../App";
import { useGetAgreementsQuery } from "../../../api/opsAPI";
import AgreementsTable from "../../../components/Agreements/AgreementsTable";
import ChangeRequests from "../../../components/ChangeRequests";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";
import AgreementsFilterButton from "./AgreementsFilterButton/AgreementsFilterButton";
import AgreementsFilterTags from "./AgreementsFilterTags/AgreementsFilterTags";
import AgreementTabs from "./AgreementsTabs";
import sortAgreements from "./utils";
import {
    findNextBudgetLine,
    findNextNeedBy,
    getAgreementName,
    getAgreementSubTotal,
    getProcurementShopSubTotal,
    getResearchProjectName
} from "../../../components/Agreements/AgreementsTable/AgreementsTable.helpers";
import { setAlert } from "../../../components/UI/Alert/alertSlice";
import { exportTableToXlsx } from "../../../helpers/tableExport.helpers";
import { convertCodeForDisplay, totalBudgetLineFeeAmount } from "../../../helpers/utils";

/**
 * @typedef {import('../../../components/Agreements/AgreementTypes').Agreement} Agreement
 */
/**
 * @component Page for the Agreements List.
 * @returns {import("react").JSX.Element} - The component JSX.
 */
const AgreementsList = () => {
    const [searchParams] = useSearchParams();
    const [filters, setFilters] = useState({
        portfolio: [],
        fiscalYear: [],
        budgetLineStatus: []
    });

    const {
        data: agreements,
        error: errorAgreement,
        isLoading: isLoadingAgreement
    } = useGetAgreementsQuery({ refetchOnMountOrArgChange: true });

    const activeUser = useSelector((state) => state.auth.activeUser);
    const myAgreementsUrl = searchParams.get("filter") === "my-agreements";
    const changeRequestUrl = searchParams.get("filter") === "change-requests";

    if (isLoadingAgreement) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
    }
    if (errorAgreement) {
        return (
            <App>
                <h1>Oops, an error occurred</h1>
            </App>
        );
    }

    // FILTERS
    /** @param{Agreement[]} agreements */
    let filteredAgreements = _.cloneDeep(agreements);

    // filter by fiscal year
    filteredAgreements = filteredAgreements?.filter(
        /** @param{Agreement} agreement */
        (agreement) => {
            return (
                filters.fiscalYear == null ||
                filters.fiscalYear?.length === 0 ||
                filters.fiscalYear?.some((fiscalYear) => {
                    return agreement.budget_line_items?.some((bli) => {
                        return bli.fiscal_year == fiscalYear.id;
                    });
                })
            );
        }
    );

    // filter by portfolios
    filteredAgreements = filteredAgreements?.filter(
        /** @param{Agreement} agreement */
        (agreement) => {
            return (
                filters.portfolio == null ||
                filters.portfolio?.length === 0 ||
                filters.portfolio?.some((portfolio) => {
                    return agreement.budget_line_items?.some((bli) => {
                        return bli.portfolio_id == portfolio.id;
                    });
                })
            );
        }
    );

    // filter by budget line status
    filteredAgreements = filteredAgreements?.filter(
        /** @param{Agreement} agreement */
        (agreement) => {
            return (
                filters.budgetLineStatus == null ||
                filters.budgetLineStatus?.length === 0 ||
                (filters.budgetLineStatus?.some((item) => {
                    return item.status == BLI_STATUS.DRAFT;
                }) &&
                    agreement.budget_line_items?.length === 0) ||
                (filters.budgetLineStatus?.some((item) => {
                    return item.status == BLI_STATUS.DRAFT;
                }) &&
                    agreement.budget_line_items?.some((bli) => {
                        return bli.status === BLI_STATUS.DRAFT;
                    })) ||
                (filters.budgetLineStatus?.some((item) => {
                    return item.status == BLI_STATUS.PLANNED;
                }) &&
                    agreement.budget_line_items?.some((bli) => {
                        return bli.status === BLI_STATUS.PLANNED;
                    })) ||
                (filters.budgetLineStatus?.some((item) => {
                    return item.status == BLI_STATUS.EXECUTING;
                }) &&
                    agreement.budget_line_items?.some((bli) => {
                        return bli.status === BLI_STATUS.EXECUTING;
                    })) ||
                (filters.budgetLineStatus?.some((item) => {
                    return item.status == BLI_STATUS.OBLIGATED;
                }) &&
                    agreement.budget_line_items?.some((bli) => {
                        return bli.status === BLI_STATUS.OBLIGATED;
                    }))
            );
        }
    );

    let sortedAgreements = [];
    if (myAgreementsUrl) {
        const myAgreements = filteredAgreements.filter(
            /** @param{Agreement} agreement */
            (agreement) => {
                return agreement.team_members?.some((teamMember) => {
                    return teamMember.id === activeUser.id || agreement.project_officer_id === activeUser.id;
                });
            }
        );
        sortedAgreements = sortAgreements(myAgreements);
    } else {
        // all-agreements
        sortedAgreements = sortAgreements(filteredAgreements);
    }

    let subtitle = "All Agreements";
    let details = "This is a list of all agreements across OPRE. Draft budget lines are not included in the Totals.";
    if (myAgreementsUrl) {
        subtitle = "My Agreements";
        details =
            "This is a list of agreements you are listed as a Team Member on.  Draft budget lines are not included in the Totals.";
    }
    if (changeRequestUrl) {
        subtitle = "For Review";
        details =
            "This is a list of changes within your Division that require your review and approval. This list could include requests for budget changes, status changes or actions taking place during the procurement process.";
    }

    const handleExport = async () => {
        try {
            const currentTimeStamp = new Date().toISOString();
            const tableHeader = [
                "Agreement",
                "Project",
                "Type",
                "Agreement SubTotal",
                "Agreement Fees",
                "Next Budget Line SubTotal",
                "Next Budget Line Fees",
                "Next Obligate By"
            ];
            await exportTableToXlsx({
                data: sortedAgreements,
                headers: tableHeader,
                rowMapper: (agreement) => {
                    const agreementName = getAgreementName(agreement);
                    const project = getResearchProjectName(agreement);
                    const type = convertCodeForDisplay("agreementType", agreement?.agreement_type);
                    const agreementSubTotal = getAgreementSubTotal(agreement);
                    const agreementFees = getProcurementShopSubTotal(agreement);
                    const nextBudgetLine = findNextBudgetLine(agreement);
                    const nextBudgetLineFees = totalBudgetLineFeeAmount(
                        nextBudgetLine?.amount,
                        nextBudgetLine?.proc_shop_fee_percentage
                    );
                    const nextObligateBy = findNextNeedBy(agreement);

                    return [
                        agreementName,
                        project,
                        type,
                        agreementSubTotal,
                        agreementFees,
                        nextBudgetLine?.amount ?? 0,
                        nextBudgetLineFees,
                        nextObligateBy
                    ];
                },
                filename: `agreements_${currentTimeStamp}.xlsx`
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
        <App breadCrumbName="Agreements">
            {!changeRequestUrl && (
                <TablePageLayout
                    title="Agreements"
                    subtitle={subtitle}
                    details={details}
                    buttonText="Add Agreement"
                    buttonLink="/agreements/create"
                    TabsSection={<AgreementTabs />}
                    FilterTags={
                        <AgreementsFilterTags
                            filters={filters}
                            setFilters={setFilters}
                        />
                    }
                    FilterButton={
                        <>
                            <div className="display-flex">
                                <div>
                                    {" "}
                                    <AgreementsFilterButton
                                        filters={filters}
                                        setFilters={setFilters}
                                    />
                                </div>
                                <div>
                                    {sortedAgreements.length > 0 && (
                                        <button
                                            className="usa-button usa-button--outline text-primary margin-left-1"
                                            data-cy="agreement-export"
                                            onClick={handleExport}
                                        >
                                            Export
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    }
                    TableSection={<AgreementsTable agreements={sortedAgreements} />}
                />
            )}
            {changeRequestUrl && (
                <TablePageLayout
                    title="Agreements"
                    subtitle={subtitle}
                    details={details}
                    buttonText="Add Agreement"
                    buttonLink="/agreements/create"
                    TabsSection={<AgreementTabs />}
                >
                    <ChangeRequests />
                </TablePageLayout>
            )}
        </App>
    );
};

export default AgreementsList;
