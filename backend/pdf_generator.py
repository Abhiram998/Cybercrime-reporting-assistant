from reportlab.lib.pagesizes import LETTER
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem, Table, TableStyle
from datetime import datetime
import os

def generate_pdf(data: dict, output_path: str):
    doc = SimpleDocTemplate(output_path, pagesize=LETTER, 
                            rightMargin=50, leftMargin=50, 
                            topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    
    # Custom styles
    styles.add(ParagraphStyle(
        name='HeaderInfo',
        parent=styles['Normal'],
        alignment=2, # Right align
        fontSize=11,
        leading=14,
        fontName='Helvetica'
    ))
    
    styles.add(ParagraphStyle(
        name='SubjectLine',
        parent=styles['Normal'],
        alignment=1, # Center align
        fontSize=12,
        leading=18,
        fontName='Helvetica-Bold',
        spaceBefore=20,
        spaceAfter=20
    ))

    styles.add(ParagraphStyle(
        name='SectionTitle',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
        fontName='Helvetica-Bold',
        spaceBefore=15,
        spaceAfter=5
    ))

    elements = []
    
    # 1. Header (Right Aligned)
    elements.append(Paragraph(f"<b>{data.get('name', '[User Name]')}</b>", styles['HeaderInfo']))
    elements.append(Paragraph(f"{data.get('phone', '[Phone Number]')}", styles['HeaderInfo']))
    elements.append(Paragraph(f"{data.get('email', '[Email Address]')}", styles['HeaderInfo']))
    elements.append(Paragraph(f"{data.get('address', '[Address]')}", styles['HeaderInfo']))
    
    today = datetime.now().strftime("%B %d, %Y")
    elements.append(Paragraph(f"{today}", styles['HeaderInfo']))
    
    # 2. Recipient Section (Left Aligned)
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("<b>[Recipient Name]</b>", styles['Normal']))
    elements.append(Paragraph("[Recipient Title / Organization]", styles['Normal']))
    elements.append(Paragraph("[Recipient Address]", styles['Normal']))
    
    # 3. Subject Line
    elements.append(Paragraph("Subject: Cyber Crime Complaint", styles['SubjectLine']))
    
    # 4. Salutation
    elements.append(Paragraph("Dear [Recipient Name],", styles['Normal']))
    elements.append(Spacer(1, 12))
    
    # 5. Intro
    elements.append(Paragraph(
        f"I am writing to formally complain about a cybercrime incident that occurred on <b>{data.get('incident_date')}</b> "
        f"involving <b>{data.get('crime_type')}</b>.",
        styles['Normal']
    ))
    
    # 6. Incident Description
    elements.append(Paragraph("<b>Incident Description</b>", styles['SectionTitle']))
    elements.append(Paragraph(f"{data.get('description', 'No description provided.')}", styles['Normal']))
    
    elements.append(Spacer(1, 10))
    elements.append(Paragraph("Details of the incident include:", styles['Normal']))
    details = [
        ListItem(Paragraph(f"Date and time of the incident: {data.get('incident_date')}", styles['Normal'])),
        ListItem(Paragraph(f"Nature of the cybercrime: {data.get('crime_type')}", styles['Normal'])),
        ListItem(Paragraph(f"How the attack occurred: {data.get('description')[:100]}...", styles['Normal'])),
        ListItem(Paragraph(f"Transaction ID: {data.get('transaction_id', 'N/A')}", styles['Normal'])),
    ]
    elements.append(ListFlowable(details, bulletType='bullet', leftIndent=20))
    
    # 7. Evidence Section
    elements.append(Paragraph("<b>Evidence Section</b>", styles['SectionTitle']))
    elements.append(Paragraph("The following evidence is attached to support the complaint:", styles['Normal']))
    
    evidence_items = []
    if data.get('evidence_url'):
        evidence_items.append(ListItem(Paragraph(f"Screenshot evidence: {data.get('evidence_url')}", styles['Normal'])))
    
    if data.get('ocr_text'):
        evidence_items.append(ListItem(Paragraph(f"Extracted OCR text: {data.get('ocr_text')[:200]}...", styles['Normal'])))
        
    evidence_items.append(ListItem(Paragraph("Transaction records", styles['Normal'])))
    
    elements.append(ListFlowable(evidence_items, bulletType='bullet', leftIndent=20))
    
    # 8. Suspect Information
    elements.append(Paragraph("<b>Suspect Information</b>", styles['SectionTitle']))
    elements.append(Paragraph("If known, the following information about the suspected party is provided:", styles['Normal']))
    
    suspect_info = data.get('suspect_info', 'Unknown')
    elements.append(Paragraph(f"{suspect_info}", styles['Normal']))
    
    # 9. Conclusion
    elements.append(Paragraph("<b>Conclusion</b>", styles['SectionTitle']))
    elements.append(Paragraph(
        "I respectfully request that the concerned authorities investigate this matter and take appropriate action against the perpetrators.",
        styles['Normal']
    ))
    
    # 10. Closing
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("Sincerely,", styles['Normal']))
    elements.append(Spacer(1, 15))
    elements.append(Paragraph(f"<b>{data.get('name', '[User Name]')}</b>", styles['Normal']))
    
    # 11. Optional Image Embedding (Evidence Screenshot)
    if data.get('evidence_url'):
        try:
            import requests
            from reportlab.platypus import Image
            from io import BytesIO
            
            response = requests.get(data['evidence_url'])
            if response.status_code == 200:
                img_data = BytesIO(response.content)
                img = Image(img_data, width=400, height=300)
                img.hAlign = 'CENTER'
                elements.append(Spacer(1, 20))
                elements.append(Paragraph("<b>Evidence Screenshot:</b>", styles['Normal']))
                elements.append(Spacer(1, 10))
                elements.append(img)
        except Exception as e:
            print(f"Error embedding image in PDF: {e}")
            elements.append(Paragraph(f"[Image evidence could not be embedded: {data['evidence_url']}]", styles['Normal']))

    # 12. Attachments List
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("<b>Attachments List:</b>", styles['Normal']))
    elements.append(Paragraph("• Evidence screenshots", styles['Normal']))
    elements.append(Paragraph("• Transaction details", styles['Normal']))

    doc.build(elements)
