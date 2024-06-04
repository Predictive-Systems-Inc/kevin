import os
import re
import sys
from functools import partial
from operator import itemgetter
from pathlib import Path
from typing import Tuple

from langchain.schema.output_parser import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import AzureChatOpenAI

def create_llm(model: str, api_version: str, azure_endpoint: str) -> AzureChatOpenAI:
    """
    Creates an instance of AzureChatOpenAI with the provided model, API version, and Azure endpoint.
    """
    return AzureChatOpenAI(
        model=model,
        api_key=os.getenv("API_KEY"),
        api_version=api_version,
        azure_endpoint=azure_endpoint
    )

def create_rag_prompt(instructions: str = '') -> ChatPromptTemplate:
    """
    Creates a ChatPromptTemplate for the RAG (Retrieval-Augmented Generation) assistant.
    """
    RAG_PROMPT = """
    CONTEXT:
    {context}

    QUERY:
    {question}

    You are a helpful assistant knowledgeable in NextJS and Prisma. Use the available context to answer the question. If you can't answer the question, say you don't know.

    If the task requires generating code, respond immediately in the following format:
    Filename: [file name and extension only, always exclude path and unnecessary symbols, e.g. index.tsx or index.ts]
    Code: [code]

    If the task requires getting the lint warnings/errors for a specific file, respond immediately in the following format:
    Errors: [errors]
    Commit message: [commit message eg. "feat: added reimbursement api route"]
    However, if there are no errors, respond with "No errors found."
    """

    return ChatPromptTemplate.from_template(RAG_PROMPT + instructions)

def get_context_data(path: str) -> dict[str, str]:
    """
    Reads all files in the specified directory and returns their content as a dictionary.
    """
    directory_path = Path(path)

    if not directory_path.exists() or not directory_path.is_dir():
        raise ValueError(f"Invalid directory: {directory_path}")

    data = {'data': ''}

    for file_path in directory_path.glob('*'):
        content = file_path.read_text()
        print(f"Reading file: {file_path}")
        data['data'] += (f"Example for {file_path.stem.upper()}:\n{content}\n")

    return data

def create_langchain(llm: AzureChatOpenAI, prompt: ChatPromptTemplate):
    """
    Creates a LangChain instance with the provided LLM and prompt.
    """
    return (
        {"context": itemgetter("context"), "question": itemgetter("question")}
        | prompt | llm | StrOutputParser()
    )

def get_output_directory() -> str:
    """
    Prompts the user to enter an output directory and validates the input.
    """
    while True:
        output_dir = input("Enter output directory (type 'bye' to exit): ")
        if output_dir.lower() == 'bye':
            print("Goodbye!")
            sys.exit()

        output_dir_path = Path(output_dir)
        if not output_dir_path.exists() or not output_dir_path.is_dir():
            print("Invalid location.")
        else:
            return output_dir

def extract_filename_and_code(data: str) -> Tuple[str, str]:
    """
    Extracts the filename and code from the provided data.
    Cleans the filename by removing special characters except for the dot.
    """
    filename_pattern = re.compile(r"Filename:\s*(.+)")
    code_pattern = re.compile(r"Code:\s*```([\s\S]*?)```", re.MULTILINE)

    filename_match = filename_pattern.search(data)
    code_match = code_pattern.search(data)

    if not filename_match or not code_match:
        return '', ''

    filename = re.sub(r'[^a-zA-Z0-9\.]', '', filename_match.group(1)).strip()
    code = code_match.group(1).strip()

    return filename, code

def write_code_to_file(directory: str, filename: str, code: str) -> str:
    """
    Writes the provided code to a file in the specified directory.
    """
    if not filename or not code:
        raise ValueError("Filename or code not provided")

    os.makedirs(directory, exist_ok=True)
    file_path = Path(directory) / filename
    file_path.write_text(code)
    print(f"Code written to {file_path}")

    return str(file_path)