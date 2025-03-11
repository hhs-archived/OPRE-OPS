import PropTypes from "prop-types";
import AgreementTableRow from "./AgreementTableRow";
// import { useState } from "react";
import Table from "../../UI/Table";
import { TABLE_HEADINGS } from "./AgreementsTable.constants";

/**
 * Agreement table.
 * @param {Object} props - The component props.
 * @param {Object[]} props.agreements - Array of Agreement to display in the table.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const AgreementsTable = ({ agreements = [] }) => {
    // const [sortCondition, setSortCondition] = useState(null);
    return (
        <>
            <Table tableHeadings={TABLE_HEADINGS}>
                {agreements.length > 0 &&
                    agreements?.map((agreement) => (
                        <AgreementTableRow
                            key={agreement?.id}
                            agreement={agreement}
                        />
                    ))}
            </Table>
            {agreements.length === 0 && (
                <div
                    id="agreements-table-zero-results"
                    className="padding-top-5 display-flex flex-justify-center"
                >
                    There are 0 results based on your filter selections.
                </div>
            )}
        </>
    );
};

AgreementsTable.propTypes = {
    agreements: PropTypes.arrayOf(PropTypes.object)
};
export default AgreementsTable;
