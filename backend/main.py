from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import uuid
from datetime import datetime
from typing import List

from .supabase_client import supabase
from . import schemas, ocr_service, pdf_generator

app = FastAPI(title="Cybercrime Reporting API (Supabase)")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Local temp directories for processing
TEMP_UPLOAD_DIR = "temp_uploads"
TEMP_REPORT_DIR = "temp_reports"
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)
os.makedirs(TEMP_REPORT_DIR, exist_ok=True)

@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized. Check .env")
        
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Save locally temporarily for OCR
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    local_path = os.path.join(TEMP_UPLOAD_DIR, unique_filename)
    
    with open(local_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # OCR Processing
    extracted_text = ocr_service.extract_text_from_image(local_path)
    
    # Upload to Supabase Storage: evidence-images
    try:
        with open(local_path, "rb") as f:
            storage_path = unique_filename
            supabase.storage.from_("evidence-images").upload(storage_path, f)
            
        # Get public URL
        image_url = supabase.storage.from_("evidence-images").get_public_url(storage_path)
        
        # Cleanup local file (optional, keeping for now)
        # os.remove(local_path)
        
        return {
            "image_url": image_url,
            "extracted_text": extracted_text
        }
    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload image to Supabase: {str(e)}")

@app.post("/submit-complaint")
async def submit_complaint(complaint: schemas.ComplaintCreate):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    try:
        # 1. Store complaint data
        complaint_data = complaint.dict()
        response = supabase.table("complaints").insert(complaint_data).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to insert complaint")
            
        db_complaint = response.data[0]
        complaint_uuid = db_complaint['id']
        
        # 2. Generate PDF locally
        pdf_filename = f"complaint_{complaint_uuid}.pdf"
        local_pdf_path = os.path.join(TEMP_REPORT_DIR, pdf_filename)
        
        pdf_payload = complaint.dict()
        pdf_payload['complaint_id'] = complaint_uuid
        # We need to ensure we have the correct data for PDF
        pdf_payload['ocr_text'] = db_complaint.get('ocr_text', '')
        pdf_payload['evidence_url'] = db_complaint.get('evidence_url', '')
        
        pdf_generator.generate_pdf(pdf_payload, local_pdf_path)
        
        # 3. Upload PDF to Supabase Storage: complaint-reports
        with open(local_pdf_path, "rb") as f:
            supabase.storage.from_("complaint-reports").upload(
                pdf_filename, 
                f, 
                file_options={"content_type": "application/pdf", "upsert": "true"}
            )
            
        pdf_url = supabase.storage.from_("complaint-reports").get_public_url(pdf_filename)
        
        # 4. Update complaint record with pdf_url
        supabase.table("complaints").update({"pdf_url": pdf_url}).eq("id", complaint_uuid).execute()
        
        return {
            "status": "Complaint Submitted",
            "complaint_id": complaint_uuid,
            "pdf_url": pdf_url
        }
    except Exception as e:
        print(f"Submission Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-complaints")
async def get_complaints():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    try:
        response = supabase.table("complaints").select("*").order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download-complaint/{complaint_id}")
async def download_complaint(complaint_id: str):
    from fastapi.responses import Response
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    try:
        # Get PDF filename from database or follow format
        pdf_filename = f"complaint_{complaint_id}.pdf"
        
        # Download from Supabase Storage
        file_data = supabase.storage.from_("complaint-reports").download(pdf_filename)
        
        return Response(
            content=file_data,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=\"{pdf_filename}\""
            }
        )
    except Exception as e:
        print(f"Download Error: {e}")
        raise HTTPException(status_code=404, detail="Complaint report PDF not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
