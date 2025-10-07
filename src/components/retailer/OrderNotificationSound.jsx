
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Order } from "@/api/entities";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Bell, Volume2, VolumeX } from "lucide-react";

// Define the new logo URL globally for larger sizes and better visibility
// This URL should point to a higher resolution or optimized version of your logo.
const NEW_LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e16ead60e37f9dc085ad75/cartdaddy_logo_512x512.png"; 

export default function OrderNotificationSound({ retailerId, onNewOrder }) {
  const [lastCheckedTime, setLastCheckedTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current && soundEnabled) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.log("Audio play failed:", err);
      });
      
      // Also trigger browser notification if permission granted
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("🔔 New Order Available!", {
          body: "A new delivery order is waiting for you!",
          icon: NEW_LOGO_URL, // Updated logo URL for better visibility
          badge: NEW_LOGO_URL, // Updated logo URL for better visibility
          vibrate: [200, 100, 200],
          requireInteraction: true
        });
      }
    }
  }, [soundEnabled]);

  const checkForNewOrders = useCallback(async () => {
    try {
      // Get all pending orders
      const orders = await Order.filter({ 
        status: 'pending_acceptance' 
      }, '-created_date', 50);

      // Check if there are new orders since last check
      const newOrders = orders.filter(order => {
        const orderTime = new Date(order.created_date);
        return orderTime > lastCheckedTime;
      });

      if (newOrders.length > 0 && soundEnabled && permissionGranted) {
        playNotificationSound();
        if (onNewOrder) {
          onNewOrder(newOrders);
        }
      }

      setLastCheckedTime(new Date());
    } catch (error) {
      console.error("Error checking for new orders:", error);
    }
  }, [lastCheckedTime, soundEnabled, permissionGranted, playNotificationSound, onNewOrder]);

  // Initialize audio on mount
  useEffect(() => {
    // Create audio element with custom notification sound
    audioRef.current = new Audio();
    
    // You can replace this with your own audio file URL
    // For now, using a notification beep sound
    audioRef.current.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTUIGGm98OScTgwOUKnl87hkHAU7k9nyz3osBSh+zPLaizsKFFux6OyrWBUIR6Hh8sFuIQUsgs7y2Ik2BxlpvfDknE4NEFCp5fO4ZBwGO5PZ8y+osBiZ+y/KaizsKFVux6OyrWBUIR6Hh8sFuIQUsgs7y2Ik2BxlpvfDknE4NEFCp5fO4ZBwGO5PZ8y+osBiZ+y/Kaizs";
    audioRef.current.volume = 1.0;
    audioRef.current.loop = true; // Keep ringing until acknowledged
    
    checkForNewOrders();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [checkForNewOrders]);

  const stopNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const requestPermissions = async () => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setPermissionGranted(true);
        
        // Start checking for orders every 5 seconds
        intervalRef.current = setInterval(checkForNewOrders, 5000);
        
        // Show success notification
        new Notification("✅ Notifications Enabled!", {
          body: "You'll be alerted when new orders arrive",
          icon: NEW_LOGO_URL // Updated logo URL for better visibility
        });
      }
    } else if (Notification.permission === "granted") {
      setPermissionGranted(true);
      intervalRef.current = setInterval(checkForNewOrders, 5000);
    }
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (soundEnabled) {
      stopNotificationSound();
    }
  };

  if (!permissionGranted) {
    return (
      <Alert className="bg-[#F4B321] bg-opacity-20 border-2 border-[#F4B321] mb-4">
        <Bell className="w-5 h-5 text-[#F4B321]" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <p className="font-bold text-gray-900 mb-1">🔔 Enable Order Notifications</p>
              <p className="text-sm text-gray-700">Get instant audio alerts when new orders arrive. You must be logged in to receive orders.</p>
            </div>
            <Button 
              onClick={requestPermissions}
              className="bg-[#F4B321] hover:bg-[#F4B321] hover:opacity-90 text-gray-900 font-bold flex-shrink-0"
            >
              <Bell className="w-4 h-4 mr-2" />
              Enable
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-green-50 border-2 border-green-500 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2 flex-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-bold text-green-800">
          🔔 Order alerts active - Checking every 5 seconds
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={toggleSound}
        className="flex items-center gap-2 border-green-500 text-green-700 hover:bg-green-50 font-semibold"
      >
        {soundEnabled ? (
          <>
            <Volume2 className="w-4 h-4" />
            Sound ON
          </>
        ) : (
          <>
            <VolumeX className="w-4 h-4" />
            Sound OFF
          </>
        )}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={stopNotificationSound}
        className="text-red-600 hover:text-red-700 border-red-500 hover:bg-red-50 font-semibold"
      >
        Stop Ringing
      </Button>
    </div>
  );
}
