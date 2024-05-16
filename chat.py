from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import StrOutputParser
from langchain.schema.runnable import Runnable
from langchain.schema.runnable.config import RunnableConfig
from langchain.memory import ChatMessageHistory, ConversationBufferMemory
from langchain.chains import (ConversationalChain)

import chainlit as cl


@cl.on_chat_start
async def on_chat_start():
    model = ChatOpenAI(streaming=True)
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """
You are a systems analyst. Your task is to ask for the following information:
1. model: [model or entity name]
2. fields: [fields of the model]
3. folder_location: [folder location of the project]

Ask only one question at a time with missing information in proper order.
When finished, summarize the detail and proceed to code generation.
""",
            ),
            ("human", "{question}"),
        ]
    )
    message_history = ChatMessageHistory()

    memory = ConversationBufferMemory(
        memory_key="chat_history",
        output_key="answer",
        chat_memory=message_history,
        return_messages=True,
    )

    chain = ConversationalChain.from_llm(
        model,
        chain_type="stuff",
        memory=memory,
        prompt=prompt,
    )

    # runnable = prompt | model | StrOutputParser()
    cl.user_session.set("chain", chain)


@cl.on_message
async def on_message(message: cl.Message):
    chain = cl.user_session.get("chain")  # type: Runnable

    cb = cl.AsyncLangchainCallbackHandler()

    res = await chain.acall(message.content, callbacks=[cb])
    answer = res["answer"]
    await cl.Message(content=answer).send()
