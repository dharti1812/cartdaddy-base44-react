import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PerformanceMetrics({ orders, loading }) {
  const calculateMetrics = () => {
    const delivered = orders.filter(o => o.delivery_status === 'delivered');
    const total = orders.length;
    
    const onTime = delivered.filter(o => {
      if (!o.estimated_delivery_time || !o.actual_delivery_time) return false;
      return new Date(o.actual_delivery_time) <= new Date(o.estimated_delivery_time);
    }).length;

    const avgDeliveryTime = delivered.reduce((sum, o) => {
      if (!o.created_date || !o.actual_delivery_time) return sum;
      const diff = (new Date(o.actual_delivery_time) - new Date(o.created_date)) / (1000 * 60);
      return sum + diff;
    }, 0) / (delivered.length || 1);

    return {
      deliveryRate: total > 0 ? ((delivered.length / total) * 100).toFixed(1) : 0,
      onTimeRate: delivered.length > 0 ? ((onTime / delivered.length) * 100).toFixed(1) : 0,
      avgTime: avgDeliveryTime.toFixed(0)
    };
  };

  const metrics = calculateMetrics();

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="border-b bg-white">
        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Delivery Success Rate</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-blue-700">{metrics.deliveryRate}%</p>
                <div className="w-16 h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${metrics.deliveryRate}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">On-Time Delivery</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-green-700">{metrics.onTimeRate}%</p>
                <div className="w-16 h-2 bg-green-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-600 rounded-full transition-all duration-500"
                    style={{ width: `${metrics.onTimeRate}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Avg. Delivery Time</p>
              <p className="text-3xl font-bold text-purple-700">{metrics.avgTime}<span className="text-lg ml-1">min</span></p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}