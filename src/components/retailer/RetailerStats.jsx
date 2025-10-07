import React from 'react';
import { Card } from "@/components/ui/card";
import { Package, TrendingUp, Star } from "lucide-react";

export default function RetailerStats({ retailer, activeOrders, completedToday }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-2 border-[#F4B321] p-2 sm:p-3">
        <div className="flex flex-col items-center text-center">
          <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[#F4B321] mb-1" />
          <p className="text-lg sm:text-2xl font-bold text-white">{activeOrders}</p>
          <p className="text-[10px] sm:text-xs text-[#F4B321] font-semibold">Active</p>
        </div>
      </Card>
      
      <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-2 border-[#F4B321] p-2 sm:p-3">
        <div className="flex flex-col items-center text-center">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#F4B321] mb-1" />
          <p className="text-lg sm:text-2xl font-bold text-white">{completedToday}</p>
          <p className="text-[10px] sm:text-xs text-[#F4B321] font-semibold">Today</p>
        </div>
      </Card>
      
      <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-2 border-[#F4B321] p-2 sm:p-3">
        <div className="flex flex-col items-center text-center">
          <Star className="w-4 h-4 sm:w-5 sm:h-5 text-[#F4B321] mb-1 fill-[#F4B321]" />
          <p className="text-lg sm:text-2xl font-bold text-white">{retailer.rating?.toFixed(1) || '0.0'}</p>
          <p className="text-[10px] sm:text-xs text-[#F4B321] font-semibold">Rating</p>
        </div>
      </Card>
    </div>
  );
}