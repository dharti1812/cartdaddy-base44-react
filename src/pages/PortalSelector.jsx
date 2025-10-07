
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, Bike, Shield, ShieldCheck } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function PortalSelector() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center p-4 font-sans">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e16ead60e37f9dc085ad75/659db8ff0_aaaaa.png"
            alt="Cart Daddy"
            className="h-24 mx-auto mb-6"
          />
          <h1 className="text-5xl font-bold text-white mb-2">Cart Daddy Platform</h1>
          <p className="text-[#FFEB3B] text-2xl">Choose your portal to continue</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Seller Portal */}
          <Card className="border-2 border-[#FFEB3B] shadow-xl hover:shadow-2xl transition-all cursor-pointer bg-white" onClick={() => window.location.href = createPageUrl("RetailerLogin")}>
            <CardHeader className="text-center bg-[#075E66] text-white rounded-t-lg p-6 border-b-4 border-[#FFEB3B]">
              <Store className="w-16 h-16 mx-auto mb-3 text-[#FFEB3B]" />
              <CardTitle className="text-2xl">Seller Portal</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <p className="text-black text-lg mb-4">For shop owners and sellers</p>
              <Button className="w-full bg-[#FFEB3B] hover:opacity-90 text-black font-bold border-2 border-[#075E66] text-lg py-6">
                Access Portal
              </Button>
            </CardContent>
          </Card>

          {/* Delivery Partner Portal */}
          <Card className="border-2 border-[#FFEB3B] shadow-xl hover:shadow-2xl transition-all cursor-pointer bg-white" onClick={() => window.location.href = createPageUrl("DeliveryBoyLogin")}>
            <CardHeader className="text-center bg-[#075E66] text-white rounded-t-lg p-6 border-b-4 border-[#FFEB3B]">
              <Bike className="w-16 h-16 mx-auto mb-3 text-[#FFEB3B]" />
              <CardTitle className="text-2xl">Delivery Portal</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <p className="text-black text-lg mb-4">For delivery partners</p>
              <Button className="w-full bg-[#FFEB3B] hover:opacity-90 text-black font-bold border-2 border-[#075E66] text-lg py-6">
                Access Portal
              </Button>
            </CardContent>
          </Card>

          {/* Admin Portal */}
          <Card className="border-2 border-[#FFEB3B] shadow-xl hover:shadow-2xl transition-all cursor-pointer bg-white" onClick={() => window.location.href = createPageUrl("AdminLogin")}>
            <CardHeader className="text-center bg-[#075E66] text-white rounded-t-lg p-6 border-b-4 border-[#FFEB3B]">
              <Shield className="w-16 h-16 mx-auto mb-3 text-[#FFEB3B]" />
              <CardTitle className="text-2xl">Admin Panel</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <p className="text-black text-lg mb-4">For admin staff</p>
              <Button className="w-full bg-[#FFEB3B] hover:opacity-90 text-black font-bold border-2 border-[#075E66] text-lg py-6">
                Admin Login
              </Button>
            </CardContent>
          </Card>

          {/* Super Admin Portal */}
          <Card className="border-2 border-[#FFEB3B] shadow-xl hover:shadow-2xl transition-all cursor-pointer bg-white" onClick={() => window.location.href = createPageUrl("SuperAdminLogin")}>
            <CardHeader className="text-center bg-[#075E66] text-white rounded-t-lg p-6 border-b-4 border-[#FFEB3B]">
              <ShieldCheck className="w-16 h-16 mx-auto mb-3 text-[#FFEB3B]" />
              <CardTitle className="text-2xl">Super Admin</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <p className="text-black text-lg mb-4">Highest level access</p>
              <Button className="w-full bg-[#FFEB3B] hover:opacity-90 text-black font-bold border-2 border-[#075E66] text-lg py-6">
                Super Admin Login
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-white text-base">
            © 2024 Cart Daddy. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
