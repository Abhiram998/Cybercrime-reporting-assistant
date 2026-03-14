"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Filter, ChevronDown, Eye, LayoutGrid } from "lucide-react"
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

// Sample data
const complaints = [
  {
    id: "CYB-001",
    name: "John Smith",
    crimeType: "Online Fraud",
    description: "Received a suspicious email claiming to be from my bank asking for login credentials. After entering details, my account was compromised.",
    transactionId: "TXN-78945612",
    status: "Under Review",
    date: "2024-03-10",
  },
  {
    id: "CYB-002",
    name: "Sarah Johnson",
    crimeType: "Phishing",
    description: "Clicked on a fake website link that looked like my company's login page. Personal information was stolen.",
    transactionId: "N/A",
    status: "Investigating",
    date: "2024-03-09",
  },
  {
    id: "CYB-003",
    name: "Michael Brown",
    crimeType: "Account Hacking",
    description: "My social media accounts were hacked and used to send spam messages to my contacts.",
    transactionId: "N/A",
    status: "Resolved",
    date: "2024-03-08",
  },
  {
    id: "CYB-004",
    name: "Emily Davis",
    crimeType: "Digital Harassment",
    description: "Receiving threatening messages from an unknown sender across multiple platforms.",
    transactionId: "N/A",
    status: "Under Review",
    date: "2024-03-07",
  },
  {
    id: "CYB-005",
    name: "Robert Wilson",
    crimeType: "Financial Scam",
    description: "Lost funds to an investment scam promising high returns through cryptocurrency.",
    transactionId: "TXN-32165498",
    status: "Investigating",
    date: "2024-03-06",
  },
  {
    id: "CYB-006",
    name: "Lisa Anderson",
    crimeType: "Online Fraud",
    description: "Purchased items from a fraudulent e-commerce website that never delivered.",
    transactionId: "TXN-65478932",
    status: "Resolved",
    date: "2024-03-05",
  },
  {
    id: "CYB-007",
    name: "David Martinez",
    crimeType: "Phishing",
    description: "Received a call from someone impersonating tech support and gained remote access to computer.",
    transactionId: "N/A",
    status: "Under Review",
    date: "2024-03-04",
  },
  {
    id: "CYB-008",
    name: "Jennifer Taylor",
    crimeType: "Account Hacking",
    description: "Email account compromised and used to reset passwords for other services.",
    transactionId: "N/A",
    status: "Investigating",
    date: "2024-03-03",
  },
]

const crimeTypes = ["All", "Online Fraud", "Phishing", "Account Hacking", "Digital Harassment", "Financial Scam"]

const statusColors: Record<string, string> = {
  "Under Review": "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  "Investigating": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Resolved": "bg-green-500/10 text-green-600 dark:text-green-400",
}

export default function DashboardPage() {
  const [complaintsData, setComplaintsData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCrimeType, setSelectedCrimeType] = useState("All")

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/get-complaints`)
        if (!response.ok) throw new Error("Failed to fetch complaints")
        const data = await response.json()
        
        // Map backend data to frontend structure
        const mappedData = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          crimeType: c.crime_type,
          status: c.status,
          date: c.created_at,
          description: c.description || "",
          transactionId: c.transaction_id || "N/A",
          pdfUrl: c.pdf_url
        }))
        
        setComplaintsData(mappedData)
      } catch (error) {
        console.error("Fetch Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchComplaints()
  }, [])

  const filteredComplaints = useMemo(() => {
    return complaintsData.filter((complaint) => {
      const matchesSearch =
        complaint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCrimeType =
        selectedCrimeType === "All" || complaint.crimeType === selectedCrimeType

      return matchesSearch && matchesCrimeType
    })
  }, [searchQuery, selectedCrimeType, complaintsData])

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
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Crime Type</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Description</TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">Transaction ID</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComplaints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No complaints found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredComplaints.map((complaint) => (
                      <TableRow key={complaint.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-primary">{complaint.id}</TableCell>
                        <TableCell>{complaint.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {complaint.crimeType}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px] truncate text-muted-foreground">
                          {complaint.description}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {complaint.transactionId}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[complaint.status]}`}>
                            {complaint.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
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
                              <div className="space-y-4 pt-4">
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Complainant</h4>
                                  <p className="text-foreground">{complaint.name}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Crime Type</h4>
                                  <Badge variant="secondary">{complaint.crimeType}</Badge>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                                  <p className="text-foreground text-sm leading-relaxed">{complaint.description}</p>
                                </div>
                                  <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Transaction ID</h4>
                                    <p className="text-foreground">{complaint.transactionId}</p>
                                  </div>
                                  {complaint.pdfUrl && (
                                    <div className="pt-4 border-t border-border">
                                      <Button className="w-full flex items-center justify-center gap-2" asChild>
                                        <a href={complaint.pdfUrl} target="_blank" rel="noopener noreferrer">
                                          Download Professional PDF Report
                                        </a>
                                      </Button>
                                    </div>
                                  )}
                                </div>
                            </DialogContent>
                          </Dialog>
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
