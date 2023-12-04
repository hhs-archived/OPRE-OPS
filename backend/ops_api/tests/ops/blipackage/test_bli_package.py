import pytest
from flask import url_for
from sqlalchemy.exc import SQLAlchemyError
from models.cans import BudgetLineItem
from models.workflows import BliPackage, BliPackageSnapshot

@pytest.mark.usefixtures("app_ctx")
def test_approve_submission_success(auth_client, loaded_db):
    # Prepare data for the POST request
    budget_line_item = loaded_db.get(BudgetLineItem, 1)  # fetch a budget line item

    submitter_id = 21 # Admin User
    budget_line_item_ids = [budget_line_item.id]
    submission_notes = "Test notes"

    response = auth_client.post(
        url_for("api.approve-submission-list"),
        json={
            "submitter_id": submitter_id,
            "budget_line_item_ids": budget_line_item_ids,
            "notes": submission_notes
        }
    )

    # Assertions
    assert response.status_code == 201
    data = response.json
    assert data["message"] == "Bli Package created"
    assert "id" in data

    # Verify BliPackageSnapshot creation
    new_bli_package = loaded_db.get(BliPackage, data["id"])
    assert new_bli_package is not None
    assert len(new_bli_package.bli_package_snapshots) == len(budget_line_item_ids)

@pytest.mark.usefixtures("app_ctx")
def test_approve_submission_invalid_budget_line_item_id(auth_client, loaded_db):
    # Test with an invalid budget line item ID
    submitter_id = ... # Set a valid submitter ID
    invalid_budget_line_item_id = 99999
    response = auth_client.post(
        url_for("api.approve-submission-list"),
        json={
            "submitter_id": submitter_id,
            "budget_line_item_ids": [invalid_budget_line_item_id]
        }
    )

    assert response.status_code == 400
    assert "does not exist" in response.json["message"]

@pytest.mark.usefixtures("app_ctx")
def test_approve_submission_db_error(auth_client, loaded_db):
    # Mock a database error
    with pytest.raises(SQLAlchemyError):
        auth_client.post(
            url_for("api.approve-submission-list"),
            json={
                "submitter_id": 99999,
                "budget_line_item_ids": [99998, 99999]
            }
        )
