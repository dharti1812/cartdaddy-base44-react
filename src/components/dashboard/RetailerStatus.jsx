import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL } from "@/config";

export default function RetailerStatus() {
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchRetailers = async () => {
      try {
        const token = sessionStorage.getItem("token");

        const response = await fetch(
          `${API_BASE_URL}/api/approvedSellersStatus`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json(); // ✅ Parse JSON response
        setRetailers(data); // ✅ Store API data
      } catch (error) {
        console.error("Error fetching retailer data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRetailers();
  }, []);

  const onlineRetailers = retailers.filter(
    (r) => r.availability_status === "online"
  );
  const topRetailers = retailers
    .filter((r) => r.successful_deliveries)
    .sort((a, b) => b.successful_deliveries - a.successful_deliveries)
    .slice(0, 5);

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="border-b bg-white">
        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Retailer Status
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="space-y-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Currently Online</p>
                  <p className="text-2xl font-bold text-green-700">
                    {onlineRetailers.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Top Performers
              </h3>
              <div className="space-y-3">
                {topRetailers.map((retailer, index) => (
                  <div
                    key={retailer.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-700">
                          {retailer.full_name?.[0]?.toUpperCase() || "R"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {retailer.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {retailer.successful_deliveries || 0} deliveries
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-gray-900">
                        {retailer.rating?.toFixed(1) || "0.0"}
                      </span>
                    </div>
                  </div>
                ))}
                {topRetailers.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No retailer data yet
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
