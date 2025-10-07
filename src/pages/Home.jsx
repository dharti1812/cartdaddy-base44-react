import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Store, Bike, Shield, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54]">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e16ead60e37f9dc085ad75/659db8ff0_aaaaa.png" 
          alt="Cart Daddy Logo" 
          className="h-32 w-auto mx-auto mb-8"
        />
        
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Cart Daddy
        </h1>
        <p className="text-2xl text-[#F4B321] font-semibold mb-4">
          Last-Mile Delivery Platform
        </p>
        <p className="text-xl text-white text-opacity-90 max-w-2xl mx-auto mb-12">
          Connect sellers, delivery partners, and customers in a seamless delivery ecosystem
        </p>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Seller Card */}
          <Card className="border-2 border-[#F4B321] hover:shadow-2xl transition-all">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-[#F4B321] rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-gray-900" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">I'm a Seller</h3>
              <p className="text-gray-600 text-sm mb-4">
                Register your shop and start accepting delivery orders
              </p>
              <Link to={createPageUrl('PortalSelector')}>
                <Button className="w-full bg-[#075E66] hover:bg-[#064d54] text-white font-bold">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Delivery Partner Card */}
          <Card className="border-2 border-green-500 hover:shadow-2xl transition-all">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bike className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">I'm a Delivery Partner</h3>
              <p className="text-gray-600 text-sm mb-4">
                Work with multiple sellers and earn on every delivery
              </p>
              <Link to={createPageUrl('PortalSelector')}>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold">
                  Join Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Admin Card */}
          <Card className="border-2 border-purple-500 hover:shadow-2xl transition-all">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Admin Access</h3>
              <p className="text-gray-600 text-sm mb-4">
                Manage the entire platform and monitor operations
              </p>
              <Link to={createPageUrl('Dashboard')}>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold">
                  Admin Login
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}