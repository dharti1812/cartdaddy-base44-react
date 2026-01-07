import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { journeyApi } from "@/components/utils/journeyApi";
import {
  Plus,
  Search,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function JourneysPage() {
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    mobile: "",
    name: "",
    additional_mobiles: [],
    dob: "",
    doa: "",
    isVerified: false,
  });

  useEffect(() => {
    loadJourneys();
  }, []);

  const downloadVCard = (journey) => {
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${journey.name}
TEL;TYPE=CELL:${journey.mobile}
${
  journey.additional_mobiles
    ?.map((mobile) => `TEL;TYPE=CELL:${mobile}`)
    .join("\n") || ""
}
${journey.dob ? `BDAY:${journey.dob.replace(/-/g, "")}` : ""}
${journey.doa ? `X-ANNIVERSARY:${journey.doa.replace(/-/g, "")}` : ""}
END:VCARD`;

    const blob = new Blob([vCard], { type: "text/vcard" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${journey.name.replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };
    
    const formatDMY = (date) => {
        if (!date) return "-";

        const d = new Date(date);

        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();

        return `${day}/${month}/${year}`;
    };


  const loadJourneys = async () => {
    setLoading(true);
    try {
      const result = await journeyApi.list();

      if (result.status === "success") {
        setJourneys(result.data);
      } else {
        console.error("API error:", result);
      }
    } catch (error) {
      console.error("Error loading journeys:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      // Replace with actual API call
      console.log("Creating journey:", formData);
      setShowCreateDialog(false);
      loadJourneys();
    } catch (error) {
      console.error("Error creating journey:", error);
    }
  };

  const filteredJourneys = journeys.filter(
    (j) =>
      !searchTerm ||
      j.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.mobile?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFEB3B] mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading Journeys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-[#075E66] to-[#064d54] min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Journeys</h1>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-[#FFEB3B] text-black hover:bg-[#FFEB3B] hover:opacity-90 font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Journey
          </Button>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <CardTitle>All Journeys ({filteredJourneys.length})</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name or mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="font-bold text-black">ID</TableHead>
                    <TableHead className="font-bold text-black">
                      Mobile
                    </TableHead>
                    <TableHead className="font-bold text-black">Name</TableHead>
                    <TableHead className="font-bold text-black">
                      Additional Mobiles
                    </TableHead>
                    <TableHead className="font-bold text-black">DOB</TableHead>
                    <TableHead className="font-bold text-black">DOA</TableHead>
                    <TableHead className="font-bold text-black">
                      Verified
                    </TableHead>
                    <TableHead className="font-bold text-black">
                      Created Date
                    </TableHead>
                    
                    <TableHead className="font-bold text-black">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJourneys.map((journey) => (
                    <TableRow key={journey.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {journey.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          {journey.mobile}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {journey.name}
                      </TableCell>
                      <TableCell>
                        {journey.additional_mobiles?.length > 0 ? (
                          <div className="space-y-1">
                            {journey.additional_mobiles.map((mobile, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs"
                              >
                                {mobile}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {journey.dob ? (
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                {formatDMY(journey.dob)}
                            </div>
                        ) : (
                            <span className="text-gray-400 text-sm">-</span>
                        )}
                    </TableCell>

                      <TableCell>
                        {journey.doa ? (
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                {formatDMY(journey.doa)}
                            </div>
                        ) : (
                            <span className="text-gray-400 text-sm">-</span>
                        )}
                    </TableCell>

                      <TableCell>
                        {journey.isVerified ? (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-400 text-white">
                            <XCircle className="w-3 h-3 mr-1" />
                            Not Verified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                            {new Date(journey.created_date).toLocaleDateString("en-GB")}
                        </TableCell>

                      
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadVCard(journey)}
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          vCard
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Journey</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Mobile *</Label>
              <Input
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({ ...formData, mobile: e.target.value })
                }
                placeholder="9876543210"
              />
            </div>
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Full name"
              />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={formData.dob}
                onChange={(e) =>
                  setFormData({ ...formData, dob: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Date of Anniversary</Label>
              <Input
                type="date"
                value={formData.doa}
                onChange={(e) =>
                  setFormData({ ...formData, doa: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-[#075E66] text-white"
              disabled={!formData.mobile || !formData.name}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
