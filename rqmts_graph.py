import json
import operator
from pprint import pprint
from typing import TypedDict, Annotated, Sequence

from langchain_core.messages import FunctionMessage, BaseMessage
from langchain_core.utils.function_calling import convert_to_openai_function
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolInvocation

from rqmts_tools import tool_box, tool_executor

llm_model = ChatOpenAI(
    model="gpt-4o",
    temperature=0,
)

state_update_model = llm_model.bind_functions(
    [convert_to_openai_function(t) for t in tool_box]
)

# In this case, the state of the graph consists of two variables:
# 'messages', and 'requirements'.
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    requirements: dict


def call_agent(state):
    """Invokes the agent.

    Args:
        state (messages): The current state

    Returns:
        dict: The updated state with the agent response appended to messages
    """

    messages = state['messages']
    # print("Messages sent to model for generation:\n")
    # pprint(messages)

    response = state_update_model.invoke(messages)
    # print("Response returned from state_update_model:\n", response)
    return {
        "messages": [response],
    }


def call_tools(state):
    """Invokes the tools."""
    last_message = state['messages'][-1]

    print("call_tools launched.")

    action = ToolInvocation(
        tool=last_message.additional_kwargs['function_call']['name'],
        tool_input=json.loads(
            last_message.additional_kwargs['function_call']['arguments'])
    )

    # Get the response from the tool execution...
    response = tool_executor.invoke(action)

    # ...and format the corresponding FunctionMessage, which will be added to
    # the message list.
    function_message = FunctionMessage(content=str(response), name=action.tool)
    print(function_message)

    if function_message.name == "update_requirement":
        # If requirements did not exist, it is created
        if state["requirements"] is None:
            state["requirements"] = {}

        if list(response.keys())[0] == 'fields':
            # Update the field as a list
            state["requirements"].update({list(response.keys())[0]: list(response.values())[0].split(",")})
        else:
            # Update requirements key with new value from response
            state["requirements"].update({list(response.keys())[0]: list(response.values())[0]})
        result = {"messages": [function_message], "requirements": state["requirements"]}
    elif function_message.name == "get_requirements":
        function_message.content = ("Here are the requirements: "
                                    + json.dumps(state["requirements"])
                                    + "\n")
        result = {"messages": [function_message]}
    else:
        result = {"messages": [function_message]}

    return result


def should_continue(state):
    """Determines if the agent should continue the conversation."""
    last_message = state['messages'][-1]

    if "function_call" not in last_message.additional_kwargs:
        return "end"

    return "continue"


def get_requirements_bot():
    workflow = StateGraph(AgentState)
    workflow.add_node("agent", call_agent)
    workflow.add_node("tools", call_tools)
    workflow.set_entry_point("agent")
    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {
            "continue": "tools",
            "end": END,
        }
    )
    workflow.add_edge("tools", "agent")
    state_update_bot = workflow.compile()
    return state_update_bot