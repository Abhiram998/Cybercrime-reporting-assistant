from fastapi import FastAPI, HTTPException, UploadFile, File, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import uuid
from typing import List

try:
    from backend.supabase_client import supabase
    from backend import schemas, ocr_service, pdf_generator
except ImportError:
    # Fallback for different run environments
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
    
    # Evidence Analysis (OCR + AI Detection)
    analysis_results = ocr_service.analyze_evidence(local_path)
    
    # Upload to Supabase Storage: evidence-images
    try:
        with open(local_path, "rb") as f:
            storage_path = unique_filename
            supabase.storage.from_("evidence-images").upload(
                storage_path, 
                f,
                file_options={"content_type": file.content_type}
            )
            
        # Get public URL
        image_url = supabase.storage.from_("evidence-images").get_public_url(storage_path)
        
        return {
            "image_url": image_url,
            **analysis_results
        }
    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload image to Supabase: {str(e)}")

@app.post("/submit-complaint")
async def submit_complaint(request: Request, complaint: schemas.ComplaintCreate):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    try:
        # 1. Store complaint data - Map new fields to existing columns for compatibility
        complaint_dict = complaint.dict()
        
        # Mapping new frontend fields to legacy backend columns
        mapped_data = {
            "name": complaint_dict.get("complainantName", complaint_dict.get("name")),
            "phone": complaint_dict.get("complainantPhone", complaint_dict.get("phone")),
            "email": complaint_dict.get("complainantEmail", complaint_dict.get("email")),
            "address": complaint_dict.get("complainantAddress", complaint_dict.get("address")),
            "crime_type": complaint_dict.get("crimeType", complaint_dict.get("crime_type")),
            "description": complaint_dict.get("incidentDescription", complaint_dict.get("description")),
            "incident_date": complaint_dict.get("incidentDate", complaint_dict.get("incident_date")),
            "suspect_info": complaint_dict.get("accusedName", complaint_dict.get("suspect_info")),
            "transaction_id": complaint_dict.get("transactionId", complaint_dict.get("transaction_id")),
            "ocr_text": complaint_dict.get("ocr_text"),
            "detected_urls": complaint_dict.get("detected_urls"),
            "detected_contacts": complaint_dict.get("detected_contacts"),
            "evidence_image_url": complaint_dict.get("evidence_image_url"),
            "evidence_url": complaint_dict.get("evidence_image_url"),
            "auto_generated_description": complaint_dict.get("auto_generated_description"),
        }
        
        # Remove None values to avoid overwriting defaults
        insert_data = {k: v for k, v in mapped_data.items() if v is not None}
        
        # Add a placeholder for status if not present
        if "status" not in insert_data:
            insert_data["status"] = "Pending"

        response = supabase.table("complaints").insert(insert_data).execute()
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
        pdf_payload['evidence_url'] = db_complaint.get('evidence_url', '') or db_complaint.get('evidence_image_url', '')
        
        pdf_generator.generate_pdf(pdf_payload, local_pdf_path)
        
        # 3. Upload PDF to Supabase Storage: complaint-reports
        with open(local_pdf_path, "rb") as f:
            supabase.storage.from_("complaint-reports").upload(
                pdf_filename, 
                f, 
                file_options={"content-type": "application/pdf", "upsert": True}
            )
            
        # Use our own download endpoint for the PDF URL to guarantee headers
        base_url = str(request.base_url).rstrip('/')
        pdf_url = f"{base_url}/download-complaint/{complaint_uuid}"
        
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
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
