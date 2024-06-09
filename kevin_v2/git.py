import subprocess
from typing import List
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import AzureChatOpenAI
from utils import (
    create_langchain,
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

    You are a helpful assistant knowledgeable in writing GitHub commit messages based on the context. Use the available context to answer the question.

    Generate a GitHub commit message based on the actions provided. Each action corresponds to a specific commit type. Here are the possible commit types:
    - feat: a new feature
    - fix: a bug fix
    - chore: other changes that don't modify src or test files
    - docs: documentation only changes
    - style: changes that do not affect the meaning of the code
    - refactor: a code change that neither fixes a bug nor adds a feature
    - perf: a code change that improves performance
    - test: adding missing tests or correcting existing tests
    - build: changes that affect the build system or external dependencies
    - ci: changes to our CI configuration files and scripts
    - revert: reverts a previous commit
    - deprecate: deprecates a feature
    - remove: changes that removes a feature after being deprecated
    - security: changes that improves or resolves a security issue

    Respond immediately with the following format:
    commit_type: commit_message
    """

    return ChatPromptTemplate.from_template(RAG_PROMPT + instructions)

def commit_and_push_code(project_dir: str, message: str, llm: AzureChatOpenAI = None, user_prompts: List[str] = [], generate_msg: bool = False) -> None:
    """
    Commits and pushes the code in the project directory to GitHub.
    """
    chain = create_langchain(llm=llm, prompt=create_rag_prompt())

    if generate_msg:
        message = chain.invoke(
            {
                "context": '\n'.join(f"{i+1}. {string}" for i, string in enumerate(user_prompts)),
                "question": "Create the GitHub commit message based on the past user prompts.",
            }
        )
 
    print(f"Commit message: {message.strip().lower()}")
    subprocess.run(["git", "add", "."], cwd=project_dir, shell=True, stdout=subprocess.PIPE, text=True)
    subprocess.run(["git", "commit", "-m", message.strip().lower()], cwd=project_dir, stdout=subprocess.PIPE, shell=True, text=True)
    # subprocess.run(["git", "push"], cwd=project_dir, shell=True)