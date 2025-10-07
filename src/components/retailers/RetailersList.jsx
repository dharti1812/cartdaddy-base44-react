import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Star, Bike, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const vehicleIcons = {
  bike: Bike,
  scooter: Bike,
  car: Bike,
  bicycle: Bike,
  van: Bike
};

export default function RetailersList({ retailers, loading, onSelectRetailer, selectedRetailerId }) {
  if (loading) {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="p-4 space-y-3">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (retailers.length === 0) {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="p-12 text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No retailers found</h3>
          <p className="text-gray-500">Try adjusting your filters</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-md">
      <CardContent className="p-0">
        <div className="divide-y">
          {retailers.map((retailer) => {
            const VehicleIcon = vehicleIcons[retailer.vehicle_type] || Bike;
            return (
              <div
                key={retailer.id}
                onClick={() => onSelectRetailer(retailer)}
                className={`p-4 cursor-pointer transition-all duration-200 ${
                  selectedRetailerId === retailer.id 
                    ? 'bg-blue-50 border-l-4 border-l-blue-600' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {retailer.full_name?.[0]?.toUpperCase() || 'R'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{retailer.full_name}</h3>
                        {retailer.availability_status === 'online' && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                            Online
                          </Badge>
                        )}
                        {retailer.status === 'active' ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-700">
                            {retailer.status}
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {retailer.priority_tier?.replace('tier_', 'Tier ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>{retailer.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <VehicleIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="capitalize">{retailer.vehicle_type}</span>
                          {retailer.vehicle_number && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="font-mono text-xs">{retailer.vehicle_number}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Package className="w-4 h-4 flex-shrink-0" />
                          <span>{retailer.total_deliveries || 0} deliveries</span>
                          {retailer.successful_deliveries && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-green-600 font-medium">
                                {((retailer.successful_deliveries / (retailer.total_deliveries || 1)) * 100).toFixed(0)}% success
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    {retailer.rating && (
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-lg font-bold text-gray-900">{retailer.rating.toFixed(1)}</span>
                      </div>
                    )}
                    <p className="text-sm font-semibold text-gray-900">₹{retailer.total_earnings || 0}</p>
                    <p className="text-xs text-gray-500">Total earned</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}