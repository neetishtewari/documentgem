from openai import AsyncOpenAI
from app.core.config import settings
import io
from pypdf import PdfReader
import json

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

async def classify_document(file_content: bytes, file_type: str) -> dict:
    """
    Classifies the document using OpenAI.
    Returns a dictionary with 'category' and 'confidence'.
    """
    text_content = ""
    
    try:
        if "pdf" in file_type:
            # Extract text from PDF
            pdf_file = io.BytesIO(file_content)
            reader = PdfReader(pdf_file)
            # Extract text from first few pages to save tokens, usually enough for classification
            for page in reader.pages[:3]: 
                text_content += page.extract_text() or ""
        else:
            # For now, assume images are not supported for text extraction in this simple pass
            # Or we could use GPT-4o Vision here. 
            # Let's stick to text-based for now or simple placeholder if no text found.
            pass

        if not text_content:
            return {"category": "Uncategorized", "confidence": 0.0, "summary": "Could not extract text for analysis."}

        # Truncate text to avoid token limits
        text_content = text_content[:4000]

        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a document classifier and analyst. Analyze the text and return a JSON object with the following keys:\n"
                               "- 'category': One of [Invoice, Contract, Receipt, Policy, ID, Notice, Other]\n"
                               "- 'confidence': Float 0-1\n"
                               "- 'summary': A brief 1-sentence summary of the document.\n"
                               "- 'metadata': A dictionary containing key extracted fields such as:\n"
                               "    - 'dates': List of important dates (e.g., due date, expiry date)\n"
                               "    - 'amounts': List of monetary amounts found\n"
                               "    - 'entities': List of names, companies, or organizations\n"
                               "    - 'invoice_number': If applicable\n"
                               "    - 'contract_parties': If applicable\n"
                               "    - 'action_items': List of required actions\n"
                },
                {
                    "role": "user",
                    "content": f"Analyze this document content:\n\n{text_content}"
                }
            ],
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)
        return result

    except Exception as e:
        error_msg = f"AI Classification Error: {str(e)}"
        print(error_msg)
        return {"category": "Error", "confidence": 0.0, "summary": error_msg}

async def generate_embedding(text: str) -> list[float]:
    """
    Generates an embedding vector for the given text using OpenAI.
    """
    try:
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Embedding Error: {e}")
        return []

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    """
    Splits text into chunks with overlap.
    """
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks
