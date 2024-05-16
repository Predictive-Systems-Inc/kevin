from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

def ask_next_question(requirements, history):
  template = """You are a helpful systems analyst. Your task is to ask for the following information:
1. model: [model or entity name]
2. fields: [fields of the model]
3. folder_location: [folder location to generate the code]

below are the information you know

model: '{model}'
fields: '{fields}'
folder_location: '{folder_location}'

For reference, below is the message history: 
{message_history}

Recognize last action in message_history, 
then ask one question with missing information in proper order. 
Use emoji to make the conversation more engaging.

"""
  openai_chat_model = ChatOpenAI(model="gpt-3.5-turbo")
  prompt = ChatPromptTemplate.from_template(template)
  chain = prompt | openai_chat_model | StrOutputParser()
  requirements['message_history'] = '\n'.join(history[-2:])
  result = chain.invoke(requirements)
  print('ask_next_question:', result)  
  return result