import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Store,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
} from "lucide-react";

export default function RetailerVerificationCard({ retailer, onClick }) {
  const user = retailer.user || {}; // fallback if user is null
  const bank = retailer.bank_information || {};
  const gst = retailer.gst_information || {};
 let shopPhotos = [];

  try {
    shopPhotos =
      typeof retailer.shop_photos === "string"
        ? JSON.parse(retailer.shop_photos)
        : Array.isArray(retailer.shop_photos)
        ? retailer.shop_photos
        : [];
  } catch (error) {
    console.error("Error parsing shop_photos:", error);
    shopPhotos = [];
  }

  const photosCount = shopPhotos.length;

  return (
    <Card
      className="border-2 border-amber-200 hover:border-amber-400 transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Store className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                {retailer.name && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {retailer.name}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{user?.phone}</span>
              </div>
              {user?.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Badge
                className={
                  user?.phone
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }
              >
                {user?.phone ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <XCircle className="w-3 h-3 mr-1" />
                )}
                Phone
              </Badge>
              <Badge
                className={
                  user?.email
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }
              >
                {user?.email ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <XCircle className="w-3 h-3 mr-1" />
                )}
                Email
              </Badge>
              <Badge
                className={
                  retailer.gst_verified
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }
              >
                {retailer.gst_verified ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <XCircle className="w-3 h-3 mr-1" />
                )}
                GST
              </Badge>
              <Badge
                className={
                  retailer.bank_verified
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }
              >
                {retailer.bank_verified ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <XCircle className="w-3 h-3 mr-1" />
                )}
                Bank
              </Badge>

              <Badge
                className={`flex items-center ${
                  photosCount > 0
                    ? "bg-amber-100 text-amber-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {photosCount > 0 ? (
                  <Clock className="w-3 h-3 mr-1" />
                ) : (
                  <XCircle className="w-3 h-3 mr-1" />
                )}
                {photosCount} Photos
              </Badge>
            </div>
          </div>

          <Button className="bg-[#F4B321] hover:bg-[#F4B321] hover:opacity-90 text-gray-900 font-bold">
            Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
