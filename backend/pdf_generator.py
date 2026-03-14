from reportlab.lib.pagesizes import LETTER
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListItem, ListFlowable
from datetime import datetime
import os

def generate_pdf(data: dict, output_path: str):
    doc = SimpleDocTemplate(output_path, pagesize=LETTER)
    styles = getSampleStyleSheet()
    
    # Custom styles
    styles.add(ParagraphStyle(name='RightAlign', alignment=2, parent=styles['Normal']))
    styles.add(ParagraphStyle(name='CenterAlign', alignment=1, parent=styles['Normal'], fontSize=12, leading=14, spaceAfter=10))
    styles.add(ParagraphStyle(name='BoldNormal', parent=styles['Normal'], fontName='Helvetica-Bold'))
    
    elements = []
    
    # User Info (Top Right)
    elements.append(Paragraph(f"<b>{data.get('name', '[Your Name]')}</b>", styles['RightAlign']))
    elements.append(Paragraph(f"{data.get('phone', '[Your Phone Number]')}", styles['RightAlign']))
    elements.append(Paragraph(f"{data.get('email', '[Your Email Address]')}", styles['RightAlign']))
    elements.append(Paragraph(f"{data.get('address', '[Your Address]')}", styles['RightAlign']))
    elements.append(Spacer(1, 12))
    
    # Date
    today = datetime.now().strftime("%B %d, %Y")
    elements.append(Paragraph(f"<b>[{today}]</b>", styles['RightAlign']))
    elements.append(Spacer(1, 24))
    
    # Recipient Info (Left)
    elements.append(Paragraph("<b>[Recipient's Name]</b>", styles['Normal']))
    elements.append(Paragraph("[Recipient's Title or Position], [Recipient's Organization]", styles['Normal']))
    elements.append(Paragraph("[Address] [City, State, ZIP Code]", styles['Normal']))
    elements.append(Spacer(1, 24))
    
    # Subject
    elements.append(Paragraph("<u>Subject: Cyber Crime Complaint</u>", styles['CenterAlign']))
    elements.append(Spacer(1, 12))
    
    # Salutation
    elements.append(Paragraph("Dear [Recipient's Name],", styles['Normal']))
    elements.append(Spacer(1, 12))
    
    # Introduction
    elements.append(Paragraph(
        f"I am writing to formally complain about a cybercrime incident that occurred on {data.get('incident_date')} involving "
        f"{data.get('crime_type')}. This letter serves as an official notification of the incident and a request for investigation and appropriate action.",
        styles['Normal']
    ))
    elements.append(Spacer(1, 12))
    
    # Body
    elements.append(Paragraph("<b>Body:</b>", styles['Normal']))
    elements.append(Spacer(1, 6))
    
    # Point 1: Description
    p1 = [
        Paragraph(f"<b>1. Clear and concise description of the incident:</b> Provide a detailed account of the cyber crime incident, including:", styles['Normal']),
        ListFlowable([
            ListItem(Paragraph(f"Date, time, and location of the incident: {data.get('incident_date')}", styles['Normal'])),
            ListItem(Paragraph(f"Nature of the cyber crime: {data.get('crime_type')}", styles['Normal'])),
            ListItem(Paragraph(f"Description: {data.get('description')}", styles['Normal'])),
            ListItem(Paragraph(f"Transaction ID (if applicable): {data.get('transaction_id', 'N/A')}", styles['Normal'])),
        ], bulletType='bullet', leftIndent=20)
    ]
    elements.extend(p1)
    elements.append(Spacer(1, 12))
    
    # Point 2: Evidence
    p2 = [
        Paragraph("<b>2. Documentation of evidence and supporting information:</b> Attach any relevant evidence or documentation to support your complaint, such as:", styles['Normal']),
        ListFlowable([
            ListItem(Paragraph("Screenshots of suspicious emails or websites", styles['Normal'])),
            ListItem(Paragraph("Transaction records", styles['Normal'])),
            ListItem(Paragraph("Log files.", styles['Normal'])),
        ], bulletType='bullet', leftIndent=20)
    ]
    elements.extend(p2)
    elements.append(Spacer(1, 12))
    
    # Point 3: Parties involved
    p3 = [
        Paragraph("<b>3. Identification of the parties involved:</b> Identify yourself or your organization as the complainant(s) filing the cyber crime complaint.", styles['Normal']),
        ListFlowable([
            ListItem(Paragraph(f"Name: {data.get('name')}", styles['Normal'])),
            ListItem(Paragraph(f"Suspect Info: {data.get('suspect_info', 'Unknown')}", styles['Normal'])),
        ], bulletType='bullet', leftIndent=20)
    ]
    elements.extend(p3)
    elements.append(Spacer(1, 24))
    
    # Conclusion
    elements.append(Paragraph("<b>[Conclusion]:</b>", styles['Normal']))
    elements.append(Paragraph(
        f"In light of the seriousness of the cyber crime incident and its impact, I respectfully request that an investigation be initiated "
        "into the matter and appropriate action be taken against the perpetrators. I am available to provide any further information or assistance required.",
        styles['Normal']
    ))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("Thank you for your attention to this matter. I look forward to your prompt response and resolution of the issue.", styles['Normal']))
    elements.append(Spacer(1, 36))
    
    # Signature
    elements.append(Paragraph("Sincerely,", styles['Normal']))
    elements.append(Spacer(1, 24))
    elements.append(Paragraph(f"{data.get('name')}", styles['Normal']))
    elements.append(Paragraph("[Your Signature]", styles['Normal']))
    
    # Enclosures
    elements.append(Spacer(1, 24))
    elements.append(Paragraph("[Enclosures: List any documents or evidence attached to the letter]", styles['Normal']))
    elements.append(Paragraph("[CC: List any additional recipients copied on the letter, if applicable]", styles['Normal']))

    doc.build(elements)
