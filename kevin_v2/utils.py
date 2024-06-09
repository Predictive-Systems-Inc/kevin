import os
import re
from operator import itemgetter
from pathlib import Path
from typing import List, Tuple

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

    You are a helpful assistant knowledgeable in NextJS and Prisma. Use the available context to answer the question.

    If the task requires generating code, respond immediately in the following format:
    Filename: [inster actual filename here, file name and extension only, always exclude path and unnecessary symbols, strictly e.g. index.tsx or index.ts or schema.prisma]
    Code: [insert actual code here]

    If the task requires modifying a specific file, respond immediately in the following format:
    Code: [insert actual code here]

    If the task requires fixing a given code based on a given list of errors, respond immediately in the following format:
    Code: [insert actual code here]

    If the task requires getting the lint warnings/errors for a specific file in a given set of errors/warnings, respond immediately in the following format:
    Errors: [insert actual errors here]
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
            return None

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
    code_pattern = re.compile(r"Code:\s*```(?:[a-z]*)\n([\s\S]*?)```", re.MULTILINE)

    filename_match = filename_pattern.search(data)
    code_match = code_pattern.search(data)

    if filename_match:
        filename = re.sub(r'[^a-zA-Z0-9\.-]', '', filename_match.group(1)).strip()
    else:
        filename = 'unknown_filename'

    if code_match:
        code = code_match.group(1).strip()
    else:
        code = ''

    # print(f"Extracted filename: {filename}")
    # print(f"Extracted code: {code}")
    return filename, code

def write_code_to_file(file_path: str, code: str) -> str:
    """
    Writes the provided code to the specified file path, overwriting it if it exists.
    """
    if not file_path or not code:
        raise ValueError("File path or code not provided")

    path = Path(file_path)
    os.makedirs(path.parent, exist_ok=True)
    path.write_text(code)
    print(f"Code written to {path}")

    return str(file_path)

def get_all_files(directory):
    path = Path(directory)

    if not path.exists() or not path.is_dir():
        print("Invalid location.")
        return []

    valid_extensions = {'.tsx', '.ts', '.prisma'}
    excluded_folders = {'node_modules', '.next'}
    
    return [
        str(file) for file in path.rglob('*')
        if file.is_file() and 
           file.suffix in valid_extensions and 
           not any(excluded_folder in file.parts for excluded_folder in excluded_folders)
    ]

def get_matching_files(files: List[str], search_input: str) -> List[str]:
    """
    Filters the list of files to return those that match or contain the search input.
    """
    return [file for file in files if search_input.lower() in file.lower()]
