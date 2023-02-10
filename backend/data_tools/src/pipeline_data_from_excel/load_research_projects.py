import logging
import sys

import luigi
from data_tools.src.pipeline_data_from_excel.extract_excel_load_table import ExtractExcelLoadTable
from data_tools.src.pipeline_data_from_excel.load_research_projects_business_rules import (
    LoadResearchProjectsBusinessRules,
)
from data_tools.src.pipeline_data_from_excel.ops_task import OPSTask
from models import *
from sqlalchemy.future import select
from sqlalchemy.orm import Session


class LoadResearchProjects(OPSTask):
    run_date = luigi.DateSecondParameter()
    task_meta = {"log_messages": []}
    _task_complete = False

    def __init__(self, run_date):
        super().__init__(run_date)

    def _log_message(self, message):
        logger = logging.getLogger("luigi-interface")
        logger.info(message)
        self.task_meta["log_messages"].append(message)

    def complete(self):
        return self._task_complete

    def requires(self):
        return ExtractExcelLoadTable(self.run_date)

    def run(self):
        self._log_message("Running --> LoadResearchProjects")
        self._log_message("Creating All Tables...")
        BaseModel.metadata.create_all(self._engine)
        self._log_message("...Tables created.")

        with Session(self._engine) as session, session.begin():
            all_budget_current = session.scalars(
                select(AllBudgetCurrent)
                .where(AllBudgetCurrent.Project_Title != "Placeholder")
                .where(AllBudgetCurrent.Project_Title != "OPRE")
            ).all()
            self._log_message(f"{len(all_budget_current)} Records to Process")

            all_research_projects = session.scalars(select(ResearchProject)).all()
            self._log_message(f"{len(all_research_projects)} Current Research Projects")

            research_projects_to_create = (
                LoadResearchProjectsBusinessRules.apply_business_rules(
                    all_budget_current, all_research_projects
                )
            )
            self._log_message(
                f"{len(research_projects_to_create)} New Research Projects"
            )

            session.add_all(research_projects_to_create)

        self._log_message("LoadResearchProjects --> COMPLETE")
        self._task_complete = True


if __name__ == "__main__":
    from dateutil import parser

    run_date_from_cmd = parser.parse(sys.argv[2])

    luigi.build([LoadResearchProjects(run_date_from_cmd)], local_scheduler=True)
