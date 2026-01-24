import React, { useState, useEffect } from "react";
import { OrderApi } from "@/components/utils/orderApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import OrdersList from "../components/orders/OrdersList";
import OrderDetails from "../components/orders/OrderDetails";
import CreateOrderDialog from "../components/orders/CreateOrderDialog";
import { retailerApi } from "@/components/utils/retailerApi";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get("order");
    if (orderId && orders.length > 0) {
      const order = orders.find((o) => o.id === orderId);
      if (order) setSelectedOrder(order);
    }
  }, [orders]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderCode = params.get("order");

    if (orderCode && orders.length > 0) {
      const order = orders.find((o) => o.code === orderCode);

      if (order) {
        setSelectedOrder(order);
      }
    }
  }, [orders]);

  const loadData = async () => {
    setLoading(true);
    const [ordersData, retailersData] = await Promise.all([
      OrderApi.list(),
      retailerApi.list(),
    ]);
    setOrders(ordersData);
    setRetailers(retailersData);
    setLoading(false);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchTerm ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-[#075E66] to-[#064d54] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Order Management</h1>
            <p className="text-white opacity-90 mt-1">
              Track and manage all deliveries
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-[#F4B321] hover:bg-[#F4B321] hover:opacity-90 text-gray-900 font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Order
          </Button>
        </div>

        <Card className="border-none shadow-md mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by order ID, customer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="assigned">Assigned</TabsTrigger>
                  <TabsTrigger value="accepted">En Route</TabsTrigger>
                  <TabsTrigger value="delivered">Delivered</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className={selectedOrder ? "lg:col-span-2" : "lg:col-span-3"}>
            <OrdersList
              orders={filteredOrders}
              loading={loading}
              onSelectOrder={setSelectedOrder}
              selectedOrderId={selectedOrder?.id}
            />
          </div>
          {selectedOrder && (
            <div key={selectedOrder.order_id || selectedOrder.id}>
              <OrderDetails
                key={selectedOrder.order_id || selectedOrder.id}
                order={selectedOrder}
                retailers={retailers}
                onClose={() => setSelectedOrder(null)}
                onUpdate={loadData}
              />
            </div>
          )}
        </div>

        {showCreateDialog && (
          <CreateOrderDialog
            onClose={() => setShowCreateDialog(false)}
            onSuccess={loadData}
          />
        )}
      </div>
    </div>
  );
}
