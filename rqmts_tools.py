
from typing import Type

from langchain_core.tools import BaseTool
from langgraph.prebuilt import ToolExecutor
from pydantic import BaseModel, Field


class UpdateRequirementInput(BaseModel):
    variable_name: str = Field(
        description="The name of the requirement to update. "
                    "Name can be model, fields, or folder_location."
    )
    value: str = Field(description="The value to update the requirement with.")


class UpdateRequirement(BaseTool):
    """Agent tool that updates the requirement with the provided value. 
    Requirements can be model, fields, or folder_location."""
    name = "update_requirement"
    description = ("Useful when question about requirement has been answered. Requirements can be model, fields, or folder_location.")
    args_schema: Type[BaseModel] = UpdateRequirementInput

    def _run(self, variable_name: str, value: str, *args, **kwargs) -> dict:
        return {variable_name: value}

    def _arun(self):
        raise NotImplementedError("update_requirement does not support async.")


class GetRequirements(BaseTool):
    """Agent tool that retrieves the state variables."""
    name = "get_requirements"
    description = ("Useful when the user asks to retrieve the current requirements."
                   "Also useful to provide you with information that you don't have access to.")

    def _run(self, *args, **kwargs) -> dict:
        return {"instructions": "Display the state variables."}

    def _arun(self):
        raise NotImplementedError("get_requirements does not support async.")


tool_box = [UpdateRequirement()]
tool_executor = ToolExecutor(tool_box)