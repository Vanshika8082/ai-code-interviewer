class RAGEngine:
    def __init__(self):
        self.chunks = []

    def chunk_text(self, text, chunk_size=500):
        chunks = []
        for i in range(0, len(text), chunk_size):
            chunks.append(text[i:i + chunk_size])
        return chunks

    def build_index(self, files_data):
        print("Building simple text index...")

        for file in files_data:
            file_chunks = self.chunk_text(file["content"])
            for chunk in file_chunks:
                if chunk.strip():
                    self.chunks.append(chunk)

        print(f"Indexed {len(self.chunks)} chunks.")

    def retrieve(self, query, top_k=3):
        query_lower = query.lower()

        scored_chunks = []

        for chunk in self.chunks:
            score = sum(
                word in chunk.lower()
                for word in query_lower.split()
            )
            scored_chunks.append((score, chunk))

        scored_chunks.sort(reverse=True, key=lambda x: x[0])

        top_chunks = [chunk for score, chunk in scored_chunks[:top_k]]

        return top_chunks