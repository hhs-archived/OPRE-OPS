from flask import Response, request

from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import check_user_session, is_authorized
from ops_api.ops.base_views import BaseItemAPI, handle_api_error
from ops_api.ops.utils.fiscal_year import get_current_fiscal_year
from ops_api.ops.utils.portfolios import get_total_funding
from ops_api.ops.utils.response import make_response_with_headers


class PortfolioFundingSummaryItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @handle_api_error
    @is_authorized(PermissionType.GET, Permission.PORTFOLIO)
    @check_user_session
    def get(self, id: int) -> Response:
        fiscal_year = request.args.get("fiscal_year")

        if not fiscal_year:
            fiscal_year = get_current_fiscal_year()

        portfolio = self._get_item(id)
        portfolio_funding_summary = get_total_funding(portfolio, fiscal_year)
        return make_response_with_headers(portfolio_funding_summary)
