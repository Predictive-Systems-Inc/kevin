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
    command = 'cls' if platform.system() == "Windows" else 'clear'
    os.system(command)

def handle_user_input(chain: object, context: str, input_prompt: str, extra_instructions: str = '') -> Tuple[Optional[str], Optional[str]]:
    user_input = input(input_prompt)
    if user_input.lower() == 'bye':
        return None, None
    user_inputs.append(user_input)
    response = chain.invoke({"context": context, "question": extra_instructions + user_input})
    return extract_filename_and_code(response)

def display_options(options: List[str]) -> str:
    print("\nOptions:")
    for idx, option in enumerate(options, start=1):
        print(f"{idx}. {option}")
    return input("Enter choice: ")

def generate_code(llm: AzureChatOpenAI, chain: object, project_dir: str, output_dir: str, context_data: Dict[str, str]) -> None:
    while True:
        filename, code = handle_user_input(chain, context_data['data'], "Enter prompt (type 'bye' to go back): ")
        if not filename:
            return
        file_path = write_code_to_file(file_path=str(Path(output_dir) / filename), code=code)
        result = lint_and_fix(chain=chain, project_dir=project_dir, code=code, file_path=file_path, max_attempts=1)
        if not result:
            print('Failed to lint and fix code. Please try again.')
            continue
        
        while True:
            choice = display_options(["Commit, and push to GitHub", "Back"])
            if choice == '1':
                commit_and_push_code(project_dir=project_dir, message='', llm=llm, user_prompts=user_inputs, generate_msg=True)
            elif choice == '2':
                break
            else:
                print("Invalid choice. Please try again.")

def edit_existing_code(llm: AzureChatOpenAI, chain: object, project_dir: str) -> None:
    print(f'\nFetching files from {project_dir}...')
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
        if not result:
            print('Failed to lint and fix code. Please try again.')

        while True:
            choice = display_options(["Revert changes", "Commit, and push to GitHub", "Back"])
            if choice == '1':
                print('Reverting changes...')
                with open(selected_file, 'w') as file:
                    file.write(file_contents)
                print('Changes reverted.')
            elif choice == '2':
                commit_and_push_code(project_dir=project_dir, message='', llm=llm, user_prompts=user_inputs, generate_msg=True)
            elif choice == '3':
                break
            else:
                print("Invalid choice. Please try again.")

def main() -> None:
    llm = create_llm(
        model="gpt-4o",
        api_version="2024-05-01-preview",
        azure_endpoint=f"{os.getenv('API_ENDPOINT')}openai/deployments/gpt-4o/chat/completions?api-version={os.getenv('API_VERSION')}",
    )
    chain = create_langchain(llm=llm, prompt=create_rag_prompt())
    project_dir = os.getenv('LINT_DIRECTORY')

    while True:
        user_inputs.clear()
        choice = display_options([
            "Generate Prisma Schema", 
            "Generate API Route", 
            "Generate API Route with Filters", 
            "Generate UI", 
            "Edit existing code", 
            "Exit"
        ])
        
        if choice == '1':
            output_dir = get_output_directory()
            if output_dir:
                context_data = get_context_data(path="./templates/prisma-schemas")
                generate_code(llm, chain, project_dir, output_dir, context_data)
        elif choice == '2':
            output_dir = get_output_directory()
            if output_dir:
                context_data = get_context_data(path="./templates/route")
                generate_code(llm, chain, project_dir, output_dir, context_data)
        elif choice == '3':
            output_dir = get_output_directory()
            if output_dir:
                context_data = get_context_data(path="./templates/route-filters")
                generate_code(llm, chain, project_dir, output_dir, context_data)
        elif choice == '4':
            output_dir = get_output_directory()
            if output_dir:
                context_data = get_context_data(path="./templates/table-ui")
                generate_code(llm, chain, project_dir, output_dir, context_data)
        elif choice == '5':
            edit_existing_code(llm, chain, project_dir)
        elif choice == '6':
            print('Goodbye!')
            break
        else:
            print('Invalid choice. Please try again.')

if __name__ == "__main__":
    main()
