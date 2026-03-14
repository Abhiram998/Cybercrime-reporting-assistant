from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class ComplaintBase(BaseModel):
    # Complainant Info
    complainantName: str
    complainantPhone: str
    complainantEmail: str
    complainantAddress: str
    complainantCity: Optional[str] = None
    complainantState: Optional[str] = None
    complainantZip: Optional[str] = None
    
    # Recipient Info
    recipientName: str
    recipientTitle: Optional[str] = None
    recipientOrganization: str
    recipientAddress: Optional[str] = None
    recipientCity: Optional[str] = None
    recipientState: Optional[str] = None
    recipientZip: Optional[str] = None
    
    # Incident Details
    incidentDate: str
    incidentTime: Optional[str] = None
    incidentLocation: Optional[str] = None
    crimeType: str
    incidentDescription: str
    methodUsed: Optional[str] = None
    impact: str
    
    # Accused Information
    accusedName: Optional[str] = None
    accusedContact: Optional[str] = None
    accusedDetails: Optional[str] = None
    
    # Evidence
    evidenceDescription: Optional[str] = None
    
    # Existing compatibility fields (can be mapped or kept)
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    crime_type: Optional[str] = None
    description: Optional[str] = None
    suspect_info: Optional[str] = None
    transaction_id: Optional[str] = None
    incident_date: Optional[str] = None

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
