import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Phone,
  Calendar,
  Download,
  Search
} from "lucide-react";
import { journeyApi } from "@/components/utils/journeyApi";

export default function JourneysPage() {
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);

  // pagination
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const perPage = 10;

  // search
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadJourneys(page);
  }, [page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const loadJourneys = async (pageNo = 1) => {
    setLoading(true);
    try {
      const data = await journeyApi.list(pageNo, perPage, search);

      if (data.status === "success") {
        setJourneys(data.data);
        setPage(data.meta.current_page);
        setLastPage(data.meta.last_page);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatDMY = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const downloadVCard = async (journey) => {
    const firstName = journey.name?.split(" ")[0] || journey.name;
    const lastName = journey.name?.split(" ").slice(1).join(" ") || "";

    const mobiles = Array.isArray(journey.additional_mobiles)
      ? journey.additional_mobiles
      : [];

    const formatIndianNumber = (number) => {
      if (!number) return "";
      return number.startsWith("+") ? number : `+91${number}`;
    };


    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${lastName};${firstName};;;`,
      `FN:${journey.name}`,
      `TEL;TYPE=CELL,VOICE:${formatIndianNumber(journey.mobile)}`,
      ...mobiles.map(m => `TEL;TYPE=CELL,VOICE:${formatIndianNumber(m)}`),
      journey.dob ? `BDAY:${journey.dob.replace(/-/g, "")}` : null,
      journey.doa ? `X-ANNIVERSARY:${journey.doa.replace(/-/g, "")}` : null,
      "END:VCARD"
    ].filter(Boolean);


    const vCard = lines.join("\r\n");

    const blob = new Blob([vCard], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${journey.name.replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    await journeyApi.recordVCardDownload(journey.id);

    loadJourneys(page);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#064d54] text-white">
        Loading Recipients...
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54]">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white">Recipients</h1>

        <Card className="shadow-xl">
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <CardTitle>Recipients</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Search name or mobile"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Additional Mobiles</TableHead>
                  <TableHead>DOB</TableHead>
                  <TableHead>DOA</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {journeys.map((journey, index) => (
                  <TableRow key={journey.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-semibold">{journey.name}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      {journey.mobile}
                      {journey.vcard_download_count > 0 && (
                        <Badge className="ml-2 bg-blue-100 text-blue-700 text-xs">
                          Downloaded ({journey.vcard_download_count})
                        </Badge>
                      )}

                    </TableCell>

                    <TableCell>
                      {Array.isArray(journey.additional_mobiles) &&
                        journey.additional_mobiles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {journey.additional_mobiles.map((mobile, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-gray-500" />
                              {mobile}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {journey.dob ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          {formatDMY(journey.dob)}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>

                    <TableCell>
                      {journey.doa ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          {formatDMY(journey.doa)}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>

                    <TableCell>
                      {formatDMY(journey.created_at)}
                    </TableCell>

                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadVCard(journey)}
                        className="gap-2"
                      >
                      <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex justify-between items-center p-4 border-t">
              <span className="text-sm text-gray-600">
                Page {page} of {lastPage}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === lastPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
