import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Package, Users, TrendingUp, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsOverview({ stats, loading, onStatClick }) {
  const statCards = [
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: Package,
      color: "blue",
      bgColor: "bg-blue-500",
      lightBg: "bg-blue-50",
      textColor: "text-blue-700",
      key: "totalOrders"
    },
    {
      title: "Active Deliveries",
      value: stats?.activeOrders || 0,
      icon: TrendingUp,
      color: "green",
      bgColor: "bg-green-500",
      lightBg: "bg-green-50",
      textColor: "text-green-700",
      key: "activeOrders"
    },
    {
      title: "Delivered Today",
      value: stats?.deliveredToday || 0,
      icon: CheckCircle,
      color: "emerald",
      bgColor: "bg-emerald-500",
      lightBg: "bg-emerald-50",
      textColor: "text-emerald-700",
      key: "deliveredToday"
    },
    {
      title: "Online Retailers",
      value: stats?.activeRetailers || 0,
      icon: Users,
      color: "purple",
      bgColor: "bg-purple-500",
      lightBg: "bg-purple-50",
      textColor: "text-purple-700",
      key: "activeRetailers"
    },
    {
      title: "Pending Assignment",
      value: stats?.pendingAssignment || 0,
      icon: Clock,
      color: "amber",
      bgColor: "bg-amber-500",
      lightBg: "bg-amber-50",
      textColor: "text-amber-700",
      key: "pendingAssignment"
    },
    {
      title: "SLA Breaches",
      value: stats?.slaBreaches || 0,
      icon: AlertCircle,
      color: "red",
      bgColor: "bg-red-500",
      lightBg: "bg-red-50",
      textColor: "text-red-700",
      key: "slaBreaches"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, i) => (
          <Card key={i} className="border-none shadow-md">
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => (
        <Card 
          key={index} 
          className="border-none shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden cursor-pointer hover:scale-105"
          onClick={() => {
            if (onStatClick && typeof onStatClick === 'function') {
              onStatClick(stat.key);
            }
          }}
        >
          <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 ${stat.bgColor} rounded-full opacity-10`} />
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-2">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.lightBg}`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}