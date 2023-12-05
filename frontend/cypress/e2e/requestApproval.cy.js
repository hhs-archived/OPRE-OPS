import { terminalLog, testLogin } from "./utils";

beforeEach(() => {
    testLogin("admin");
    cy.visit(`/`);
});

afterEach(() => {
    cy.injectAxe();
    cy.checkA11y(null, null, terminalLog);
});

it("cannot edit an agreement with budget line items obligated", () => {
    cy.visit(`agreements/review/1`);
    cy.get("dd").first().should("have.text", "Contract #1: African American Child and Family Research Center");
    cy.get('[data-cy="div-change-draft-to-planned"]').should("exist").click();
    cy.get("thead > tr > :nth-child(1) > .usa-checkbox__label").should("exist").click();
    //cy.get('[data-cy="check-all"]').should("exist").click(); // TODO: fix this - not picking up the data-cy
    cy.get('[data-cy="send-to-approval-btn"]').click();
    // TODO: add assertion that the agreement is in the correct status
    cy.get(".usa-alert__text").should(
        "contain",
        "The agreement has been successfully sent to approval for Planned Status"
    );
});
