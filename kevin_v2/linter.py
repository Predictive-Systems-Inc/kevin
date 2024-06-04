import subprocess
from typing import Tuple

from utils import extract_filename_and_code, write_code_to_file

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
    return lint_result.stdout

def get_errors(lint_output: str, file_path: str, chain: object) -> str:
    """
    Invokes the chain to get the corresponding lint warnings/errors for the given file.
    """
    return chain.invoke(
        {
            "context": lint_output,
            "question": f"Get the corresponding lint warning/errors for the file in {file_path} in the given lint results.",
        }
    )

def fix_errors(code: str, errors: str, chain: object) -> Tuple[str, str]:
    """
    Invokes the chain to fix the given errors in the code and returns the fixed code and response.
    """
    fixed_response = chain.invoke(
        {
            "context": code,
            "question": f"Fix the errors/warnings: {errors} in the given code.",
        }
    )
    _, fixed_code = extract_filename_and_code(fixed_response)
    return fixed_code, fixed_response

def lint_and_fix(
    chain: object,
    project_dir: str,
    output_dir: str,
    filename: str,
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
      errors = get_errors(lint_output=lint_output, file_path=file_path, chain=chain)
      print(errors)

      if errors == "No errors found.":
          print("No errors found. Skipping fix.")
          break

      print("Fixing errors...")
      code, _ = fix_errors(code=code, errors=errors, chain=chain)
      print("Updated code...")
      write_code_to_file(output_dir=output_dir, filename=filename, code=code)
    
    return code