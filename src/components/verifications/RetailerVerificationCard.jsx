import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, Phone, Mail, MapPin, CheckCircle, XCircle, Clock, Building2 } from "lucide-react";

export default function RetailerVerificationCard({ retailer, onClick }) {
  return (
    <Card className="border-2 border-amber-200 hover:border-amber-400 transition-all cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Store className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{retailer.full_name}</h3>
                {retailer.business_name && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {retailer.business_name}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{retailer.phone}</span>
              </div>
              {retailer.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{retailer.email}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Badge className={retailer.phone_verified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                {retailer.phone_verified ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                Phone
              </Badge>
              <Badge className={retailer.email_verified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                {retailer.email_verified ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                Email
              </Badge>
              <Badge className={retailer.gst_verified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                {retailer.gst_verified ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                GST
              </Badge>
              <Badge className={retailer.bank_verified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                {retailer.bank_verified ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                Bank
              </Badge>
              <Badge className="bg-amber-100 text-amber-800">
                <Clock className="w-3 h-3 mr-1" />
                {retailer.shop_photos?.length || 0} Photos
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