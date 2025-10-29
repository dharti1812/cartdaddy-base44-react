import React, { useState, useEffect } from "react";
import { User } from "@/api/entities"; // Keep User from original entities
import { Order } from "@/components/utils/mockApi"; // Corrected path
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  User as UserIcon,
  Package,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  Tag,
  FileText,
  TrendingUp,
  AlertCircle,
  Plus,
  Edit2,
  Save,
  X,
  Search,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CallButton from "../components/communication/CallButton";
import CustomerDataMask from "../components/privacy/CustomerDataMask";
import { API_BASE_URL } from "@/config";

/**
 * Customer CRM - Customer 360 View
 *
 * Features:
 * - Order history
 * - SLA breach cases
 * - Notes & tags
 * - Tickets & support history
 * - Customer profile
 * - Privacy controls (admin vs super admin)
 */

export default function CustomerCRM() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [tags, setTags] = useState([]);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    loadAdmin();
    loadCustomers();

    if (
      selectedCustomer?.user_id &&
      selectedCustomer?.phone &&
      selectedCustomer?.user_type
    ) {
      fetchTags(
        selectedCustomer.user_id,
        selectedCustomer.phone,
        selectedCustomer.user_type
      );
    }
  }, [selectedCustomer]);

  const loadAdmin = async () => {
    // try {
    //   // Assuming User.me() still works or returns a default admin for dev
    //   const admin = await User.me();
    //   setCurrentAdmin(admin);
    // } catch (error) {
    //   console.error("Error loading admin:", error);
    //   // Fallback for development if User.me fails without mock
    //   setCurrentAdmin({
    //     id: "admin-123",
    //     full_name: "Mock Admin",
    //     email: "admin@example.com",
    //     role: "super_admin" // For testing super_admin features
    //   });
    // }
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const ordersData = await res.json();

      // Group orders by customer phone
      const customerMap = new Map();

      ordersData.forEach((order) => {
        const phone = order.customer_phone;
        if (!phone) return;

        if (!customerMap.has(phone)) {
          customerMap.set(phone, {
            phone: phone,
            name: order.customer_name,
            user_type: "customer",
            user_id: order.user_id,
            orders: [],
            totalOrders: 0,
            activeOrders: 0,
            slaBreaches: 0,
            totalSpent: 0,
            lastOrderDate: order.created_date,
          });
        }

        const customer = customerMap.get(phone);

        customer.orders.push(order);
        customer.totalOrders++;
        if (order.payment_status === "paid") {
          const finalAmount = order.amount?.toString().replace(/,/g, "") || "0";
          customer.totalSpent += parseFloat(finalAmount);
        }
        if (order.payment_status === "paid") customer.paidOrders++;
        if (!["delivered", "cancelled"].includes(order.delivery_status)) {
          customer.activeOrders++;
        }

        if (order.sla_breach) {
          customer.slaBreaches++;
        }

        // Update last order date if this one is more recent
        if (new Date(order.created_date) > new Date(customer.lastOrderDate)) {
          customer.lastOrderDate = order.created_date;
        }
      });

      // Convert map to array
      const customersArray = Array.from(customerMap.values());
      setAllCustomers(customersArray);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
    setLoading(false);
  };

  const searchCustomers = async () => {
    if (!searchTerm) return;

    const results = allCustomers.filter(
      (customer) =>
        customer.phone?.includes(searchTerm) ||
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (results.length > 0) {
      handleSelectCustomer(results[0]);
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerOrders(customer.orders);
    fetchTags(customer.user_id);
    // Load notes and tags (simulated - would be from separate entity)
    // Clear and set new mock data for the selected customer
    setNotes([
      {
        id: 1,
        text: "Customer prefers evening deliveries",
        created_by: "Admin",
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        text: "Always calls before placing large orders.",
        created_by: "Support",
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
    setTags([]);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const note = {
      id: Date.now(),
      text: newNote,
      created_by:
        currentAdmin?.full_name || currentAdmin?.email || "Unknown Admin",
      created_at: new Date().toISOString(),
    };

    setNotes([note, ...notes]);
    setNewNote("");
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    const colors = ["blue", "green", "purple", "red", "amber"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/customers/${selectedCustomer.phone}/tags`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: selectedCustomer?.user_id || null,
            label: newTag,
            color: randomColor,
            phone: selectedCustomer?.phone || null,
          }),
        }
      );

      const newTagData = await res.json();
      setTags([...tags, newTagData]);
      setNewTag("");
    } catch (error) {
      console.error("Error adding tag:", error);
    }
  };
  const fetchTags = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/customers/${selectedCustomer?.user_id}/tags`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      setTags(data);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const handleDeleteTag = async (id) => {
    if (!selectedCustomer?.user_id) return;

    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/customers/${selectedCustomer.user_id}/tags/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to delete tag: ${res.status}`);
      }

      setTags((prevTags) => prevTags.filter((tag) => tag.id !== id));
    } catch (error) {
      console.error("Error deleting tag:", error);
    }
  };

  const isSuperAdmin = currentAdmin?.role === "super_admin";

  const filteredCustomers = allCustomers.filter(
    (customer) =>
      !searchTerm ||
      customer.phone?.includes(searchTerm) ||
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-[#075E66] to-[#064d54] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Customer CRM</h1>
          <p className="text-white opacity-90 mt-1">
            Customer 360° view & relationship management
          </p>
        </div>

        {/* Search with customer list */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left - Customer Search & List */}
          <div>
            <Card className="border-none shadow-md mb-4">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && searchCustomers()}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md max-h-[600px] overflow-y-auto">
              <CardHeader className="border-b bg-gray-50 sticky top-0 z-10">
                <CardTitle className="text-sm">
                  Customers ({filteredCustomers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    Loading customers...
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No customers found.
                  </div>
                ) : (
                  filteredCustomers.map((customer, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectCustomer(customer)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedCustomer?.phone === customer.phone
                          ? "bg-blue-50"
                          : ""
                      }`}
                    >
                      <p className="font-semibold text-sm">{customer.name}</p>
                      <p className="text-xs text-gray-600">
                        <CustomerDataMask
                          data={customer.phone}
                          type="phone"
                          userRole={isSuperAdmin ? "super_admin" : "admin"}
                          displayPartial={true} // Display partial if not super admin
                        />
                      </p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {customer.totalOrders} orders
                        </Badge>
                        {customer.slaBreaches > 0 && (
                          <Badge className="bg-red-500 text-white text-xs">
                            {customer.slaBreaches} SLA
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right - Customer Details */}
          <div className="lg:col-span-3">
            {selectedCustomer ? (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Customer Profile */}
                <div className="space-y-6">
                  <Card className="border-none shadow-md">
                    <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardTitle className="flex items-center gap-2">
                        <UserIcon className="w-5 h-5" />
                        Customer Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-semibold text-lg">
                          {selectedCustomer.name}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 mb-1">Phone</p>
                        <CustomerDataMask
                          data={selectedCustomer.phone}
                          type="phone"
                          userRole={isSuperAdmin ? "super_admin" : "admin"}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <p className="text-xs text-gray-500">Total Orders</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {selectedCustomer.totalOrders}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Active</p>
                          <p className="text-2xl font-bold text-green-600">
                            {selectedCustomer.activeOrders}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">SLA Breaches</p>
                          <p className="text-2xl font-bold text-red-600">
                            {selectedCustomer.slaBreaches}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total Spent</p>
                          <p className="text-2xl font-bold text-purple-600">
                            ₹{selectedCustomer.totalSpent}
                          </p>
                        </div>
                      </div>

                      {isSuperAdmin && (
                        <div className="pt-4 border-t">
                          <CallButton
                            callerType="super_admin"
                            calleeType="customer"
                            calleeNumber={selectedCustomer.phone}
                            calleeName={selectedCustomer.name}
                            size="sm"
                            variant="outline"
                            className="w-full"
                          />
                        </div>
                      )}

                      {/* Tags */}
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-gray-700">
                            Tags
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              document.getElementById("new-tag-input")?.focus()
                            }
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {tags.map((tag, index) => (
                            <Badge
                              key={tag.id || `${tag.label}-${index}`}
                              className={`flex items-center gap-1 bg-${tag.color}-100 text-${tag.color}-800`}
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              <span>{tag.label}</span>
                              <X
                                className="w-3 h-3 cursor-pointer hover:text-red-500"
                                onClick={() => handleDeleteTag(tag.id)}
                              />
                            </Badge>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Input
                            id="new-tag-input"
                            placeholder="Add tag..."
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === "Enter" && handleAddTag()
                            }
                            size="sm"
                          />
                          <Button size="sm" onClick={handleAddTag}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notes */}
                  <Card className="border-none shadow-md">
                    <CardHeader className="border-b">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <MessageSquare className="w-4 h-4" />
                        Internal Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Add internal note..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          rows={3}
                        />
                        <Button
                          size="sm"
                          onClick={handleAddNote}
                          className="w-full"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Note
                        </Button>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {notes.map((note) => (
                          <div
                            key={note.id}
                            className="p-3 bg-gray-50 rounded-lg border"
                          >
                            <div className="text-sm text-gray-900">
                              {note.text}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              By {note.created_by} •{" "}
                              {new Date(note.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order History Tabs */}
                <div className="lg:col-span-2">
                  <Card className="border-none shadow-md">
                    <Tabs defaultValue="orders">
                      <CardHeader className="border-b">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="orders">
                            <Package className="w-4 h-4 mr-2" />
                            Orders ({customerOrders.length})
                          </TabsTrigger>
                          <TabsTrigger value="sla">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            SLA Cases ({selectedCustomer.slaBreaches})
                          </TabsTrigger>
                          <TabsTrigger value="tickets">
                            <FileText className="w-4 h-4 mr-2" />
                            Tickets
                          </TabsTrigger>
                        </TabsList>
                      </CardHeader>

                      <TabsContent value="orders">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {customerOrders.length === 0 ? (
                              <p className="text-center text-gray-500 py-8">
                                No orders for this customer.
                              </p>
                            ) : (
                              customerOrders.map((order) => (
                                <div
                                  key={order.id}
                                  className="p-4 bg-gray-50 rounded-lg border"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <p className="font-semibold">
                                        {order.website_ref ||
                                          `#${order.id.toString().slice(0, 8)}`}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {new Date(
                                          order.created_at
                                        ).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-lg">
                                        ₹{order.amount}
                                      </p>
                                      <Badge
                                        className={
                                          order.delivery_status === "delivered"
                                            ? "bg-green-500"
                                            : order.delivery_status ===
                                              "en_route"
                                            ? "bg-blue-500"
                                            : "bg-amber-500"
                                        }
                                      >
                                        {order.status}
                                      </Badge>
                                    </div>
                                  </div>
                                  {order.active_retailer_info && (
                                    <p className="text-xs text-gray-600">
                                      Seller:{" "}
                                      {
                                        order.active_retailer_info
                                          .retailer_business_name
                                      }{" "}
                                      (
                                      {order.active_retailer_info.retailer_name}
                                      )
                                    </p>
                                  )}
                                  {order.sla_breach && (
                                    <Badge
                                      variant="destructive"
                                      className="mt-2"
                                    >
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      SLA Breach
                                    </Badge>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </CardContent>
                      </TabsContent>

                      <TabsContent value="sla">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {customerOrders
                              .filter((o) => o.sla_breach)
                              .map((order) => (
                                <Alert
                                  key={order.id}
                                  className="bg-red-50 border-red-200"
                                >
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                  <AlertDescription>
                                    <strong>
                                      {order.website_ref ||
                                        `#${order.id.toString().slice(0, 8)}`}
                                    </strong>
                                    <br />
                                    Status: {order.status}
                                    <br />
                                    Expected:{" "}
                                    {order.estimated_delivery_time &&
                                      new Date(
                                        order.estimated_delivery_time
                                      ).toLocaleString()}
                                    <br />
                                    Notified:{" "}
                                    {order.sla_breach_notified_at &&
                                      new Date(
                                        order.sla_breach_notified_at
                                      ).toLocaleString()}
                                  </AlertDescription>
                                </Alert>
                              ))}
                            {customerOrders.filter((o) => o.sla_breach)
                              .length === 0 && (
                              <p className="text-center text-gray-500 py-8">
                                No SLA breaches
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </TabsContent>

                      <TabsContent value="tickets">
                        <CardContent className="p-4">
                          <div className="text-center py-12">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No support tickets</p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-4"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Create Ticket
                            </Button>
                          </div>
                        </CardContent>
                      </TabsContent>
                    </Tabs>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="border-none shadow-md">
                <CardContent className="p-12 text-center">
                  <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Select a Customer
                  </h3>
                  <p className="text-gray-500">
                    Choose a customer from the list to view their profile and
                    history
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
