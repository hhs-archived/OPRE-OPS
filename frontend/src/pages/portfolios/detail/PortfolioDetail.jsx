import { useDispatch, useSelector } from "react-redux";
import { getPortfolioAndSetState } from "./getPortfolio";
import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PortfolioFundingSummary from "../../../components/PortfolioFundingSummary/PortfolioFundingSummary";
import { setPortfolio } from "./portfolioDetailSlice";
import { getCurrentFiscalYear } from "../../../components/PortfolioFundingTotal/util";
import App from "../../../App";
import { BreadcrumbItem, BreadcrumbList } from "../../../components/Header/Breadcrumb";
import PortfolioHeader from "../../../components/PortfolioHeader/PortfolioHeader";
import CanCard from "../../../components/CanCard/CanCard";

import styles from "./styles.module.css";

const PortfolioDetail = () => {
    const dispatch = useDispatch();
    const portfolio = useSelector((state) => state.portfolioDetail.portfolio);
    const urlPathParams = useParams();
    const portfolioId = parseInt(urlPathParams.id);
    const canId = 1;
    const currentFiscalYear = getCurrentFiscalYear(new Date());

    useEffect(() => {
        dispatch(getPortfolioAndSetState(portfolioId));

        return () => {
            dispatch(setPortfolio({}));
        };
    }, [dispatch, portfolioId]);

    return (
        <>
            <App>
                <BreadcrumbList>
                    <BreadcrumbItem isCurrent pageName="Portfolios" />
                </BreadcrumbList>
                <div style={styles.body}>
                    <div className="margin-left-2 margin-right-2">
                        <PortfolioHeader />
                        <section>
                            <PortfolioFundingSummary portfolioId={portfolioId} fiscalYear={currentFiscalYear} />
                        </section>
                        <section>
                            <CanCard portfolioId={portfolioId} canId={canId} />
                        </section>
                    </div>
                </div>
            </App>
        </>
    );
};

export default PortfolioDetail;
