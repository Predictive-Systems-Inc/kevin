import json
import os
from pathlib import Path
import platform
from typing import Dict, List, Optional, Tuple

from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from git import commit_and_push_code
from linter import lint_and_fix
from prompts import (
    create_directory_fetcher_rag_prompt, 
    create_editing_rag_prompt, 
    create_form_rag_prompt, 
    create_prisma_rag_prompt,
    create_route_rag_prompt,
    )
from utils import (
    append_to_path,
    combine_structure_to_string,
    create_langchain,
    create_llm,
    extract_code,
    get_all_files,
    get_context_data,
    get_matching_files,
    get_output_directory,
    list_all_subdirectories_and_files,
    write_code_to_file,
)

load_dotenv()
user_inputs = []

def clear_console():
    command = 'cls' if platform.system() == "Windows" else 'clear'
    os.system(command)

def handle_user_input(llm: AzureChatOpenAI, context: str, input_prompt: str) -> Tuple[Optional[str], Optional[str]]:
    user_input = input(input_prompt)
    if user_input.lower() == 'bye':
        return None, None
    user_inputs.append(user_input)
    chain = create_langchain(llm=llm, prompt=create_editing_rag_prompt())
    response = chain.invoke({"context": context, "question": "Modify the given code based on the following instructions: " + user_input})
    return extract_code(response)

def display_options(options: List[str]) -> str:
    print("\nOptions:")
    for idx, option in enumerate(options, start=1):
        print(f"{idx}. {option}")
    return input("Enter choice: ")

def generate_code_using_definition_file(llm: AzureChatOpenAI, chain: object, project_dir: str, output_dir: str, context_data: Dict[str, str], definition_file: str) -> None:
    response = chain.invoke({"context": context_data['data'], "question": f"Generate code based on the following definition file: {definition_file}"})
    # print(response)
    
    code =  extract_code(response)
    file_path = write_code_to_file(file_path=str(Path(output_dir) / definition_file['file_name']), code=code)
    result = lint_and_fix(llm=llm, project_dir=project_dir, code=code, file_path=file_path, max_attempts=1)

    if not result:
        print('Failed to lint and fix code. Please try again.')
        return
    
    user_inputs.append(f'generated {definition_file["file_name"]}')
    while True:
        choice = display_options(["Edit code", "Commit, and push to GitHub", "Back"])
        if choice == '1':
            code = handle_user_input(llm, result, "Enter edit prompt (type 'bye' to go back): ")
            print('Kevin is processing your request...  🤖\n')
            if not code:
                print('Kevin returned a malformed response. Please try again.')
                break
            result = lint_and_fix(llm=llm, project_dir=project_dir, code=code, file_path=file_path, max_attempts=1)
            if not result:
                print('Failed to lint and fix code. Please try again.')
        elif choice == '2':
            commit_and_push_code(project_dir=project_dir, message='', llm=llm, user_prompts=user_inputs, generate_msg=True)
        elif choice == '3':
            break
        else:
            print("Invalid choice. Please try again.")

def edit_existing_code(llm: AzureChatOpenAI, chain: object, project_dir: str) -> None:
    print(f'\nFetching files from {project_dir}...')
    files = get_all_files(project_dir)
    # print(files)
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

    # print(file_contents)
    while True:
        code = handle_user_input(llm, file_contents, "Enter edit prompt (type 'bye' to go back): ")
        print('Kevin is processing your request...  🤖\n')
        if not code:
            return
        result = lint_and_fix(llm=llm, project_dir=project_dir, code=code, file_path=selected_file, max_attempts=1)
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

    project_dir = os.getenv('PROJ_DIR')
    directories_and_files = list_all_subdirectories_and_files(project_dir)

    while True:
        user_inputs.clear()
        choice = display_options([
            "Generate Prisma Schema Model", 
            "Generate API Route", 
            "Generate API Route with Filters", 
            "Generate Table UI", 
            "Generate Form UI",
            "Edit existing code", 
            "Exit"
        ])
        
        if choice == '1':
            with open('./definition-file.json', 'r') as file:
              definition_file = json.load(file)

            output_dir = append_to_path(project_dir, ['packages', 'db-prisma'])
            if output_dir:
                context_data = get_context_data(paths=["./templates/prisma-schemas", append_to_path(output_dir, ['schema.prisma'])])
                chain = create_langchain(llm=llm, prompt=create_prisma_rag_prompt())
                print('\nKevin is generating the code...  🤖\n')
                generate_code_using_definition_file(llm, chain, project_dir, output_dir, context_data, definition_file)
        elif choice == '2':
            with open('./definition-file.json', 'r') as file:
              definition_file = json.load(file)
            directory_chain = create_langchain(llm=llm, prompt=create_directory_fetcher_rag_prompt())
            response = directory_chain.invoke(
                {"context": combine_structure_to_string(directories_and_files), 
                 "question": f"Choose the directory to save {definition_file["file_name"]} for the model {definition_file["model_name"]}."})
            output_dir = append_to_path(project_dir, [response.split(' ')[1]])

            if output_dir:
                context_data = get_context_data(paths=["./templates/route", append_to_path(project_dir, ['packages', 'db-prisma', 'schema.prisma'])])
                chain = create_langchain(llm=llm, prompt=create_route_rag_prompt())
                print('\nKevin is generating the code...  🤖\n')
                generate_code_using_definition_file(llm, chain, project_dir, output_dir, context_data, definition_file)
        elif choice == '3':
            output_dir = get_output_directory()
            if output_dir:
                context_data = get_context_data(path="./templates/route-filters")
                # generate_code(llm, chain, project_dir, output_dir, context_data)
        elif choice == '4':
            output_dir = get_output_directory()
            if output_dir:
                context_data = get_context_data(path="./templates/table-ui")
                # generate_code(llm, chain, project_dir, output_dir, context_data)
        elif choice == '5':
            with open('./definition-file.json', 'r') as file:
              definition_file = json.load(file)
            directory_chain = create_langchain(llm=llm, prompt=create_directory_fetcher_rag_prompt())
            response = directory_chain.invoke({"context": combine_structure_to_string(directories_and_files), "question": f"Choose the directory to save {definition_file["file_name"]}."})
            output_dir = append_to_path(project_dir, [response.split(' ')[1]])

            if output_dir:
                context_data = get_context_data(paths=["./templates/forms", append_to_path(project_dir, ['packages', 'db-prisma', 'schema.prisma'])])
                chain = create_langchain(llm=llm, prompt=create_form_rag_prompt())
                print('\nKevin is generating the code...  🤖\n')
                generate_code_using_definition_file(llm, chain, project_dir, output_dir, context_data, definition_file)
        elif choice == '6':
            edit_existing_code(llm, chain, project_dir)
        elif choice == '7':
            print('Goodbye!')
            break
        else:
            print('Invalid choice. Please try again.')

if __name__ == "__main__":
    main()
