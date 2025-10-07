import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Mail, MessageSquare, Smartphone } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PaymentLinkSimulator({ order, paylinkUrl }) {
  if (!paylinkUrl) return null;

  const channels = order.customer_payment_preference || [];

  return (
    <Card className="border-2 border-green-500 shadow-lg">
      <CardHeader className="bg-green-50 border-b border-green-200">
        <CardTitle className="text-green-900 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Payment Link Sent Successfully (SIMULATED)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-900 text-sm">
            <strong>🎯 Demo Mode:</strong> In production, this link would be sent via integrated services (Twilio, SendGrid, etc.)
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Payment Link Generated:</p>
            <div className="p-3 bg-gray-100 rounded border border-gray-300 break-all text-sm font-mono">
              {paylinkUrl}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Customer Details:</p>
            <div className="space-y-1 text-sm">
              <p><strong>Name:</strong> {order.customer_name}</p>
              <p><strong>Phone:</strong> {order.customer_masked_contact}</p>
              <p><strong>Email:</strong> {order.notes?.includes('email:') ? order.notes.split('email:')[1].trim() : 'Not provided'}</p>
              <p><strong>Amount:</strong> ₹{order.total_amount}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Would be sent via:</p>
            <div className="flex flex-wrap gap-2">
              {channels.includes('sms') && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  SMS to +91 9794301234
                </Badge>
              )}
              {channels.includes('whatsapp') && (
                <Badge className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  WhatsApp to +91 9794301234
                </Badge>
              )}
              {channels.includes('email') && (
                <Badge className="bg-purple-100 text-purple-800 border-purple-300 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Email to abhi1.alld@gmail.com
                </Badge>
              )}
              {channels.includes('app') && (
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  Push Notification
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-600">
            <strong>📱 Message Preview:</strong><br/>
            "Hello {order.customer_name}, please complete payment of ₹{order.total_amount} for your order {order.website_ref}. Click: {paylinkUrl}"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}