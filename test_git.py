from github_fetcher import fetch_repo_files

repo_url = input("Enter GitHub repo URL: ")

files = fetch_repo_files(repo_url)

print(f"\nTotal files fetched: {len(files)}\n")

for f in files[:5]:
    print("FILE:", f["filename"])
    print(f["content"][:500])
    print("=" * 50)