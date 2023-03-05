import { configureStore } from "@reduxjs/toolkit";
import canListSlice from "./pages/cans/list/canListSlice";
import canDetailSlice from "./pages/cans/detail/canDetailSlice";
import portfolioListSlice from "./pages/portfolios/list/portfolioListSlice";
import portfolioBudgetSummarySlice from "./components/Portfolios/PortfolioBudgetSummary/portfolioBudgetSummarySlice";
// eslint-disable-next-line import/no-named-as-default
import authSlice from "./components/Auth/authSlice";
import userSlice from "./pages/users/detail/userSlice";
import portfolioSlice from "./pages/portfolios/detail/portfolioSlice";
import researchProjectSlice from "./pages/researchProjects/detail/researchProjectSlice";
import ResearchProjectFundingSlice from "./components/Portfolios/ResearchProjects/ResearchProjectFundingSlice";

export default configureStore({
    reducer: {
        canList: canListSlice,
        canDetail: canDetailSlice,
        portfolioList: portfolioListSlice,
        portfolioBudgetSummary: portfolioBudgetSummarySlice,
        auth: authSlice,
        portfolio: portfolioSlice,
        userDetail: userSlice,
        researchProject: researchProjectSlice,
        researchProjectFunding: ResearchProjectFundingSlice,
    },
});
