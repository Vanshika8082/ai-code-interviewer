from github_fetcher import fetch_repo_files
from rag_engine import RAGEngine
from interviewer import generate_question, evaluate_answer

repo_url = input("Enter GitHub repo URL: ")

files = fetch_repo_files(repo_url)

print(f"Fetched {len(files)} files.")

rag = RAGEngine()
rag.build_index(files)

topic = input("\nWhat topic should I ask about? ")

relevant_chunks = rag.retrieve(topic)

question = generate_question(relevant_chunks)

print("\nInterview Question:")
print(question)

answer = input("\nYour Answer: ")

evaluation = evaluate_answer(question, answer)

print("\nEvaluation:")
print(evaluation)