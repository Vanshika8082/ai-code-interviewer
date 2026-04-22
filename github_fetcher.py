from github import Github
import os
from dotenv import load_dotenv
import json

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

if GITHUB_TOKEN:
    g = Github(GITHUB_TOKEN)
else:
    g = Github()


VALID_EXTENSIONS = (
    ".py",
    ".js",
    ".ts",
    ".java",
    ".cpp",
    ".html",
    ".css",
    ".ipynb"
)

IGNORE_FOLDERS = [
    "node_modules",
    ".git",
    "dist",
    "build",
    "__pycache__"
]


def extract_ipynb_code(content):
    """
    Extract only code cells from Jupyter notebook JSON.
    """
    try:
        notebook = json.loads(content)
        code_cells = []

        for cell in notebook.get("cells", []):
            if cell.get("cell_type") == "code":
                code_cells.append("".join(cell.get("source", [])))

        return "\n\n".join(code_cells)

    except Exception:
        return ""


def fetch_repo_files(repo_url):
    """
    Fetch all relevant code files from a GitHub repository.
    """

    parts = repo_url.strip().split("/")
    owner = parts[-2]
    repo_name = parts[-1]

    repo = g.get_repo(f"{owner}/{repo_name}")

    contents = repo.get_contents("")
    files_data = []

    while contents:
        file_content = contents.pop(0)

        # Ignore unwanted folders
        if any(folder in file_content.path for folder in IGNORE_FOLDERS):
            continue

        if file_content.type == "dir":
            contents.extend(repo.get_contents(file_content.path))

        elif file_content.type == "file":

            if file_content.name.endswith(VALID_EXTENSIONS):
                try:
                    decoded = file_content.decoded_content.decode("utf-8")

                    # If notebook, extract only code
                    if file_content.name.endswith(".ipynb"):
                        decoded = extract_ipynb_code(decoded)

                    if decoded.strip():
                        files_data.append({
                            "filename": file_content.path,
                            "content": decoded
                        })

                except Exception:
                    pass

    return files_data