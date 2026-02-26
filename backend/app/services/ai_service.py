from openai import AsyncOpenAI
from app.core.config import settings
from app.core.logging_config import get_logger
import io
from pypdf import PdfReader
import json

logger = get_logger(__name__)
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

import base64

async def extract_text_from_document(file_content: bytes, file_type: str) -> str:
    """
    Extracts text from a document using a hybrid approach:
    1. Digital PDFs: Use pypdf for fast extraction.
    2. Images (Scanned/Photos): Use GPT-4o Vision.
    3. Scanned PDFs (Fallback): TODO - Requires pdf2image + poppler.
    """
    text_content = ""
    
    try:
        if "pdf" in file_type:
            # Try pypdf first (Fast path for digital PDFs)
            try:
                pdf_file = io.BytesIO(file_content)
                reader = PdfReader(pdf_file)
                for page in reader.pages:
                    text_content += page.extract_text() or ""
            except Exception as e:
                logger.warning(f"pypdf extraction failed: {e}")

            # If pypdf extracted very little text, it might be a scanned PDF.
            # For now, we return what we found. 
            # TODO: Implement PDF->Image conversion for scanned PDFs if text_content is empty.
            
        elif "image" in file_type:
            # Use GPT-4o Vision for images
            logger.info("Processing image with GPT-4o Vision")
            base64_image = base64.b64encode(file_content).decode('utf-8')
            
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Transcribe the text from this image exactly as it appears. If there are tables, represent them as Markdown tables."},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{file_type};base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=4000
            )
            text_content = response.choices[0].message.content
            logger.info("Vision extraction complete", extra={
                "feature": "extract_text",
                "tokens": response.usage.total_tokens if response.usage else 0,
                "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                "completion_tokens": response.usage.completion_tokens if response.usage else 0,
            })
            
    except Exception as e:
        logger.error(f"Text Extraction Error: {e}")
        
    return text_content

async def classify_document(file_content: bytes, file_type: str) -> dict:
    """
    Classifies the document using OpenAI.
    Returns a dictionary with 'category' and 'confidence'.
    """
    try:
        # 1. Extract Text (Centralized Logic)
        text_content = await extract_text_from_document(file_content, file_type)

        if not text_content:
            return {"category": "Uncategorized", "confidence": 0.0, "summary": "Could not extract text for analysis."}

        # Truncate text to avoid token limits for classification
        # Keep it reasonable, e.g., first 10k chars
        analysis_text = text_content[:10000]

        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a document classifier and analyst. Analyze the text and return a JSON object with the following keys:\n"
                               "- 'category': One of [Invoice, Contract, Receipt, Policy, ID, Notice, Other]\n"
                               "- 'confidence': Float 0-1\n"
                               "- 'summary': A brief 1-sentence summary of the document.\n"
                               "- 'metadata': A dictionary containing key extracted fields:\n"
                               "    - 'dates': List of objects {'label': str, 'value': str} (e.g., {'label': 'Due Date', 'value': '2025-01-01'})\n"
                               "    - 'amounts': List of objects {'label': str, 'value': str, 'currency': str} (e.g., {'label': 'Total', 'value': '100.00', 'currency': 'USD'})\n"
                               "    - 'entities': List of names, companies, or organizations\n"
                               "    - 'invoice_number': If applicable\n"
                               "    - 'po_number': Purchase Order Number (if found)\n"
                               "    - 'vendor_name': Name of the vendor/supplier (normalized)\n"
                               "    - 'contract_parties': If applicable\n"
                               "    - 'line_items': List of items/services purchased (description, quantity, price)\n"
                               "    - 'action_items': List of required actions\n"
                },
                {
                    "role": "user",
                    "content": f"Analyze this document content:\n\n{analysis_text}"
                }
            ],
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)
        logger.info("Document classified", extra={
            "feature": "classify",
            "category": result.get("category"),
            "tokens": response.usage.total_tokens if response.usage else 0,
            "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
            "completion_tokens": response.usage.completion_tokens if response.usage else 0,
        })
        # Attach the full extracted text to the result so we don't have to re-extract it later
        result["_extracted_text"] = text_content 
        return result

    except Exception as e:
        logger.error(f"AI Classification Error: {str(e)}")
        return {"category": "Error", "confidence": 0.0, "summary": f"AI Classification Error: {str(e)}"}

async def generate_embedding(text: str) -> list[float]:
    """
    Generates an embedding vector for the given text using OpenAI.
    """
    try:
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        logger.debug("Embedding generated", extra={
            "feature": "embed",
            "tokens": response.usage.total_tokens if response.usage else 0,
        })
        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Embedding Error: {e}")
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
