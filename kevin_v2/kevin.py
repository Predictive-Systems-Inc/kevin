import os
from typing import Dict

from dotenv import load_dotenv
from git import commit_and_push_code
from linter import lint_and_fix
from utils import (
    create_langchain,
    create_llm,
    create_rag_prompt,
    extract_filename_and_code,
    get_context_data,
    get_output_directory,
    write_code_to_file,
)

load_dotenv()

def handle_user_input(
    chain: object,
    project_dir: str,
    output_dir: str,
    context_data: Dict[str, str],
) -> None:
    """
    Handles user input, generates code, and provides options for linting and pushing to GitHub.
    """
    user_input = input("Enter prompt (type 'bye' to exit): ")
    if user_input.lower() == 'bye':
        print("Goodbye!")
        return

    response = chain.invoke({"context": context_data['data'], "question": user_input})
    print(response)
    filename, code = extract_filename_and_code(response)

    print(f"Filename: {filename}")
    print(f"Code: \n{code}")

    file_path = write_code_to_file(directory=output_dir, filename=filename, code=code)

    while True:
        print("\nOptions:")
        print("1. Lint the file and apply fixes")
        print("2. Commit, and push to GitHub")
        print("n. Skip")
        choice = input("Enter choice: ")
        if choice == '1':
            result = lint_and_fix(
                        chain=chain, 
                        project_dir=project_dir, 
                        output_dir=output_dir, 
                        filename=filename, 
                        code=code, 
                        file_path=file_path, 
                        max_attempts=1
                      )
            
            if not result:
                break
            code = result
        elif choice == '2':
            commit_message = input("Enter commit message: ")
            commit_and_push_code(project_dir=project_dir, message=commit_message)
            break
        elif choice.lower() == 'n':
            break
        else:
            print("Invalid choice. Please try again.")

def main() -> None:
    project_dir = "D:\\Repositories\\brad"
    output_dir = get_output_directory()
    llm = create_llm(
        model="gpt-4o",
        api_version="2024-05-01-preview",
        azure_endpoint=f"{os.getenv('API_ENDPOINT')}openai/deployments/gpt-4o/chat/completions?api-version={os.getenv('API_VERSION')}",
    )
    context_data = get_context_data(path="kevin_v2/templates/routes")
    chain = create_langchain(llm=llm, prompt=create_rag_prompt())

    while True:
        handle_user_input(chain, project_dir, output_dir, context_data)

if __name__ == "__main__":
    main()