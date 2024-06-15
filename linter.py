import subprocess
from typing import Tuple

from langchain_openai import AzureChatOpenAI

from prompts import create_error_fetcher_rag_prompt, create_error_fixer_rag_prompt
from utils import create_langchain, extract_code, write_code_to_file

def lint_file(project_dir: str) -> str:
    """
    Runs the lint command on the specified file and returns the lint output.
    """
    lint_result = subprocess.run(
        ["pnpm", "lint"],
        cwd=project_dir,
        shell=True,
        stdout=subprocess.PIPE,
        text=True,
    )
    # print(lint_result.stdout)
    return lint_result.stdout

def get_errors(lint_output: str, file_path: str, llm: AzureChatOpenAI) -> str:
    """
    Invokes the chain to get the corresponding lint warnings/errors for the given file.
    """
    chain = create_langchain(llm=llm, prompt=create_error_fetcher_rag_prompt())
    response = chain.invoke(
        {
            "context": lint_output,
            "question": f"Get the corresponding lint warning/errors for the file in {file_path} in the given lint results.",
        }
    )
    # print(response)
    return response

def fix_errors(code: str, errors: str, llm: AzureChatOpenAI) -> Tuple[str, str]:
    """
    Invokes the chain to fix the given errors in the code and returns the fixed code and response.
    """
    chain = create_langchain(llm=llm, prompt=create_error_fixer_rag_prompt())
    response = chain.invoke(
        {
            "context": code,
            "question": f"Fix the errors/warnings: {errors} in the given code.",
        }
    )
    # print(response)
    fixed_code = extract_code(response)
    return fixed_code

def lint_and_fix(
    llm: AzureChatOpenAI,
    project_dir: str,
    code: str,
    file_path: str,
    max_attempts: int = 3,
) -> str:
    """
    Lints the given code, fixes the errors, and writes the fixed code to a file.
    Returns the fixed code or the original code if no errors were found or the errors could not be fixed.
    """
    for attempt in range(max_attempts):
      print(f"Linting attempt {attempt + 1}...")
      lint_output = lint_file(project_dir=project_dir)
      print("Linting complete. Getting errors...")
      errors = get_errors(lint_output=lint_output, file_path=file_path, llm=llm)
      print(errors)

      if errors == "No errors found." or errors == "I don't know.":
          print("No errors found. Skipping fix.")
          print("Updated code...")
          write_code_to_file(file_path=file_path, code=code)
          return code

      print("Fixing errors...")
      code = fix_errors(code=code, errors=errors, llm=llm)
      print("Updated code...")
      write_code_to_file(file_path=file_path, code=code)
    
    return code