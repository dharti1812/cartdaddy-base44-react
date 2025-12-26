import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function OfferDetails() {
  const { id } = useParams();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bank-offers/${id}`)
      .then(res => res.json())
      .then(data => {
        setOffer(data.data ?? data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading offer details…</div>;
  }

  if (!offer) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle className="w-4 h-4" />
        Offer not found
      </div>
    );
  }

  return (
    <Card className="max-w-xl mx-auto mt-6">
      <CardHeader>
        <CardTitle className="text-green-800">
          🎁 {offer.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        <div>
          <strong>Offer Code:</strong> {offer.code}
        </div>
        <div>
          <strong>Bank:</strong> {offer.bank_name}
        </div>
        <div>
          <strong>Description:</strong>
          <p className="text-gray-700 mt-1">{offer.description}</p>
        </div>
        <div>
          <strong>Valid From:</strong> {offer.valid_from}
        </div>
        <div>
          <strong>Valid Till:</strong> {offer.valid_to}
        </div>
      </CardContent>
    </Card>
  );
}
