import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, TrendingUp, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";

export default function DeliveryBoyStats({ deliveryBoy, orders, retailerId }) {
  const [timeFilter, setTimeFilter] = useState('today');

  const getFilteredOrders = () => {
    const now = new Date();
    let startDate;

    switch (timeFilter) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now);
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        break;
      default:
        return orders;
    }

    return orders.filter(order => 
      order.assigned_delivery_boy?.id === deliveryBoy.id &&
      order.status === 'delivered' &&
      new Date(order.created_date) >= startDate
    );
  };

  const calculateStats = () => {
    const filteredOrders = getFilteredOrders();
    
    const totalDeliveries = filteredOrders.length;
    const totalEarnings = (filteredOrders.reduce((sum, o) => sum + (o.total_amount * 0.1), 0)).toFixed(0);
    const totalMapDistance = filteredOrders.reduce((sum, o) => sum + (o.distance_km || 0), 0);
    const totalActualDistance = filteredOrders.reduce((sum, o) => sum + (o.actual_distance_traveled || o.distance_km || 0), 0);
    const deviationPercent = totalMapDistance > 0 ? (((totalActualDistance - totalMapDistance) / totalMapDistance) * 100).toFixed(1) : 0;

    return {
      totalDeliveries,
      totalEarnings,
      totalMapDistance: totalMapDistance.toFixed(1),
      totalActualDistance: totalActualDistance.toFixed(1),
      deviationPercent
    };
  };

  const stats = calculateStats();

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b bg-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">My Stats</CardTitle>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-600">Deliveries</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{stats.totalDeliveries}</p>
          </div>

          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-600">Earnings</span>
            </div>
            <p className="text-2xl font-bold text-green-700">₹{stats.totalEarnings}</p>
          </div>

          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-gray-600">Distance</span>
            </div>
            <p className="text-lg font-bold text-purple-700">{stats.totalActualDistance} km</p>
          </div>

          <div className={`p-3 border rounded-lg ${
            parseFloat(stats.deviationPercent) > 15 
              ? 'bg-red-50 border-red-300' 
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Star className={`w-4 h-4 ${
                parseFloat(stats.deviationPercent) > 15 ? 'text-red-600' : 'text-amber-600'
              }`} />
              <span className="text-xs text-gray-600">Deviation</span>
            </div>
            <p className={`text-lg font-bold ${
              parseFloat(stats.deviationPercent) > 15 ? 'text-red-700' : 'text-amber-700'
            }`}>{stats.deviationPercent}%</p>
          </div>
        </div>

        {parseFloat(stats.deviationPercent) > 15 && (
          <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
            <p className="text-xs text-red-900 font-semibold">
              ⚠️ High route deviation detected. Stick to GPS routes for better ratings!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}