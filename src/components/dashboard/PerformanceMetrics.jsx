import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PerformanceMetrics({ orders, loading }) {
  const calculateMetrics = () => {
    let deliveredItems = 0;
    let onTimeItems = 0;
    let totalMinutes = 0;

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const actual = item.actual_delivery_time
          ? new Date(item.actual_delivery_time)
          : null;

        const estimated = item.estimated_delivery_time
          ? new Date(item.estimated_delivery_time)
          : null;

        if (actual) {
          deliveredItems++;

          if (estimated && actual <= estimated) {
            onTimeItems++;
          }
         
          if (estimated) {
            let minutes = (actual - estimated) / (1000 * 60);
            if (minutes < 0) minutes = 0;
            totalMinutes += minutes;
          }
        }
      });
    });

    return {
      deliveryRate:
        orders.length > 0
          ? ((deliveredItems / orders.length) * 100).toFixed(1)
          : 0,

      onTimeRate:
        deliveredItems > 0
          ? ((onTimeItems / deliveredItems) * 100).toFixed(1)
          : 0,

      avgTime:
        deliveredItems > 0 ? Math.round(totalMinutes / deliveredItems) : 0,
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
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
          </div>
        ) : (
          <div className="space-y-4">
           
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">
                Delivery Success Rate
              </p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-blue-700">
                  {metrics.deliveryRate}%
                </p>
                <div className="w-16 h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${metrics.deliveryRate}%` }}
                  />
                </div>
              </div>
            </div>

            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">On-Time Delivery</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-green-700">
                  {metrics.onTimeRate}%
                </p>
                <div className="w-16 h-2 bg-green-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 rounded-full"
                    style={{ width: `${metrics.onTimeRate}%` }}
                  />
                </div>
              </div>
            </div>

           
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Avg. Delivery Time</p>
              <p className="text-3xl font-bold text-purple-700">
                {metrics.avgTime}
                <span className="text-lg ml-1">min</span>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
