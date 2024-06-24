import subprocess
from typing import List
from langchain_openai import AzureChatOpenAI
from prompts import create_git_rag_prompt
from utils import create_langchain

def commit_and_push_code(project_dir: str, message: str, llm: AzureChatOpenAI = None, user_prompts: List[str] = [], generate_msg: bool = False) -> None:
    """
    Commits and pushes the code in the project directory to GitHub.
    """
    chain = create_langchain(llm=llm, prompt=create_git_rag_prompt())

    if generate_msg:
        message = chain.invoke(
            {
                "context": '\n'.join(f"{i+1}. {string}" for i, string in enumerate(user_prompts)),
                "question": "Create the GitHub commit message based on the past user prompts.",
            }
        ).strip().lower()

    print(f"Commit message: {message}")
    print("Committing and pushing code to GitHub...")

    subprocess.run(["git", "add", "."], cwd=project_dir, check=True)
    subprocess.run(["git", "commit", "-m", message], cwd=project_dir, check=True)
    subprocess.run(["git", "push"], cwd=project_dir, check=True)

    print("Code committed and pushed to GitHub successfully! 🚀")

