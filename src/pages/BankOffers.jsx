import React, { useState, useEffect } from "react";
import { productApi } from "@/components/utils/productApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { bankOfferApi } from "@/components/utils/BankOffersApi.jsx";
import { CreditCard, Plus, Trash2, Save, Search, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function BankOffersPage() {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);

    useEffect(() => {
        loadProducts();
        loadStates();
    }, []);

    const quillModules = {
        toolbar: [
            [{ header: [1, 2, false] }],
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link"],
            ["clean"],
        ],
    };

    const quillFormats = [
        "header",
        "bold",
        "italic",
        "underline",
        "list",
        "bullet",
        "link",
    ];


    const loadProducts = async () => {
        try {
            const data = await productApi.list();
            setProducts(data);
        } catch (error) {
            console.error("Error loading products:", error);
        }
    };

    const loadStates = async () => {
        try {
            const data = await bankOfferApi.getStates();
            setStates(data);
        } catch (e) {
            console.error(e);
        }
    };

    const addNewOffer = () => {
        const newOffer = {
            id: `temp-${Date.now()}`,
            bank_name: "",
            title: "",
            description: "",
            valid_from: new Date().toISOString().slice(0, 16),
            valid_to: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
            is_active: true,
            priority: 1,
            state_ids: [],
            city_ids: [],
        };

        setOffers([...offers, newOffer]);
    };

    const updateOffer = (index, field, value) => {
        const updated = [...offers];
        updated[index] = { ...updated[index], [field]: value };
        setOffers(updated);
    };

    const loadCities = async (stateIds) => {
        if (!stateIds.length) {
            setCities([]);
            return;
        }

        try {
            const data = await bankOfferApi.getCities(stateIds);
            setCities(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSelectProduct = async (product) => {
        setSelectedProduct(product);
        setOffers([]);
        setCities([]);

        try {
            const existingOffers = await bankOfferApi.getOffersByProduct(product.id);

            if (existingOffers.length > 0) {
                setOffers(existingOffers);
                const allStateIds = [
                    ...new Set(existingOffers.flatMap(o => o.state_ids))
                ];

                if (allStateIds.length) {
                    loadCities(allStateIds);
                }
            } else {
                addNewOffer();
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load offers");
        }
    };

    const saveOffers = async () => {
        if (!selectedProduct) {
            toast.error("Please select a product first");
            return;
        }

        setLoading(true);

        try {
            await bankOfferApi.saveOffers(selectedProduct.id, offers);

            toast.success("Offers saved successfully");
            setOffers([]);
            setSelectedProduct(null);

        } catch (err) {
            console.error("Save offer error:", err);
            toast.error(err?.message || "Failed to save offers");
        }

        setLoading(false);
    };

    const removeOffer = async (index) => {
        const offer = offers[index];

        if (String(offer.id).startsWith("temp-")) {
            setOffers(offers.filter((_, i) => i !== index));
            return;
        }

        if (!window.confirm("Are you sure you want to delete this offer?")) {
            return;
        }

        try {
            await bankOfferApi.deleteOffer(offer.id);

            toast.success("Offer deleted successfully");

            setOffers(offers.filter((_, i) => i !== index));
        } catch (err) {
            console.error(err);
            toast.error(err?.message || "Failed to delete offer");
        }
    };
    const filteredProducts = products.filter(
        (p) =>
            !searchTerm ||
            p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (

        <div className="p-4 md:p-8 bg-gradient-to-br from-[#075E66] to-[#064d54] min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <CreditCard className="w-8 h-8" />
                        Bank Offers Management
                    </h1>
                    <p className="text-white opacity-90 mt-1">
                        Map bank offers to products
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Product Selection */}
                    <Card className="border-none shadow-lg">
                        <CardHeader className="border-b">
                            <CardTitle>Select Product</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <Input
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <div className="max-h-[400px] overflow-y-auto space-y-2">
                                {filteredProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => handleSelectProduct(product)}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedProduct?.id === product.id
                                            ? "border-[#FFEB3B] bg-[#FFEB3B] bg-opacity-10"
                                            : "border-gray-200 hover:border-[#075E66]"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {product.thumbnail && (
                                                <img
                                                    src={product.thumbnail}
                                                    alt={product.name}
                                                    className="w-12 h-12 object-cover rounded"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <p className="font-semibold text-black">
                                                    {product.name}
                                                </p>
                                                <p className="text-xs text-gray-600">{product.slug}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Selected Product Info */}
                    <Card className="border-none shadow-lg">
                        <CardHeader className="border-b bg-[#075E66]">
                            <CardTitle className="text-white">
                                {selectedProduct ? "Selected Product" : "No Product Selected"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {selectedProduct ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        {selectedProduct.thumbnail && (
                                            <img
                                                src={selectedProduct.thumbnail}
                                                alt={selectedProduct.name}
                                                className="w-24 h-24 object-cover rounded-lg border-4 border-[#FFEB3B]"
                                            />
                                        )}
                                        <div>
                                            <h3 className="text-xl font-bold text-black">
                                                {selectedProduct.name}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {selectedProduct.slug}
                                            </p>
                                            <Badge className="mt-2 bg-[#075E66] text-white">
                                                {selectedProduct.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    {selectedProduct.pricing && (
                                        <div className="p-3 bg-green-50 rounded-lg">
                                            <p className="text-sm text-gray-600">Current Price</p>
                                            <p className="text-2xl font-bold text-green-700">
                                                ₹{selectedProduct.pricing.current_price}
                                            </p>
                                        </div>
                                    )}

                                    <Button
                                        onClick={() => {
                                            setSelectedProduct(null);
                                            setOffers([]);
                                        }}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        Clear Selection
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">
                                        Select a product to add bank offers
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Offers Section */}
                {selectedProduct && (
                    <Card className="border-none shadow-lg">
                        <CardHeader className="border-b">
                            <div className="flex justify-between items-center">
                                <CardTitle>Bank Offers ({offers.length})</CardTitle>
                                <Button
                                    onClick={addNewOffer}
                                    className="bg-[#FFEB3B] hover:bg-[#FFEB3B] hover:opacity-90 text-black font-bold"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Offer
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {offers.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 mb-4">No offers added yet</p>
                                    <Button onClick={addNewOffer} variant="outline">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add First Offer
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {offers.map((offer, index) => (
                                        <Card key={offer.id} className="border-2 border-[#075E66]">
                                            <CardContent className="p-6">
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-start">
                                                        <Badge className="bg-[#075E66] text-white">
                                                            Offer #{index + 1}
                                                        </Badge>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => removeOffer(index)}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>

                                                    </div>

                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div>
                                                            <Label>Bank Name *</Label>
                                                            <Input
                                                                value={offer.bank_name}
                                                                onChange={(e) =>
                                                                    updateOffer(
                                                                        index,
                                                                        "bank_name",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                placeholder="e.g., HDFC Bank"
                                                                className="mt-1"
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label>Offer Title *</Label>
                                                            <Input
                                                                value={offer.title}
                                                                onChange={(e) =>
                                                                    updateOffer(index, "title", e.target.value)
                                                                }
                                                                placeholder="e.g., 10% Cashback"
                                                                className="mt-1"
                                                            />
                                                        </div>

                                                        <div className="md:col-span-2">
                                                            <Label>Description</Label>

                                                            <div className="mt-1 bg-white">
                                                                <ReactQuill
                                                                    theme="snow"
                                                                    value={offer.description}
                                                                    onChange={(value) =>
                                                                        updateOffer(index, "description", value)
                                                                    }
                                                                    modules={quillModules}
                                                                    formats={quillFormats}
                                                                    placeholder="Detailed offer terms and conditions..."
                                                                    className="quill-editor"
                                                                />

                                                            </div>
                                                        </div>
                                                        <div>
                                                            <Label>States</Label>
                                                            <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                                                                {states.map(state => (
                                                                    <label key={state.id} className="flex items-center gap-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={offer.state_ids.includes(state.id)}
                                                                            onChange={(e) => {
                                                                                const updatedStates = e.target.checked
                                                                                    ? [...offer.state_ids, state.id]
                                                                                    : offer.state_ids.filter(id => id !== state.id);

                                                                                updateOffer(index, "state_ids", updatedStates);
                                                                                loadCities(updatedStates);
                                                                            }}
                                                                        />
                                                                        {state.name}
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <Label>Cities</Label>
                                                            <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                                                                {cities.map(city => (
                                                                    <label key={city.id} className="flex items-center gap-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={offer.city_ids.includes(city.id)}
                                                                            onChange={(e) => {
                                                                                const updatedCities = e.target.checked
                                                                                    ? [...offer.city_ids, city.id]
                                                                                    : offer.city_ids.filter(id => id !== city.id);

                                                                                updateOffer(index, "city_ids", updatedCities);
                                                                            }}
                                                                        />
                                                                        {city.name}
                                                                    </label>
                                                                ))}
                                                                {!cities.length && (
                                                                    <p className="text-xs text-gray-500">Select states first</p>
                                                                )}
                                                            </div>
                                                        </div>


                                                        <div>
                                                            <Label className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4" />
                                                                Valid From *
                                                            </Label>
                                                            <Input
                                                                type="datetime-local"
                                                                value={offer.valid_from}
                                                                onChange={(e) =>
                                                                    updateOffer(
                                                                        index,
                                                                        "valid_from",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="mt-1"
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4" />
                                                                Valid To *
                                                            </Label>
                                                            <Input
                                                                type="datetime-local"
                                                                value={offer.valid_to}
                                                                onChange={(e) =>
                                                                    updateOffer(index, "valid_to", e.target.value)
                                                                }
                                                                className="mt-1"
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label>Priority</Label>
                                                            <Input
                                                                type="number"
                                                                value={offer.priority}
                                                                onChange={(e) =>
                                                                    updateOffer(
                                                                        index,
                                                                        "priority",
                                                                        parseInt(e.target.value) || 1
                                                                    )
                                                                }
                                                                placeholder="1"
                                                                className="mt-1"
                                                                min="1"
                                                            />
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Higher priority shows first
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                            <Label className="cursor-pointer">
                                                                Active Status
                                                            </Label>
                                                            <Switch
                                                                checked={offer.is_active}
                                                                onCheckedChange={(checked) =>
                                                                    updateOffer(index, "is_active", checked)
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    <div className="flex justify-end gap-3 pt-4 border-t">
                                        <Button variant="outline" onClick={() => setOffers([])}>
                                            Clear All
                                        </Button>
                                        <Button
                                            onClick={saveOffers}
                                            disabled={loading}
                                            className="bg-[#075E66] hover:bg-[#064d54] text-white"
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            {loading ? "Saving..." : `Save ${offers.length} Offer(s)`}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
