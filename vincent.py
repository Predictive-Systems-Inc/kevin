import chainlit as cl
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate

from code_gen import generate_code
from rqmts_graph import get_requirements_bot
from probe_chain import ask_next_question

template = ChatPromptTemplate.from_messages([
    ("user", "{content}"),
])

rqmt_bot = get_requirements_bot()


@cl.on_chat_start
async def on_chat_start():
    # Set up the user session
    initial_message = "What is the model entity you want to work with?"
    cl.user_session.set("runnable", rqmt_bot)
    cl.user_session.set(
        "requirements",
        {"model": "", "fields": [], "folder_location": "" },
    )
    cl.user_session.set(
        "message_history",
        [initial_message]
    )
    msg = cl.Message(content="""
                     Hi! I'm Kevin, your programming assistant. 
                     I can help build CRUD pages.
                     What is the model entity you want to work with?
                     """)
    await msg.send()

@cl.on_message
async def on_message(message: cl.Message):
    # Initiate the context variables with user_session variables
    requirements = cl.user_session.get("requirements")
    message_history = cl.user_session.get("message_history")
    input_message = HumanMessage(content=message.content)
    # print("Input message:\n", input_message.content)

    # # append input_message to message_history
    message_history.append(input_message.content)

    # # Pass the requirements object to the bot when it is invoked
    # # send the last conversation message to the bot
    # print(message_history[-2:])
    response = rqmt_bot.invoke(
        {"messages": message_history[-2:],
         "requirements": requirements},
    )

    # # Update requirements in the session
    new_requirements = response.get("requirements")
    cl.user_session.set("requirements", new_requirements)
    cl.user_session.set("message_history", response.get("messages"))

    # print("Session requirements: ", cl.user_session.get("requirements"))

    # # Send the tool response to the user
    await cl.Message(
        content=response["messages"][-1].content).send()
    
    # if requirements is Complete, ask the user to generate  the code
    if len(requirements['model']) > 0 and \
       len(requirements['fields']) > 0 and \
       len(requirements['folder_location']) > 0:
      await next_phase(new_requirements)
      return
  
    # # let's probe the user for the next question
    probe = ask_next_question(new_requirements)

    # Send the probe to the user
    await cl.Message(content=probe).send()

    
async def next_phase(requirements):
    message = f"""Your requirements are complete. Do you want to generate the code?
    Model: {requirements['model']}
    Fields: {requirements['fields']}
    Folder Location: {requirements['folder_location']}"""

    res = await cl.AskActionMessage(
        content=message,
        actions=[
            cl.Action(name="continue", value="continue", label="✅ Yes!"),
            cl.Action(name="cancel", value="cancel", label="❌ No"),
        ],
    ).send()

    if res and res.get("value") == "continue":
        await cl.Message(
            content="Yes!",
        ).send()
        await generate_code(requirements)
        return "end"

