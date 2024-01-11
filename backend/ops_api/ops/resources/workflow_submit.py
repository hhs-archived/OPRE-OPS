from dataclasses import dataclass
from datetime import date, datetime

from flask import Response, current_app, request
from flask_jwt_extended import verify_jwt_in_request
from marshmallow import Schema, ValidationError, fields
from models.base import BaseModel
from models.cans import BudgetLineItem
from models.notifications import Notification
from models.workflows import (
    Package,
    PackageSnapshot,
    WorkflowAction,
    WorkflowInstance,
    WorkflowStatus,
    WorkflowStepInstance,
    WorkflowTriggerType,
)
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.utils.auth import ExtraCheckError, Permission, PermissionType, is_authorized
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.user import get_user_from_token
from sqlalchemy.exc import PendingRollbackError, SQLAlchemyError
from typing_extensions import override

ENDPOINT_STRING = "/workflow-submit"


@dataclass
class WorkflowSubmissionData(Schema):
    budget_line_item_ids: fields.List(fields.Int(), required=True)
    submitter_id: fields.Int(required=False)

    def __init__(self, *args, **kwargs):
        self.budget_line_item_ids = kwargs.get("budget_line_item_ids")
        self.submitter_id = kwargs.get("submitter_id")
        super().__init__(*args, **kwargs)


class WorkflowSubmisionListApi(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.POST, Permission.BLI_PACKAGE)
    def post(self) -> Response:
        message_prefix = f"POST to {ENDPOINT_STRING}"
        current_app.logger.info(f"********** /approve Request: {request.json}")
        try:
            # with OpsEventHandler(OpsEventHandler.CREATE_BLI_PACKAGE) as meta:

            # TODO: Using a dataclass schema for ApprovalSubmissionData, load data from request.json
            # data = ApprovalSubmissionData().load(data=request.json)

            submitter_id = request.json.get("submitter_id")
            budget_line_item_ids = request.json.get("budget_line_item_ids", [])
            submission_notes = request.json.get("notes")
            # Capture the use-case for this package (DRAFT_TO_PLANNED or PLANNED_TO_EXECUTED)
            workflow_action = request.json.get("workflow_action")
            # Create new Package
            new_package = Package()

            if submitter_id := request.json.get("submitter_id"):
                new_package.submitter_id = submitter_id

            token = verify_jwt_in_request()
            user = get_user_from_token(token[1])
            new_package.created_by = user.id
            new_package.submitter_id = user.id
            new_package.notes = submission_notes
            agreement_id = None
            # Create PackageSnapshot
            # Handle budget_line_item IDs and create PackageSnapshot records
            for bli_id in budget_line_item_ids:
                bli = current_app.db_session.get(BudgetLineItem, bli_id)

                if bli:
                    validate_bli(bli)
                    # latest_version = bli.versions.order_by(desc("id")).first()
                    # current_app.logger.info(f"Latest version: {latest_version}")
                    agreement_id = bli.agreement_id
                    new_package.package_snapshots.append(
                        PackageSnapshot(
                            bli_id=bli.id,
                            # package_id=new_package.id,
                            version=None,
                        )
                    )
                    # current_app.db_session.add(snapshot)
                    # bli_cans.append(bli.can_id)
                else:
                    raise ValueError(f"BudgetLineItem with ID {bli_id} does not exist.")

            # WIP: Create WorkflowInstance and WorkflowStepInstance
            workflow_instance = WorkflowInstance()
            workflow_instance.workflow_template_id = 1  # We know this is a basic approval template
            workflow_instance.created_by = user.id
            workflow_instance.workflow_action = WorkflowAction[workflow_action]

            #  In order to know which workflow to follow, ie: who to send the approval request to,
            #  we need to know which CAN the BLIs are associated with. This is the associated_id,
            #  and the associated_type will be "CAN".
            #  TODO: this should step over the `bli_cans` list and create a workflow step instance for each CAN,
            #  but for now, going to assume the first BLI CAN is all we need, to ensure the process works.
            workflow_instance.associated_id = 1  # bli_cans[0]
            workflow_instance.associated_type = WorkflowTriggerType.CAN

            workflow_step_instance = WorkflowStepInstance(
                workflow_step_template_id=2,
                status=WorkflowStatus.REVIEW,
                notes=submission_notes,
                created_by=user.id,
                time_started=datetime.now(),
                successor_dependencies=[],
                predecessor_dependencies=[],
            )
            current_app.logger.info(f"Workflow Step Instance: {workflow_step_instance}")

            workflow_instance.steps.append(workflow_step_instance)

            # WIP: commit our new workflow instance
            current_app.db_session.add(workflow_instance)
            current_app.db_session.commit()

            # updated the current step in the bli package to the first step in the workflow
            new_package.workflow_id = workflow_instance.id

            # commit our new bli package
            current_app.db_session.add(new_package)
            current_app.db_session.commit()

            new_package_dict = new_package.to_dict()
            # meta.metadata.update({"New Bli Package": new_package_dict})
            current_app.logger.info(f"POST to {ENDPOINT_STRING}: New Bli Package created: {new_package_dict}")

            # Create a notification for the approvers
            notification = Notification(
                title="Approval Request",
                message=f"""An Agreement Approval Request has been submitted.
Please review and approve. LINK to Agreement: {agreement_id}""",
                is_read=False,
                recipient_id=23,
                expires=date(2031, 12, 31),
            )
            current_app.db_session.add(notification)
            current_app.db_session.commit()

            return make_response_with_headers({"message": "Bli Package created", "id": new_package.id}, 201)
        except (KeyError, RuntimeError, PendingRollbackError, ValueError) as re:
            current_app.logger.error(f"{message_prefix}: {re}")
            return make_response_with_headers({}, 400)
        except ValidationError as ve:
            current_app.logger.error(f"{message_prefix}: {ve}")
            return make_response_with_headers(ve.normalized_messages(), 400)
        except SQLAlchemyError as se:
            current_app.logger.error(f"POST to {ENDPOINT_STRING}: {se}")
            return make_response_with_headers({}, 500)


def validate_bli(bli: BudgetLineItem):
    if bli is None:
        raise ValueError("bli is required")
    if bli.agreement_id is None:
        raise ExtraCheckError({"_schema": ["BLI must have an Agreement when status is not DRAFT"]})
    if bli.agreement_id and not bli.agreement.research_project_id:
        raise ValidationError("BLI's Agreement must have a ResearchProject when status is not DRAFT")
    return
