import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
// import { sendSMSOTP as backendSendSMSOTP } from "@/api/functions";

export default function DebugSARV() {
  const [phone, setPhone] = useState("9794301234");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    const log = `[${new Date().toLocaleTimeString()}] ${msg}`;
    console.log(log);
    setLogs(prev => [...prev, log]);
  };

  const testBackendFunction = async () => {
    setLoading(true);
    setResult(null);
    setLogs([]);
    
    try {
      addLog("🔵 Starting backend function test...");
      addLog(`Phone: ${phone}`);
      
      addLog("📞 Calling backend function...");
      
      const response = await backendSendSMSOTP({ phone });
      
      addLog("📥 Response received");
      addLog(JSON.stringify(response, null, 2));
      
      setResult(response);
      
      if (response.data?.success) {
        addLog("✅ SUCCESS! OTP: " + response.data.otp);
      } else {
        addLog("❌ FAILED: " + (response.data?.message || "Unknown error"));
      }
      
    } catch (error) {
      addLog("❌ ERROR: " + error.message);
      addLog("Stack: " + error.stack);
      setResult({ error: error.message, stack: error.stack });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="bg-white border-b">
          <CardTitle>🔧 SARV Backend Function Debug</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Test Phone Number</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9794301234"
              className="max-w-xs"
            />
          </div>

          <Button
            onClick={testBackendFunction}
            disabled={loading}
            className="bg-[#F4B321] hover:bg-[#e0a020] text-gray-900"
          >
            {loading ? "Testing..." : "🚀 Test Backend Function"}
          </Button>

          {result && (
            <Alert className={result.data?.success ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"}>
              <AlertDescription>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto">
            <p className="font-bold text-sm mb-2">Console Logs:</p>
            <div className="space-y-1 font-mono text-xs">
              {logs.map((log, i) => (
                <div key={i} className={
                  log.includes('❌') ? 'text-red-600' :
                  log.includes('✅') ? 'text-green-600' :
                  log.includes('📞') || log.includes('📤') ? 'text-blue-600' :
                  'text-gray-700'
                }>{log}</div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}