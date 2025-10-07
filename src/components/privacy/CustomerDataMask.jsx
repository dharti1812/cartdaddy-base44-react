import React from "react";
import { EyeOff, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * CustomerDataMask Component
 * Masks customer sensitive data for regular admins
 * Shows full data only to super admins
 */

export default function CustomerDataMask({ 
  data, // customer phone or address
  type, // 'phone' or 'address'
  userRole, // 'admin' or 'super_admin'
  showIcon = true
}) {
  const isSuperAdmin = userRole === 'super_admin';

  const maskPhone = (phone) => {
    if (!phone) return 'N/A';
    if (isSuperAdmin) return phone;
    // Mask middle digits: +91 98XXX XXX45
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 2)}XXX XXX${cleaned.slice(-2)}`;
    }
    return 'XXXX XXXX';
  };

  const maskAddress = (address) => {
    if (!address) return 'N/A';
    if (isSuperAdmin) return `${address.street}, ${address.city}, ${address.pincode}`;
    // Show only city and state for admins
    return `${address.city}, ${address.state || 'India'}`;
  };

  const renderMaskedData = () => {
    if (type === 'phone') {
      return (
        <span className="flex items-center gap-2">
          {!isSuperAdmin && showIcon && <EyeOff className="w-4 h-4 text-gray-400" />}
          <span className={!isSuperAdmin ? 'text-gray-500' : ''}>{maskPhone(data)}</span>
          {!isSuperAdmin && (
            <Badge variant="outline" className="text-xs bg-gray-100">
              Protected
            </Badge>
          )}
        </span>
      );
    }

    if (type === 'address') {
      return (
        <span className="flex items-center gap-2">
          {!isSuperAdmin && showIcon && <EyeOff className="w-4 h-4 text-gray-400" />}
          <span className={!isSuperAdmin ? 'text-gray-500' : ''}>{maskAddress(data)}</span>
          {!isSuperAdmin && (
            <Badge variant="outline" className="text-xs bg-gray-100">
              City Only
            </Badge>
          )}
        </span>
      );
    }

    return null;
  };

  return renderMaskedData();
}