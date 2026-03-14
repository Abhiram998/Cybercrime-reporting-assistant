"use client"

import { useState, useMemo } from "react"
import { Search, Filter, Eye, LayoutGrid, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { generateComplaintPDF } from "@/lib/generate-pdf"

interface Complaint {
  id: string
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
  crimeType: string
  incidentDate: string
  incidentTime: string
  incidentLocation: string
  incidentDescription: string
  methodUsed: string
  impact: string
  accusedName: string
  accusedContact: string
  accusedDetails: string
  evidenceDescription: string
  ocr_text?: string
  detected_urls?: string
  detected_contacts?: string
  auto_generated_description?: string
  status: string
  date: string
}

// Sample data matching the new complaint format
const complaints: Complaint[] = [
  {
    id: "CYB-A1B2C3",
    complainantName: "John Smith",
    complainantPhone: "+1 555-123-4567",
    complainantEmail: "john.smith@email.com",
    complainantAddress: "123 Main Street",
    complainantCity: "New York",
    complainantState: "NY",
    complainantZip: "10001",
    recipientName: "Cyber Crime Cell",
    recipientTitle: "Station House Officer",
    recipientOrganization: "Cyber Crime Police Station",
    recipientAddress: "100 Police Plaza",
    recipientCity: "New York",
    recipientState: "NY",
    recipientZip: "10007",
    crimeType: "Phishing",
    incidentDate: "2024-03-10",
    incidentTime: "14:30",
    incidentLocation: "Online",
    incidentDescription: "Received a suspicious email claiming to be from my bank asking for login credentials. After entering details on a fake website, my account was compromised and unauthorized transactions were made.",
    methodUsed: "Fake email with a link to a phishing website that mimicked my bank's official website.",
    impact: "Financial loss of $2,500 from unauthorized transactions. Personal banking information compromised.",
    accusedName: "Unknown",
    accusedContact: "spoofed@bank-security.fake",
    accusedDetails: "Email originated from what appeared to be a legitimate bank domain but was actually a spoofed address.",
    evidenceDescription: "Screenshots of phishing email, fake website, bank statements showing unauthorized transactions",
    ocr_text: "BANK ALERT: Your account has been suspended. Please login at http://secure-bank-verify.com to reactivate.",
    detected_urls: "http://secure-bank-verify.com",
    detected_contacts: "Unknown",
    auto_generated_description: "The evidence describes a phishing attempt where the victim received a fraudulent bank alert and was directed to a malicious URL (secure-bank-verify.com) to capture credentials.",
    status: "Under Review",
    date: "2024-03-10",
  },
  {
    id: "CYB-D4E5F6",
    complainantName: "Sarah Johnson",
    complainantPhone: "+1 555-987-6543",
    complainantEmail: "sarah.j@email.com",
    complainantAddress: "456 Oak Avenue",
    complainantCity: "Los Angeles",
    complainantState: "CA",
    complainantZip: "90001",
    recipientName: "FBI Cyber Division",
    recipientTitle: "Special Agent",
    recipientOrganization: "Federal Bureau of Investigation",
    recipientAddress: "11000 Wilshire Boulevard",
    recipientCity: "Los Angeles",
    recipientState: "CA",
    recipientZip: "90024",
    crimeType: "Identity Theft",
    incidentDate: "2024-03-09",
    incidentTime: "09:15",
    incidentLocation: "Unknown - discovered via credit report",
    incidentDescription: "Discovered that someone had opened multiple credit cards and a loan in my name without my authorization. Credit score dropped significantly.",
    methodUsed: "Unknown how personal information was obtained. Possibly through a previous data breach.",
    impact: "Credit score dropped by 150 points. $15,000 in fraudulent debt. Significant time spent disputing charges.",
    accusedName: "Unknown",
    accusedContact: "N/A",
    accusedDetails: "No information available about the perpetrator.",
    evidenceDescription: "Credit reports, fraudulent account statements, identity theft affidavit",
    status: "Investigating",
    date: "2024-03-09",
  },
  {
    id: "CYB-G7H8I9",
    complainantName: "Michael Brown",
    complainantPhone: "+1 555-456-7890",
    complainantEmail: "m.brown@email.com",
    complainantAddress: "789 Pine Street",
    complainantCity: "Chicago",
    complainantState: "IL",
    complainantZip: "60601",
    recipientName: "Chicago Police Department",
    recipientTitle: "Cyber Crimes Unit",
    recipientOrganization: "Chicago Police Department",
    recipientAddress: "3510 S Michigan Ave",
    recipientCity: "Chicago",
    recipientState: "IL",
    recipientZip: "60653",
    crimeType: "Hacking",
    incidentDate: "2024-03-08",
    incidentTime: "22:00",
    incidentLocation: "Personal Computer / Social Media",
    incidentDescription: "My social media accounts were hacked and used to send spam and scam messages to all my contacts. The hacker also accessed my email and changed passwords.",
    methodUsed: "Likely gained access through a compromised third-party application that had access to my accounts.",
    impact: "Reputation damage, contacts received scam messages, lost access to accounts for 3 days.",
    accusedName: "Unknown Hacker",
    accusedContact: "IP address traced to overseas",
    accusedDetails: "Hacker appeared to be operating from Eastern Europe based on login timestamps.",
    evidenceDescription: "Login activity logs, screenshots of spam messages sent, recovery emails",
    status: "Resolved",
    date: "2024-03-08",
  },
  {
    id: "CYB-J1K2L3",
    complainantName: "Emily Davis",
    complainantPhone: "+1 555-321-0987",
    complainantEmail: "emily.davis@email.com",
    complainantAddress: "321 Elm Boulevard",
    complainantCity: "Houston",
    complainantState: "TX",
    complainantZip: "77001",
    recipientName: "Houston Police Department",
    recipientTitle: "Detective",
    recipientOrganization: "Cyber Crime Division",
    recipientAddress: "1200 Travis St",
    recipientCity: "Houston",
    recipientState: "TX",
    recipientZip: "77002",
    crimeType: "Digital Harassment",
    incidentDate: "2024-03-07",
    incidentTime: "Multiple times daily",
    incidentLocation: "Multiple online platforms",
    incidentDescription: "Receiving threatening and harassing messages from an unknown sender across multiple platforms including email, social media, and messaging apps.",
    methodUsed: "Creating multiple fake accounts to continue harassment after being blocked.",
    impact: "Severe emotional distress, anxiety, fear for personal safety.",
    accusedName: "Unknown",
    accusedContact: "Multiple fake social media handles",
    accusedDetails: "Suspect may be someone known to the victim based on personal details mentioned in messages.",
    evidenceDescription: "Screenshots of all threatening messages, timestamps, fake account profiles",
    status: "Under Review",
    date: "2024-03-07",
  },
  {
    id: "CYB-M4N5O6",
    complainantName: "Robert Wilson",
    complainantPhone: "+1 555-654-3210",
    complainantEmail: "r.wilson@email.com",
    complainantAddress: "654 Maple Drive",
    complainantCity: "Phoenix",
    complainantState: "AZ",
    complainantZip: "85001",
    recipientName: "Arizona Attorney General",
    recipientTitle: "Consumer Protection Division",
    recipientOrganization: "Office of the Attorney General",
    recipientAddress: "2005 N Central Ave",
    recipientCity: "Phoenix",
    recipientState: "AZ",
    recipientZip: "85004",
    crimeType: "Financial Scam",
    incidentDate: "2024-03-06",
    incidentTime: "16:45",
    incidentLocation: "Online Investment Platform",
    incidentDescription: "Lost significant funds to an investment scam promising high returns through cryptocurrency. The platform appeared legitimate but was fraudulent.",
    methodUsed: "Fake investment website with fabricated testimonials and fake trading dashboard showing artificial gains.",
    impact: "Financial loss of $25,000 in cryptocurrency investments. Unable to withdraw any funds.",
    accusedName: "CryptoGains Platform",
    accusedContact: "support@cryptogains-invest.com (now defunct)",
    accusedDetails: "Website is now offline. Company claimed to be registered in Singapore but no records found.",
    evidenceDescription: "Transaction records, website screenshots, communication with fake support, cryptocurrency wallet addresses",
    status: "Investigating",
    date: "2024-03-06",
  },
  {
    id: "CYB-P7Q8R9",
    complainantName: "Lisa Anderson",
    complainantPhone: "+1 555-789-0123",
    complainantEmail: "lisa.anderson@email.com",
    complainantAddress: "987 Cedar Lane",
    complainantCity: "Seattle",
    complainantState: "WA",
    complainantZip: "98101",
    recipientName: "Washington State Patrol",
    recipientTitle: "Cyber Crime Unit",
    recipientOrganization: "Washington State Patrol",
    recipientAddress: "PO Box 42600",
    recipientCity: "Olympia",
    recipientState: "WA",
    recipientZip: "98504",
    crimeType: "Online Fraud",
    incidentDate: "2024-03-05",
    incidentTime: "11:20",
    incidentLocation: "Fraudulent E-commerce Website",
    incidentDescription: "Purchased items from a fraudulent e-commerce website that appeared legitimate. Products were never delivered and the website has since disappeared.",
    methodUsed: "Professional-looking fake online store with stolen product images and fake reviews.",
    impact: "Financial loss of $450 for undelivered products. Credit card information potentially compromised.",
    accusedName: "BestDeals-Online.shop",
    accusedContact: "customerservice@bestdeals-online.shop",
    accusedDetails: "Website used a recently registered domain. Payment was processed through a third-party processor.",
    evidenceDescription: "Order confirmation, payment receipt, website screenshots via Wayback Machine, email correspondence",
    status: "Resolved",
    date: "2024-03-05",
  },
]

const crimeTypes = ["All", "Hacking", "Phishing", "Identity Theft", "Online Fraud", "Financial Scam", "Digital Harassment", "Data Breach", "Ransomware Attack", "Social Engineering"]

const statusColors: Record<string, string> = {
  "Under Review": "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  "Investigating": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Resolved": "bg-green-500/10 text-green-600 dark:text-green-400",
}

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCrimeType, setSelectedCrimeType] = useState("All")
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const matchesSearch =
        complaint.complainantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.incidentDescription.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCrimeType =
        selectedCrimeType === "All" || complaint.crimeType === selectedCrimeType

      return matchesSearch && matchesCrimeType
    })
  }, [searchQuery, selectedCrimeType])

  const handleDownload = async (complaint: Complaint) => {
    setDownloadingId(complaint.id)
    try {
      await generateComplaintPDF({
        complainantName: complaint.complainantName,
        complainantPhone: complaint.complainantPhone,
        complainantEmail: complaint.complainantEmail,
        complainantAddress: complaint.complainantAddress,
        complainantCity: complaint.complainantCity,
        complainantState: complaint.complainantState,
        complainantZip: complaint.complainantZip,
        recipientName: complaint.recipientName,
        recipientTitle: complaint.recipientTitle,
        recipientOrganization: complaint.recipientOrganization,
        recipientAddress: complaint.recipientAddress,
        recipientCity: complaint.recipientCity,
        recipientState: complaint.recipientState,
        recipientZip: complaint.recipientZip,
        incidentDate: complaint.incidentDate,
        incidentTime: complaint.incidentTime,
        incidentLocation: complaint.incidentLocation,
        crimeType: complaint.crimeType,
        incidentDescription: complaint.incidentDescription,
        methodUsed: complaint.methodUsed,
        impact: complaint.impact,
        accusedName: complaint.accusedName,
        accusedContact: complaint.accusedContact,
        accusedDetails: complaint.accusedDetails,
        evidenceDescription: complaint.evidenceDescription,
      }, complaint.id)
    } catch (error) {
      console.error("Error generating PDF:", error)
    }
    setDownloadingId(null)
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <LayoutGrid className="h-6 w-6 text-primary" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">Complaints Dashboard</h1>
        <p className="text-muted-foreground">
          View and manage all submitted cybercrime complaints.
        </p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>All Complaints</CardTitle>
          <CardDescription>
            {filteredComplaints.length} complaint{filteredComplaints.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or description..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCrimeType} onValueChange={setSelectedCrimeType}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {crimeTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Complaint ID</TableHead>
                    <TableHead className="font-semibold">Complainant</TableHead>
                    <TableHead className="font-semibold">Crime Type</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Incident Date</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComplaints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No complaints found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredComplaints.map((complaint) => (
                      <TableRow key={complaint.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-primary">{complaint.id}</TableCell>
                        <TableCell>{complaint.complainantName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {complaint.crimeType}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {new Date(complaint.incidentDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[complaint.status]}`}>
                            {complaint.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <span>Complaint {complaint.id}</span>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[complaint.status]}`}>
                                      {complaint.status}
                                    </span>
                                  </DialogTitle>
                                  <DialogDescription>
                                    Submitted on {new Date(complaint.date).toLocaleDateString()}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 pt-4">
                                  {/* Complainant Info */}
                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-foreground">Complainant Information</h4>
                                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                                      <div>
                                        <p className="text-muted-foreground">Name</p>
                                        <p className="text-foreground">{complaint.complainantName}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Phone</p>
                                        <p className="text-foreground">{complaint.complainantPhone}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Email</p>
                                        <p className="text-foreground">{complaint.complainantEmail}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Address</p>
                                        <p className="text-foreground">{complaint.complainantAddress}, {complaint.complainantCity}, {complaint.complainantState} {complaint.complainantZip}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Recipient Info */}
                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-foreground">Recipient Information</h4>
                                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                                      <div>
                                        <p className="text-muted-foreground">Name</p>
                                        <p className="text-foreground">{complaint.recipientName}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Organization</p>
                                        <p className="text-foreground">{complaint.recipientOrganization}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Incident Details */}
                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-foreground">Incident Details</h4>
                                    <div className="grid gap-3 sm:grid-cols-3 text-sm">
                                      <div>
                                        <p className="text-muted-foreground">Crime Type</p>
                                        <Badge variant="secondary">{complaint.crimeType}</Badge>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Date</p>
                                        <p className="text-foreground">{new Date(complaint.incidentDate).toLocaleDateString()}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Time</p>
                                        <p className="text-foreground">{complaint.incidentTime}</p>
                                      </div>
                                    </div>
                                    <div className="text-sm">
                                      <p className="text-muted-foreground">Description</p>
                                      <p className="text-foreground leading-relaxed">{complaint.incidentDescription}</p>
                                    </div>
                                    <div className="text-sm">
                                      <p className="text-muted-foreground">Methods Used</p>
                                      <p className="text-foreground leading-relaxed">{complaint.methodUsed}</p>
                                    </div>
                                    <div className="text-sm">
                                      <p className="text-muted-foreground">Impact</p>
                                      <p className="text-foreground leading-relaxed">{complaint.impact}</p>
                                    </div>
                                  </div>

                                  {/* Accused Info */}
                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-foreground">Accused Party Information</h4>
                                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                                      <div>
                                        <p className="text-muted-foreground">Name</p>
                                        <p className="text-foreground">{complaint.accusedName}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Contact</p>
                                        <p className="text-foreground">{complaint.accusedContact}</p>
                                      </div>
                                    </div>
                                    <div className="text-sm">
                                      <p className="text-muted-foreground">Additional Details</p>
                                      <p className="text-foreground leading-relaxed">{complaint.accusedDetails}</p>
                                    </div>
                                  </div>

                                   {/* Evidence */}
                                   <div className="space-y-3">
                                     <h4 className="font-semibold text-foreground">Evidence</h4>
                                     <div className="text-sm">
                                       <p className="text-foreground leading-relaxed">{complaint.evidenceDescription}</p>
                                     </div>
                                   </div>

                                   {/* AI Evidence Analysis */}
                                   {(complaint as any).ocr_text && (
                                     <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                                       <h4 className="font-semibold text-primary flex items-center gap-2">
                                         <Badge variant="outline" className="text-[10px] h-4">AI Analysis</Badge>
                                         Evidence Insights
                                       </h4>
                                       
                                       { (complaint as any).auto_generated_description && (
                                         <div className="text-sm">
                                           <p className="text-muted-foreground mb-1 font-medium italic">AI Summary</p>
                                           <p className="text-foreground leading-relaxed">{(complaint as any).auto_generated_description}</p>
                                         </div>
                                       )}

                                       { (complaint as any).ocr_text && (
                                         <div className="text-sm">
                                           <p className="text-muted-foreground mb-1 font-medium">Extracted Text</p>
                                           <div className="p-2 rounded bg-background/50 border border-border text-xs font-mono whitespace-pre-wrap">
                                             {(complaint as any).ocr_text}
                                           </div>
                                         </div>
                                       )}

                                       { (complaint as any).detected_urls && (
                                         <div className="text-sm">
                                           <p className="text-muted-foreground mb-1 font-medium">Flagged URLs</p>
                                           <p className="text-destructive font-mono truncate text-xs">{(complaint as any).detected_urls}</p>
                                         </div>
                                       )}
                                     </div>
                                   )}

                                  {/* Download Button */}
                                  <Button
                                    onClick={() => handleDownload(complaint)}
                                    disabled={downloadingId === complaint.id}
                                    className="w-full"
                                  >
                                    {downloadingId === complaint.id ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating PDF...
                                      </>
                                    ) : (
                                      <>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Complaint Report
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(complaint)}
                              disabled={downloadingId === complaint.id}
                            >
                              {downloadingId === complaint.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
