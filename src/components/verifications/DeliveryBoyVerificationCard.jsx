import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCheck, Phone, Mail, FileText, CheckCircle, XCircle, Clock, Bike, Car } from "lucide-react";

export default function DeliveryBoyVerificationCard({ deliveryBoy, onClick }) {
  return (
    <Card className="border-2 border-green-200 hover:border-green-400 transition-all cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{deliveryBoy.full_name}</h3>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  {deliveryBoy.vehicle_type === '2_wheeler' ? (
                    <><Bike className="w-3 h-3" /> 2-Wheeler</>
                  ) : (
                    <><Car className="w-3 h-3" /> 4-Wheeler</>
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{deliveryBoy.phone}</span>
              </div>
              {deliveryBoy.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{deliveryBoy.email}</span>
                </div>
              )}
              {deliveryBoy.driving_license && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span className="font-mono text-xs">{deliveryBoy.driving_license}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Badge className={deliveryBoy.phone_verified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                {deliveryBoy.phone_verified ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                Phone
              </Badge>
              <Badge className={deliveryBoy.email_verified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                {deliveryBoy.email_verified ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                Email
              </Badge>
              <Badge className={deliveryBoy.driving_license_verified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                {deliveryBoy.driving_license_verified ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                DL
              </Badge>
              <Badge className={deliveryBoy.bank_verified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                {deliveryBoy.bank_verified ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                Bank
              </Badge>
              <Badge className={deliveryBoy.selfie_url ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                {deliveryBoy.selfie_url ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                Selfie
              </Badge>
            </div>
          </div>

          <Button className="bg-green-600 hover:bg-green-700 text-white font-bold">
            Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}