import os
from pathlib import Path
import platform
from typing import Dict, List, Optional, Tuple

from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from git import commit_and_push_code
from linter import lint_and_fix
from utils import (
    create_langchain,
    create_llm,
    create_rag_prompt,
    extract_filename_and_code,
    get_all_files,
    get_context_data,
    get_matching_files,
    get_output_directory,
    write_code_to_file,
)

load_dotenv()

user_inputs = []

def clear_console():
    if platform.system() == "Windows":
        os.system('cls')
    else:
        os.system('clear')

def handle_user_input(chain: object, context: str, input_prompt: str, extra_instructions: str = '') -> Tuple[Optional[str], Optional[str]]:
    """
    Handles user input and invokes the chain with the provided context and instructions.
    """
    user_input = input(input_prompt)
    if user_input.lower() == 'bye':
        return None, None
    user_inputs.append(user_input)
    response = chain.invoke({"context": context, "question": extra_instructions + user_input})
    # print(response)
    return extract_filename_and_code(response)

def display_options(options: List[str]) -> str:
    """
    Displays a list of options and prompts the user to make a choice.
    """
    print("\nOptions:")
    for idx, option in enumerate(options, start=1):
        print(f"{idx}. {option}")
    return input("Enter choice: ")

def generate_code(llm: AzureChatOpenAI, chain: object, project_dir: str, output_dir: str, context_data: Dict[str, str]) -> None:
    """
    Handles user input, generates code, and provides options for linting and pushing to GitHub.
    """
    while True:
      filename, code = handle_user_input(chain, context_data['data'], "Enter prompt (type 'bye' to go back): ")
      if not filename:
          return
      # print(f"Filename: {filename}\nCode: \n{code}")
      file_path = write_code_to_file(file_path=str(Path(output_dir) / filename), code=code)
      
      while True:
          choice = display_options(["Lint the file and apply fixes", "Commit, and push to GitHub", "Back"])
          if choice == '1':
              result = lint_and_fix(chain=chain, project_dir=project_dir, code=code, file_path=file_path, max_attempts=1)
              if result:
                  code = result
          elif choice == '2':
              # commit_message = input("Enter commit message: ")
              # commit_and_push_code(project_dir=project_dir, message=commit_message)
              commit_and_push_code(project_dir=project_dir, message='', llm=llm, user_prompts=user_inputs, generate_msg=True)
          elif choice == '3':
              break
          else:
              print("Invalid choice. Please try again.")

def edit_existing_code(llm : AzureChatOpenAI, chain: object, project_dir: str) -> None:
    """
    Allows the user to edit existing code files by searching for and selecting a file,
    modifying its contents, and optionally committing the changes.
    """
    print('\nFetching files...')
    files = get_all_files(project_dir)
    if not files:
        print('No files found in the project directory. Please check the path and try again.')
        return
    print('Files fetched.')

    search_input = input('\nSearch for a file to edit: ')
    matching_files = get_matching_files(files, search_input)
    if not matching_files:
        print('No files found matching the search input.')
        return

    print('\nMatching files:')
    for i, file in enumerate(matching_files):
        print(f"{i + 1}. {file}")

    selected_file_index = input('\nSelect a file to edit: ')
    if not selected_file_index.isdigit() or int(selected_file_index) < 1 or int(selected_file_index) > len(matching_files):
        print('Invalid file index.')
        return

    selected_file = matching_files[int(selected_file_index) - 1]
    with open(selected_file, 'r') as file:
        file_contents = file.read()

    while True:
      _, code = handle_user_input(chain, file_contents, "Enter prompt (type 'bye' to go back): ", "Modify the given code based on the following instructions: ")
      if not code:
          return
      result = lint_and_fix(chain=chain, project_dir=project_dir, code=code, file_path=selected_file, max_attempts=1)
      if result:
          code = result
          print('Writing code to file...')
          write_code_to_file(file_path=selected_file, code=code)
          print('Code written to file.')
          while True:
              choice = display_options(["Revert changes", "Commit, and push to GitHub", "Back"])
              if choice == '1':
                  print('Reverting changes...')
                  with open(selected_file, 'w') as file:
                      file.write(file_contents)
                  print('Changes reverted.')
                  break
              elif choice == '2':
                  # commit_message = input('\nEnter commit message: ')
                  # commit_and_push_code(project_dir=project_dir, message=commit_message)
                  commit_and_push_code(project_dir=project_dir, message='', llm=llm, user_prompts=user_inputs, generate_msg=True)
                  break
              elif choice == '3':
                  break
              else:
                    print("Invalid choice. Please try again.")

def main() -> None:
    """
    Main function to initialize the language model and chain, and provide options to the user
    for generating or editing code.
    """
    llm = create_llm(
        model="gpt-4o",
        api_version="2024-05-01-preview",
        azure_endpoint=f"{os.getenv('API_ENDPOINT')}openai/deployments/gpt-4o/chat/completions?api-version={os.getenv('API_VERSION')}",
    )
    chain = create_langchain(llm=llm, prompt=create_rag_prompt())

    while True:
        clear_console()
        user_inputs.clear()
        choice = display_options(["Generate code", "Edit existing code", "Exit"])
        if choice == '1':
            project_dir = "D:\\Repositories\\brad"
            output_dir = get_output_directory()
            if not output_dir:
                continue
            context_data = get_context_data(path="templates/routes")
            generate_code(llm, chain, project_dir, output_dir, context_data)
        elif choice == '2':
            project_dir = input('\nEnter project directory: ')
            edit_existing_code(llm, chain, project_dir)
        elif choice == '3':
            print('Goodbye!')
            break
        else:
            print('Invalid choice. Please try again.')
        

if __name__ == "__main__":
    main()
