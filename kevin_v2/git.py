import subprocess


def commit_and_push_code(project_dir: str, message: str) -> None:
    """
    Commits and pushes the code in the project directory to GitHub.
    """
    subprocess.run(["git", "add", "."], cwd=project_dir, shell=True)
    subprocess.run(["git", "commit", "-m", message], cwd=project_dir, shell=True)
    subprocess.run(["git", "push"], cwd=project_dir, shell=True)