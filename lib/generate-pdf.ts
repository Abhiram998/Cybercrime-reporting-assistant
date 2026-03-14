import { jsPDF } from "jspdf"

interface FormData {
  complainantName: string
  complainantPhone: string
  complainantEmail: string
  complainantAddress: string
  complainantCity: string
  complainantState: string
  complainantZip: string
  recipientName: string
  recipientTitle: string
  recipientOrganization: string
  recipientAddress: string
  recipientCity: string
  recipientState: string
  recipientZip: string
  incidentDate: string
  incidentTime: string
  incidentLocation: string
  crimeType: string
  incidentDescription: string
  methodUsed: string
  impact: string
  accusedName: string
  accusedContact: string
  accusedDetails: string
  evidenceDescription: string
  ocr_text?: string
  detected_urls?: string
  auto_generated_description?: string
}

export async function generateComplaintPDF(formData: FormData, complaintId: string) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = 20

  // Helper function to add wrapped text
  const addWrappedText = (text: string, x: number, currentY: number, maxWidth: number, lineHeight: number = 7): number => {
    const lines = doc.splitTextToSize(text, maxWidth)
    lines.forEach((line: string) => {
      if (currentY > 270) {
        doc.addPage()
        currentY = 20
      }
      doc.text(line, x, currentY)
      currentY += lineHeight
    })
    return currentY
  }

  // Set font
  doc.setFont("helvetica")
  
  // Header - Complainant Info (Right aligned)
  doc.setFontSize(10)
  doc.text(formData.complainantPhone || "[Your Phone Number]", pageWidth - margin, y, { align: "right" })
  y += 5
  doc.text(formData.complainantEmail || "[Your Email Address]", pageWidth - margin, y, { align: "right" })
  y += 5
  doc.text(formData.complainantAddress || "[Your Address]", pageWidth - margin, y, { align: "right" })
  y += 5
  doc.text(`${formData.complainantCity || "[City]"}, ${formData.complainantState || "[State]"}, ${formData.complainantZip || "[ZIP Code]"}`, pageWidth - margin, y, { align: "right" })
  y += 5
  doc.text(formData.complainantName || "[Your Name]", pageWidth - margin, y, { align: "right" })
  y += 12

  // Recipient Info
  doc.text(formData.recipientName || "[Recipient's Name]", margin, y)
  y += 5
  if (formData.recipientTitle || formData.recipientOrganization) {
    doc.text(`${formData.recipientTitle || "[Recipient's Title or Position]"}, ${formData.recipientOrganization || "[Recipient's Organization]"}`, margin, y)
    y += 5
  }
  if (formData.recipientAddress) {
    doc.text(formData.recipientAddress, margin, y)
    y += 5
  }
  if (formData.recipientCity || formData.recipientState || formData.recipientZip) {
    doc.text(`${formData.recipientCity || "[City]"}, ${formData.recipientState || "[State]"}, ${formData.recipientZip || "[ZIP Code]"}`, margin, y)
    y += 5
  }
  y += 10

  // Subject Line
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Subject: Cyber Crime Complaint", margin, y)
  y += 7

  // Date
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  const currentDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  doc.text(`Date: ${currentDate}`, margin, y)
  y += 7
  doc.text(`Complaint ID: ${complaintId}`, margin, y)
  y += 12

  // Salutation
  doc.text(`Dear ${formData.recipientName || "[Recipient's Name]"},`, margin, y)
  y += 10

  // Introduction
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Introduction:", margin, y)
  y += 7
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  
  const incidentDateFormatted = formData.incidentDate 
    ? new Date(formData.incidentDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "[Date]"
  
  const introText = `I am writing to formally complain about a cybercrime incident that occurred on ${incidentDateFormatted} involving ${formData.crimeType || "[Brief Description of the Incident]"}. This letter serves as an official notification of the incident and a request for investigation and appropriate action.`
  y = addWrappedText(introText, margin, y, contentWidth)
  y += 8

  // Body Section
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Body:", margin, y)
  y += 7
  
  // Section 1: Clear and concise description
  doc.setFontSize(10)
  doc.text("1. Clear and concise description of the incident:", margin, y)
  y += 7
  doc.setFont("helvetica", "normal")
  
  // Date, time, and location
  const dateTimeLocation = `Date, time, and location of the incident: ${incidentDateFormatted}${formData.incidentTime ? ` at ${formData.incidentTime}` : ""}${formData.incidentLocation ? `, ${formData.incidentLocation}` : ""}`
  y = addWrappedText(`• ${dateTimeLocation}`, margin + 5, y, contentWidth - 5)
  
  // Nature of cyber crime
  y = addWrappedText(`• Nature of the cyber crime: ${formData.crimeType || "[Type of cyber crime]"}`, margin + 5, y, contentWidth - 5)
  
  // How the incident occurred
  if (formData.methodUsed) {
    y = addWrappedText(`• How the incident occurred and methods used: ${formData.methodUsed}`, margin + 5, y, contentWidth - 5)
  }
  
  // Detailed description
  if (formData.incidentDescription) {
    y = addWrappedText(`• Detailed description: ${formData.incidentDescription}`, margin + 5, y, contentWidth - 5)
  }
  
  // Impact
  if (formData.impact) {
    y = addWrappedText(`• Impact and consequences: ${formData.impact}`, margin + 5, y, contentWidth - 5)
  }
  y += 5

  // Section 2: Documentation of evidence
  doc.setFont("helvetica", "bold")
  doc.text("2. Documentation of evidence and supporting information:", margin, y)
  y += 7
  doc.setFont("helvetica", "normal")
  
  if (formData.evidenceDescription) {
    y = addWrappedText(formData.evidenceDescription, margin + 5, y, contentWidth - 5)
  } else {
    y = addWrappedText("• Screenshots of suspicious emails or websites", margin + 5, y, contentWidth - 5)
    y = addWrappedText("• Transaction records", margin + 5, y, contentWidth - 5)
    y = addWrappedText("• Log files", margin + 5, y, contentWidth - 5)
    y = addWrappedText("• Forensic analysis reports (if available)", margin + 5, y, contentWidth - 5)
  }
  y += 5

  // AI Evidence Analysis Section (New)
  if (formData.ocr_text || formData.auto_generated_description) {
    doc.setFont("helvetica", "bold")
    doc.text("AI Evidence Analysis:", margin, y)
    y += 7
    doc.setFont("helvetica", "normal")
    
    if (formData.auto_generated_description) {
      y = addWrappedText(`• AI Summary: ${formData.auto_generated_description}`, margin + 5, y, contentWidth - 5)
    }
    if (formData.detected_urls) {
      y = addWrappedText(`• Detected Suspicious URLs: ${formData.detected_urls}`, margin + 5, y, contentWidth - 5)
    }
    if (formData.ocr_text) {
      y = addWrappedText("• Extracted Text from Evidence:", margin + 5, y, contentWidth - 5)
      y = addWrappedText(formData.ocr_text, margin + 10, y, contentWidth - 10)
    }
    y += 5
  }

  // Section 3: Identification of parties
  doc.setFont("helvetica", "bold")
  doc.text("3. Identification of the parties involved:", margin, y)
  y += 7
  doc.setFont("helvetica", "normal")
  
  y = addWrappedText(`Complainant: ${formData.complainantName}`, margin + 5, y, contentWidth - 5)
  
  if (formData.accusedName || formData.accusedContact || formData.accusedDetails) {
    y += 3
    doc.text("Information about the accused party:", margin + 5, y)
    y += 6
    if (formData.accusedName) {
      y = addWrappedText(`• Name: ${formData.accusedName}`, margin + 10, y, contentWidth - 10)
    }
    if (formData.accusedContact) {
      y = addWrappedText(`• Contact information: ${formData.accusedContact}`, margin + 10, y, contentWidth - 10)
    }
    if (formData.accusedDetails) {
      y = addWrappedText(`• Other relevant details: ${formData.accusedDetails}`, margin + 10, y, contentWidth - 10)
    }
  }
  y += 8

  // Conclusion
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Conclusion:", margin, y)
  y += 7
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  
  const conclusionText = `In light of the seriousness of the cyber crime incident and its impact on ${formData.complainantName || "[Your Name]"}, I respectfully request that ${formData.recipientName || formData.recipientOrganization || "[Recipient's Name or Organization]"} initiate an investigation into the matter and take appropriate action against the perpetrators. I am available to provide any further information or assistance required for the investigation.`
  y = addWrappedText(conclusionText, margin, y, contentWidth)
  y += 7
  
  y = addWrappedText("Thank you for your attention to this matter. I look forward to your prompt response and resolution of the issue.", margin, y, contentWidth)
  y += 15

  // Signature
  doc.text("Sincerely,", margin, y)
  y += 15
  doc.text(formData.complainantName || "[Your Name]", margin, y)
  y += 5
  doc.text("[Your Signature]", margin, y)
  y += 10

  // Enclosures
  if (formData.evidenceDescription) {
    doc.setFontSize(9)
    doc.text(`Enclosures: ${formData.evidenceDescription.substring(0, 100)}...`, margin, y)
  }

  // Save the PDF
  doc.save(`Cyber_Crime_Complaint_${complaintId}.pdf`)
}
