import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Order, DispatchConfig, Retailer } from "@/api/entities";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import Select from "react-select";
import {
  calculateDeliveryCharges,
  isWithinBusinessHours,
  notifyCustomerOrderQueued,
} from "../utils/deliveryChargeCalculator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { retailerApi } from "../utils/retailerApi";
import { deliverySettingApi } from "../utils/deliverySettingApi";
import AddressAutocompleteInput from "@/components/AddressAutocompleteInput";
import { productApi } from "../utils/productApi";
import { API_BASE_URL } from "@/config";

export default function CreateOrderDialog({ onClose, onSuccess }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [retailers, setRetailers] = useState([]);
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [shopQuery, setShopQuery] = useState("");
  const [filteredShops, setFilteredShops] = useState([]);

  const productOptions = products.flatMap((p) => {
    if (p.stocks && p.stocks.length > 0) {
      return p.stocks.map((stock) => ({
        value: stock.id,
        label: `${p.name} (${stock.variant})`,
        price: stock.sale_price || p.price || 0,
      }));
    }

    return [
      {
        value: p.id,
        label: p.name,
        price: p.price || 0,
      },
    ];
  });

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_masked_contact: "",
    drop_address: {
      street: "",
      city: "",
      pincode: "",
      lat: 0,
      lng: 0,
    },
    pickup_address: {
      street: "",
      city: "",
      pincode: "",
      lat: 0,
      lng: 0,
    },
    distance_km: 5,
    items: [
      {
        product_id: "",
        name: "",
        quantity: 1,
        price: 0,
        weight_category: "lightweight",
      },
    ],
    payment_status: "pending",
    payment_method: "online",
    service_type: "delivery",
  });

  useEffect(() => {
    const token = sessionStorage.getItem("token");

    const fetchData = async () => {
      try {
        const [configs, retailersList, productsList, shopsList] =
          await Promise.all([
            deliverySettingApi.list(),
            retailerApi.list(),
            productApi.list(),
            fetch(`${API_BASE_URL}/api/shops`, {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }).then((res) => res.json()),
          ]);

        if (configs?.length > 0) setConfig(configs[0]);
        setRetailers(retailersList || []);
        setProducts(productsList || []);
        setShops(shopsList || []);
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };
    console.log("📡 CreateOrderDialog mounted — fetching data...");
    fetchData();
  }, []); // ✅ Runs once

  // Calculate distance only when lat/lng change
  useEffect(() => {
    if (
      formData.pickup_address.lat &&
      formData.pickup_address.lng &&
      formData.drop_address.lat &&
      formData.drop_address.lng
    ) {
      calculateDistance();
    }
  }, [
    formData.pickup_address.lat,
    formData.pickup_address.lng,
    formData.drop_address.lat,
    formData.drop_address.lng,
  ]);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          product_id: "",
          name: "",
          quantity: 1,
          price: 0,
          weight_category: "lightweight",
        },
      ],
    });
  };

  const handleShopSearch = (e) => {
    const value = e.target.value;
    setShopQuery(value);

    const filtered = shops.filter((shop) =>
      shop.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredShops(filtered);
  };

  const handleShopSelect = (shop) => {
    setFormData((prev) => ({
      ...prev,
      pickup_address: {
        street: shop.address,
        city: shop.city,
        pincode: shop.pincode,
        lat: parseFloat(shop.latitude) || 0,
        lng: parseFloat(shop.longitude) || 0,
      },
    }));
    setFilteredShops([]); // hide the dropdown
    setShopQuery(shop.name); // show selected shop in input
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData({ ...formData, items: updatedItems });
  };

  // Auto-determine required vehicle type
  const getRequiredVehicleType = () => {
    const hasHeavyweight = formData.items.some(
      (item) => item.weight_category === "heavyweight"
    );
    return hasHeavyweight ? "4_wheeler" : "2_wheeler";
  };

  const calculateSubtotal = () => {
    return formData.items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const charges = calculateDeliveryCharges(
      subtotal,
      Number(formData.distance_km || 0),
      config
    );
    return subtotal + Number(charges.totalDeliveryCharge || 0);
  };

  // Helper function to determine if retailer coverage is insufficient
  const hasInsufficientRetailerCoverage = (online, total, currentConfig) => {
    if (!currentConfig || total === 0) return false;
    const onlinePercentage = (online / total) * 100;
    return (
      onlinePercentage < (currentConfig.min_online_retailers_percentage || 0)
    ); // Default to 0 if config is missing
  };
  const handleAddressSelect = (data) => {
    setFormData((prev) => ({
      ...prev,
      pickup_address: {
        ...prev.pickup_address,
        street: data.street,
        city: data.city,
        pincode: data.pincode,
        lat: data.lat,
        lng: data.lng,
      },
    }));
  };

  const handleDropAddressSelect = (data) => {
    setFormData((prev) => ({
      ...prev,
      drop_address: {
        ...prev.drop_address,
        street: data.street,
        city: data.city,
        pincode: data.pincode,
        lat: data.lat,
        lng: data.lng,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const subtotal = calculateSubtotal();
    const charges = calculateDeliveryCharges(
      subtotal,
      formData.distance_km,
      config
    );

    const onlineRetailers = retailers.filter(
      (r) => r.availability_status === "online"
    ).length;
    const totalRetailers = retailers.filter(
      (r) => r.status === "active"
    ).length;
    const withinBusinessHours = isWithinBusinessHours(config);
    const insufficientRetailerCoverage = hasInsufficientRetailerCoverage(
      onlineRetailers,
      totalRetailers,
      config
    );

    let initialStatus = "pending_acceptance";
    let isQueued = false;

    if (!withinBusinessHours) {
      initialStatus = "queued";
      isQueued = true;
    }

    const orderData = {
      ...formData,
      subtotal,
      total_amount: calculateTotal(),
      fuel_cost: charges.fuelCost,
      base_delivery_charge: charges.baseCharge,
      total_delivery_charge: charges.totalDeliveryCharge,
      retailer_earning: charges.retailerEarning,
      delivery_boy_earning: charges.deliveryBoyEarning,
      required_vehicle_type: getRequiredVehicleType(),
      status: initialStatus,
      is_queued: isQueued,
      queued_at: isQueued ? new Date().toISOString() : null,
      queue_retry_count: 0,
      pending_acceptance_since: !isQueued ? new Date().toISOString() : null,
      insufficient_retailer_coverage: insufficientRetailerCoverage,
    };

    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create order");
      }

      console.log("✅ Order created:", result);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("❌ Error creating order:", error);
      alert("Failed to create order: " + error.message);
    } finally {
      setLoading(false);
    }

    if (isQueued) {
      await notifyCustomerOrderQueued(createdOrder);
    }

    setLoading(false);
    onSuccess();
    onClose();
  };

  const charges = calculateDeliveryCharges(
    calculateSubtotal(),
    formData.distance_km,
    config
  );
  const onlineRetailers = retailers.filter(
    (r) => r.availability_status === "online"
  ).length;
  const totalRetailers = retailers.filter((r) => r.status === "active").length;
  const withinBusinessHours = isWithinBusinessHours(config);
  const insufficientCoverage = hasInsufficientRetailerCoverage(
    onlineRetailers,
    totalRetailers,
    config
  );
  const willBeQueued = !withinBusinessHours; // Order will be immediately queued only if outside business hours

  const calculateDistance = () => {
    const { pickup_address, drop_address } = formData;

    if (
      pickup_address.lat &&
      pickup_address.lng &&
      drop_address.lat &&
      drop_address.lng
    ) {
      const R = 6371;
      const dLat = (drop_address.lat - pickup_address.lat) * (Math.PI / 180);
      const dLng = (drop_address.lng - pickup_address.lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(pickup_address.lat * (Math.PI / 180)) *
          Math.cos(drop_address.lat * (Math.PI / 180)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      setFormData((prev) => ({
        ...prev,
        distance_km: parseFloat(distance.toFixed(2)),
      }));
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Create New Order
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {willBeQueued && (
            <Alert className="bg-amber-50 border-amber-500 border-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <AlertDescription className="text-amber-900">
                <strong>Order will be queued:</strong> Outside business hours (
                {config?.business_hours_start || "08:00"} -{" "}
                {config?.business_hours_end || "22:00"}). Will be sent to
                retailers when they open in the morning.
              </AlertDescription>
            </Alert>
          )}

          {!willBeQueued && insufficientCoverage && (
            <Alert className="bg-blue-50 border-blue-500 border-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Limited retailer availability:</strong> Only{" "}
                {onlineRetailers} out of {totalRetailers} retailers online (
                {totalRetailers > 0
                  ? Math.round((onlineRetailers / totalRetailers) * 100)
                  : 0}
                %). Order will be sent to available retailers. If no one accepts
                within {config?.queue_retry_interval_minutes || 15} minutes,
                customer will be notified and order will be queued.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Customer Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="contact">Contact</Label>
                <Input
                  id="contact"
                  value={formData.customer_phone}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      customer_phone: e.target.value,
                      customer_masked_contact: e.target.value,
                    });
                  }}
                  placeholder="+919876543210"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Select Store</h3>
            <div className="space-y-3 rounded-lg relative">
              <Input
                id="select_store"
                value={shopQuery}
                onChange={handleShopSearch}
                placeholder="Type to search shop..."
                required
              />
              {filteredShops.length > 0 && (
                <ul className="absolute z-10 bg-white border w-full mt-1 max-h-48 overflow-auto rounded-md shadow-lg">
                  {filteredShops.map((shop) => (
                    <li
                      key={shop.id}
                      className="p-2 cursor-pointer hover:bg-gray-200"
                      onClick={() => handleShopSelect(shop)}
                    >
                      {shop.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Delivery Addresses</h3>

            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900">
                📍 Pickup Location (Store/Warehouse)
              </p>
              <div>
                <Label htmlFor="pickup_street">Pickup Street Address</Label>
                <AddressAutocompleteInput
                  id="pickup_street"
                  ref={inputRef}
                  value={formData.pickup_address.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pickup_address: {
                        ...formData.pickup_address,
                        street: e.target.value,
                      },
                    })
                  }
                  onSelect={handleAddressSelect}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pickup_city">City</Label>
                  <Input
                    readOnly
                    id="pickup_city"
                    value={formData.pickup_address.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pickup_address: {
                          ...formData.pickup_address,
                          city: e.target.value,
                        },
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pickup_pincode">Pincode</Label>
                  <Input
                    readOnly
                    id="pickup_pincode"
                    value={formData.pickup_address.pincode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pickup_address: {
                          ...formData.pickup_address,
                          pincode: e.target.value,
                        },
                      })
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-semibold text-green-900">
                🏠 Drop Location (Customer)
              </p>
              <div>
                <Label htmlFor="drop_street">Drop Street Address</Label>
                <AddressAutocompleteInput
                  id="drop_street"
                  value={formData.drop_address.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      drop_address: {
                        ...formData.drop_address,
                        street: e.target.value,
                      },
                    })
                  }
                  onSelect={handleDropAddressSelect}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    readOnly
                    id="city"
                    value={formData.drop_address.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        drop_address: {
                          ...formData.drop_address,
                          city: e.target.value,
                        },
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    readOnly
                    id="pincode"
                    value={formData.drop_address.pincode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        drop_address: {
                          ...formData.drop_address,
                          pincode: e.target.value,
                        },
                      })
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="distance">Distance (KM) - Pickup to Drop</Label>
              <Input
                id="distance"
                type="number"
                min="0"
                step="any"
                value={formData.distance_km || ""}
                onChange={(e) =>
                  setFormData({ ...formData, distance_km: e.target.value })
                }
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Estimated distance from pickup to drop location
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Order Items</h3>
              {/* <Button
                type="button"
                onClick={handleAddItem}
                variant="outline"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button> */}
            </div>
            {formData.items.map((item, index) => (
              <div
                key={index}
                className="space-y-3 p-4 bg-gray-50 rounded-lg border"
              >
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Label>Item Name</Label>
                    <Select
                      className="w-full"
                      options={productOptions}
                      placeholder="Search and select product..."
                      isSearchable
                      isClearable
                      value={
                        productOptions.find(
                          (opt) =>
                            opt.value === formData.items[index].product_id
                        ) || null
                      }
                      onChange={(selectedOption) => {
                        setFormData((prev) => {
                          const updatedItems = [...prev.items];
                          updatedItems[index] = {
                            ...updatedItems[index],
                            product_id: selectedOption
                              ? selectedOption.value
                              : "",
                            name: selectedOption ? selectedOption.label : "",
                            price: Number(
                              selectedOption ? selectedOption.price : 0
                            ),
                          };
                          return { ...prev, items: updatedItems };
                        });
                      }}
                    />
                  </div>

                  <div className="w-24">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "quantity",
                          Number(e.target.value)
                        )
                      }
                      required
                    />
                  </div>
                  <div className="w-32">
                    <Label>Price (₹)</Label>
                    <Input type="number" min="0" value={item.price} readOnly />
                  </div>
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>

                <div>
                  <Label>Weight Category * (Determines Vehicle Type)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      type="button"
                      variant={
                        item.weight_category === "lightweight"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        handleItemChange(
                          index,
                          "weight_category",
                          "lightweight"
                        )
                      }
                      className="justify-start h-auto py-3"
                    >
                      <div className="text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">📦</span>
                          <span className="font-bold">Lightweight</span>
                        </div>
                        <p className="text-xs opacity-75">2-Wheeler Delivery</p>
                        <p className="text-xs opacity-75">
                          Small packages, groceries
                        </p>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant={
                        item.weight_category === "heavyweight"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        handleItemChange(
                          index,
                          "weight_category",
                          "heavyweight"
                        )
                      }
                      className="justify-start h-auto py-3"
                    >
                      <div className="text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">🚚</span>
                          <span className="font-bold">Heavyweight</span>
                        </div>
                        <p className="text-xs opacity-75">4-Wheeler Delivery</p>
                        <p className="text-xs opacity-75">
                          Large items, bulk orders
                        </p>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Show required vehicle type */}
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                <strong>🚗 Required Vehicle Type:</strong>{" "}
                {getRequiredVehicleType() === "2_wheeler" ? (
                  <span className="font-bold text-blue-700">
                    🏍️ 2-Wheeler (All items lightweight)
                  </span>
                ) : (
                  <span className="font-bold text-green-700">
                    🚗 4-Wheeler (Contains heavyweight items)
                  </span>
                )}
                <br />
                <span className="text-xs">
                  Only delivery partners with matching vehicle type will receive
                  this order
                </span>
              </AlertDescription>
            </Alert>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal (Products)</span>
              <span className="font-medium text-gray-900">
                ₹{calculateSubtotal()}
              </span>
            </div>

            {charges.totalDeliveryCharge > 0 && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg space-y-2 text-sm">
                <p className="font-semibold text-blue-900 flex items-center gap-2">
                  🚚 Delivery Charges Breakdown:
                </p>
                <div className="space-y-1.5 text-gray-700">
                  <div className="flex justify-between">
                    <span>
                      Distance: {formData.distance_km} km × ₹
                      {config?.fuel_cost_per_km || 5}/km
                    </span>
                    <span className="font-medium">₹{charges.fuelCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Base Charge (
                      {calculateSubtotal() <
                      (config?.delivery_charge_threshold || 20000)
                        ? "Below"
                        : "Above"}{" "}
                      ₹{config?.delivery_charge_threshold || 20000})
                    </span>
                    <span className="font-medium">₹{charges.baseCharge}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-blue-900 pt-2 border-t border-blue-300">
                    <span>Total Delivery Charge</span>
                    <span>₹{charges.totalDeliveryCharge}</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-blue-300 space-y-1.5 text-xs">
                  <p className="font-semibold text-gray-700">
                    💰 Commission Split:
                  </p>
                  <div className="flex justify-between text-green-700">
                    <span>
                      → Retailer/Seller ({charges.breakdown?.retailerPercent}%):
                    </span>
                    <span className="font-bold text-base">
                      ₹{charges.retailerEarning}
                    </span>
                  </div>
                  <div className="flex justify-between text-blue-700">
                    <span>
                      → Delivery Boy ({charges.breakdown?.deliveryBoyPercent}%):
                    </span>
                    <span className="font-bold text-base">
                      ₹{charges.deliveryBoyEarning}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-gray-300">
              <span className="text-gray-900">Total Amount</span>
              <span className="text-[#075E66]">₹{calculateTotal()}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#075E66] hover:bg-[#064d54] text-white font-semibold"
            >
              {loading
                ? "Creating..."
                : willBeQueued
                ? "Create & Queue Order"
                : "Create Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
