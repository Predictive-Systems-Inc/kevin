import os
import chainlit as cl
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate

from code_gen import generate_code, generate_one_code, qa_generate_code
from rqmts_graph import get_requirements_bot
from probe_chain import ask_next_question

template = ChatPromptTemplate.from_messages([
    ("user", "{content}"),
])

rqmt_bot = get_requirements_bot()


@cl.on_chat_start
async def on_chat_start():
    await cl.sleep(1)

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
                     Hi! I'm Kevin 🤖, your programming assistant 💻. I can help build CRUD pages.
                     What is the model entity you want to work with?
                     """)
    await msg.send()

@cl.on_message
async def on_message(message: cl.Message):
    # Initiate the context variables with user_session variables
    requirements = cl.user_session.get("requirements")
    message_history = cl.user_session.get("message_history")
    # print("Input message:\n", input_message.content)

    # # append message to message_history
    message_history.append(message.content)

    # # Pass the requirements object to the bot when it is invoked
    # # send the last conversation message to the bot
    print('')
    print('')
    print('******** LAST TWO MESSAGES FOR PROMPTING **********')    
    print(message_history[-2:])
    async with cl.Step(name="Kevin as Systems Analyst") as parent_step:
        parent_step.input = "Analyzing answer..."        
        response = rqmt_bot.invoke(
            {"messages": message_history[-2:],
            "requirements": requirements},
        )
        parent_step.output = f"{message.content} is noted." # response.get("messages")[-1]

        # Update requirements in the session
        new_requirements = response.get("requirements")
        cl.user_session.set("requirements", new_requirements)
        
        print('******** REQUIREMENTS **********')
        print(requirements)
        # if requirements is Complete, ask the user to generate  the code
        if len(requirements['model']) > 0 and \
          len(requirements['fields']) > 0 and \
          len(requirements['folder_location']) > 0:
          files = await next_phase(new_requirements)
          await confirm_qa(files)
          return
        
    async with cl.Step(name="Kevin is probing...") as child_step:
        # # let's probe the user for the next question
        child_step.input = "Probing next question..."
        probe = ask_next_question(new_requirements, message_history)
        message_history.append(probe)
        child_step.output = probe

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
            content="Yes, now let's get to work. Generating code... 🚀",
        ).send()

        # # let's probe the user for the next question
        # for root, dirs, files in os.walk("templates/app/(protected)/cases"):
        #     for file in files:
        #         await cl.Message("").send()
        #         output_file = generate_one_code(requirements, os.path.join(root, file))
        #         # with open(os.path.join(root, file), "r") as f:
        #         #     templates[os.path.join(root, file)] = f.read()
        #         await cl.Message(f"Code generation successful for {output_file[0]}").send()

        await cl.Message("").send()
        
        files = generate_code(requirements)

        msg = cl.Message(content=f"""Code generation complete. 
                         The following files have been created. 
                         
                         {files}
                         
                         Thank you! 🎉""")
        await msg.send()

        return files
    
async def confirm_qa(files):
    message = f"""Would you like to check the code for syntax errors?"""

    res = await cl.AskActionMessage(
        content=message,
        actions=[
            cl.Action(name="continue", value="continue", label="✅ Yes!"),
            cl.Action(name="cancel", value="cancel", label="❌ No"),
        ],
    ).send()

    if res and res.get("value") == "continue":
        await cl.Message(
            content="Okay. Hang on, I'm running lint checks on the files... 🚀",
        ).send()

        await cl.Message("").send()
        files = qa_generate_code(files)

        msg = cl.Message(content=f"""QA cleanup has been completed. 
                         
                         {files}
                         
                         Thank you! 🎉""")
        await msg.send()

        return files

