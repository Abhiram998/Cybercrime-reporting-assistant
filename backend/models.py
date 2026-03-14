from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from .database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id_str = Column(String, unique=True, index=True)
    name = Column(String)
    phone = Column(String)
    email = Column(String)
    address = Column(String)
    crime_type = Column(String)
    description = Column(Text)
    suspect_info = Column(Text, nullable=True)
    transaction_id = Column(String, nullable=True)
    incident_date = Column(String)
    status = Column(String, default="Pending Review")
    pdf_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
