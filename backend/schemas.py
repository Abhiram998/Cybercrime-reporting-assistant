from pydantic import BaseModel
from typing import Optional, List
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
    impact: Optional[str] = None
    
    # Accused Information
    accusedName: Optional[str] = None
    accusedContact: Optional[str] = None
    accusedDetails: Optional[str] = None
    
    # Evidence Analysis
    evidenceDescription: Optional[str] = None
    evidence_image_url: Optional[str] = None
    ocr_text: Optional[str] = None
    detected_urls: Optional[str] = None
    detected_contacts: Optional[str] = None
    auto_generated_description: Optional[str] = None
    
    # New Extended Analysis Fields
    incident_overview: Optional[str] = None
    methods_used: Optional[str] = None
    indicators_list: Optional[List[str]] = None
    evidence_observed: Optional[List[str]] = None
    timeline: Optional[List[str]] = None
    url_threats: Optional[List[dict]] = None

    
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
