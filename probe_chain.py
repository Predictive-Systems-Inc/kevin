from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

def ask_next_question(requirements):
  template = """You are a systems analyst. Your task is to ask for the following information:
1. model: [model or entity name]
2. fields: [fields of the model]
3. folder_location: [folder location of the project]

below are the information you know

model: '{model}'
fields: '{fields}'
folder_location: '{folder_location}'

Ask one question with missing information in proper order.
"""
  openai_chat_model = ChatOpenAI(model="gpt-3.5-turbo")
  prompt = ChatPromptTemplate.from_template(template)
  print(prompt)
  chain = prompt | openai_chat_model | StrOutputParser()
  print(requirements)
  result = chain.invoke(requirements)
  print('ask_next_question:', result)
  return result