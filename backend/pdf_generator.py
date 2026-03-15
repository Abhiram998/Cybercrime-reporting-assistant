from reportlab.lib.pagesizes import LETTER
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from datetime import datetime
import os
import requests
from io import BytesIO

def generate_pdf(data: dict, output_path: str):
    doc = SimpleDocTemplate(output_path, pagesize=LETTER, 
                            rightMargin=72, leftMargin=72, 
                            topMargin=72, bottomMargin=72)
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
        alignment=0, # Left align
        fontSize=11,
        leading=14,
        fontName='Helvetica-Bold',
        spaceBefore=12,
        spaceAfter=12
    ))

    styles.add(ParagraphStyle(
        name='SectionTitle',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
        fontName='Helvetica-Bold',
        spaceBefore=12,
        spaceAfter=6
    ))
    
    styles.add(ParagraphStyle(
        name='ComplaintBodyText',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
        fontName='Helvetica',
        alignment=4 # Justified
    ))

    elements = []
    
    # 1. Header (Right Aligned User Info)
    name = data.get('complainantName') or data.get('name', '[User Name]')
    phone = data.get('complainantPhone') or data.get('phone', '[Phone Number]')
    email = data.get('complainantEmail') or data.get('email', '[Email Address]')
    address_parts = [
        data.get('complainantAddress'),
        data.get('complainantCity'),
        data.get('complainantState'),
        data.get('complainantZip')
    ]
    address = ", ".join([p for p in address_parts if p]) or data.get('address', '[Address]')

    elements.append(Paragraph(f"<b>{name}</b>", styles['HeaderInfo']))
    elements.append(Paragraph(f"{phone}", styles['HeaderInfo']))
    elements.append(Paragraph(f"{email}", styles['HeaderInfo']))
    elements.append(Paragraph(f"{address}", styles['HeaderInfo']))
    
    today = datetime.now().strftime("%B %d, %Y")
    elements.append(Paragraph(f"{today}", styles['HeaderInfo']))
    elements.append(Spacer(1, 24))
    
    # 2. Recipient Section (Left Aligned)
    elements.append(Paragraph("<b>Cyber Crime Cell</b>", styles['Normal']))
    elements.append(Paragraph("<b>Police Department</b>", styles['Normal']))
    elements.append(Spacer(1, 24))
    
    # 3. Subject Line
    elements.append(Paragraph("Subject: Cyber Crime Complaint", styles['SubjectLine']))
    
    # 4. Salutation
    elements.append(Paragraph("Dear Sir/Madam,", styles['Normal']))
    elements.append(Spacer(1, 12))
    
    # 5. Intro & Incident Description
    incident_date = data.get('incidentDate') or data.get('incident_date', '[Incident Date]')
    crime_type = data.get('crimeType') or data.get('crime_type', '[Crime Type]')
    
    intro_text = (
        f"I am writing to formally complain about a cybercrime incident that occurred on <b>{incident_date}</b> "
        f"involving <b>{crime_type}</b>."
    )
    elements.append(Paragraph(intro_text, styles['ComplaintBodyText']))
    elements.append(Spacer(1, 12))
    
    description = data.get('incidentDescription') or data.get('description', 'No description provided.')
    elements.append(Paragraph(f"{description}", styles['ComplaintBodyText']))
    elements.append(Spacer(1, 12))
    
    # Details Bullet Points
    elements.append(Paragraph("Include details such as:", styles['Normal']))
    details = [
        f"• Date and time of incident: {incident_date}",
        f"• Nature of cybercrime: {crime_type}",
        "• How the incident occurred: As described above",
        f"• Impact on the victim: {data.get('impact') or data.get('description', 'N/A')[:100]}..."
    ]
    for detail in details:
        elements.append(Paragraph(detail, styles['Normal']))
    
    # 6. Evidence Section
    elements.append(Paragraph("<b>Evidence Section</b>", styles['SectionTitle']))
    elements.append(Paragraph("The following evidence supports this complaint:", styles['Normal']))
    
    evidence_list = []
    if data.get('evidence_url'):
        evidence_list.append("• Screenshot evidence uploaded")
    
    transaction_id = data.get('transactionId') or data.get('transaction_id')
    if transaction_id and transaction_id != "N/A":
        evidence_list.append(f"• Transaction details (ID: {transaction_id})")
    
    ocr_text = data.get('ocr_text')
    if ocr_text:
        evidence_list.append(f"• Extracted OCR text: {ocr_text[:150]}...")
        
    if not evidence_list:
        evidence_list.append("• No specific evidence links provided.")
    
    for item in evidence_list:
        elements.append(Paragraph(item, styles['Normal']))
    
    # 7. Suspect Information
    elements.append(Paragraph("<b>Suspect Information</b>", styles['SectionTitle']))
    suspect_info = data.get('accusedName') or data.get('suspect_info', 'Unknown')
    elements.append(Paragraph(f"{suspect_info}", styles['Normal']))
    
    # 8. Conclusion
    elements.append(Paragraph("<b>Conclusion</b>", styles['SectionTitle']))
    elements.append(Paragraph(
        "I respectfully request the authorities to investigate this matter and take appropriate action.",
        styles['ComplaintBodyText']
    ))
    
    # 9. Closing
    elements.append(Spacer(1, 24))
    elements.append(Paragraph("Sincerely,", styles['Normal']))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"<b>{name}</b>", styles['Normal']))
    
    # 9a. Comprehensive Evidence Analysis (Powered by AI)
    if data.get('ocr_text') or data.get('crime_type'):
        elements.append(Paragraph("<b>ENCLOSURE: AI-POWERED EVIDENCE ANALYSIS</b>", styles['SectionTitle']))
        elements.append(Paragraph("This section contains an automated forensic analysis of the submitted evidence.", styles['Normal']))
        elements.append(Spacer(1, 12))
        
        # 1. Incident Overview
        elements.append(Paragraph("<b>1. Incident Overview:</b>", styles['Normal']))
        overview = data.get('incident_overview') or data.get('description') or "N/A"
        elements.append(Paragraph(overview, styles['ComplaintBodyText']))
        elements.append(Spacer(1, 12))

        # 2. Evidence Observed
        evidence_observed = data.get('evidence_observed') or []
        if evidence_observed:
            elements.append(Paragraph("<b>2. Evidence Observed:</b>", styles['Normal']))
            for item in evidence_observed:
                elements.append(Paragraph(f"• {item}", styles['Normal']))
            elements.append(Spacer(1, 12))

        # 3. Methods Used
        methods = data.get('methods_used') or data.get('methodUsed') or "N/A"
        elements.append(Paragraph("<b>3. Methods Used by Perpetrators:</b>", styles['Normal']))
        elements.append(Paragraph(methods, styles['ComplaintBodyText']))
        elements.append(Spacer(1, 12))

        # 4. Indicators of Malicious Activity
        indicators_list = data.get('indicators_list') or []
        if indicators_list:
            elements.append(Paragraph("<b>4. Indicators of Malicious Activity:</b>", styles['Normal']))
            for ind in indicators_list:
                elements.append(Paragraph(f"• {ind}", styles['Normal']))
            elements.append(Spacer(1, 12))

        # 5. URL Threat Analysis
        url_threats = data.get('url_threats') or []
        if url_threats:
            elements.append(Paragraph("<b>5. Suspicious URL Analysis:</b>", styles['Normal']))
            for ut in url_threats:
                elements.append(Paragraph(f"• <b>URL:</b> {ut['url']}", styles['Normal']))
                elements.append(Paragraph(f"  <b>Risk Level:</b> {ut['risk_level']} | <b>Category:</b> {ut['category']}", styles['Normal']))
            elements.append(Spacer(1, 12))

        # 6. Incident Timeline
        timeline = data.get('timeline') or []
        if timeline:
            elements.append(Paragraph("<b>6. Incident Timeline (Reconstructed):</b>", styles['Normal']))
            for event in timeline:
                elements.append(Paragraph(event, styles['Normal']))
            elements.append(Spacer(1, 12))

        elements.append(Paragraph("<b>7. Extracted OCR Text:</b>", styles['Normal']))
        elements.append(Paragraph(data.get('ocr_text') or "N/A", styles['ComplaintBodyText']))
        elements.append(Spacer(1, 24))


    # 10. Attachments
    elements.append(Spacer(1, 24))
    elements.append(Paragraph("<b>Attachments</b>", styles['SectionTitle']))
    elements.append(Paragraph("• Evidence screenshots", styles['Normal']))
    elements.append(Paragraph("• Transaction records", styles['Normal']))

    # 11. Embed Image if URL is provided
    if data.get('evidence_url'):
        try:
            response = requests.get(data['evidence_url'])
            if response.status_code == 200:
                img_data = BytesIO(response.content)
                img = Image(img_data, width=400, height=300)
                img.hAlign = 'CENTER'
                elements.append(Spacer(1, 24))
                elements.append(Paragraph("<b>Evidence Screenshot:</b>", styles['Normal']))
                elements.append(Spacer(1, 12))
                elements.append(img)
        except Exception as e:
            print(f"Error embedding image in PDF: {e}")

    doc.build(elements)
