from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class ComplaintBase(BaseModel):
    name: str
    phone: str
    email: str
    address: str
    crime_type: str
    description: str
    suspect_info: Optional[str] = None
    transaction_id: Optional[str] = None
    incident_date: str

class ComplaintCreate(ComplaintBase):
    pass

class Complaint(ComplaintBase):
    id: uuid.UUID
    status: str
    pdf_url: Optional[str]
    evidence_url: Optional[str]
    ocr_text: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintDashboard(BaseModel):
    id: uuid.UUID
    name: str
    crime_type: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
