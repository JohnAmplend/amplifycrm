import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import PropertyDemographicsCard from "@/components/PropertyDemographicsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Home } from "lucide-react";

export default function PropertyDemographicsDemo() {
  const [address, setAddress] = useState("");
  const [demographicsData, setDemographicsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddressSelect = async ({ address, placeId }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await base44.functions.invoke('getPropertyDemographics', {
        placeId: placeId,
        address: address
      });

      if (response.data.success) {
        setDemographicsData(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch demographics data');
      }
    } catch (err) {
      console.error('Error fetching demographics:', err);
      setError(err.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ 
      background: 'linear-gradient(135deg, #F5F7FA 0%, #E6F0FA 100%)'
    }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Home className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Property Demographics Lookup</h1>
          </div>
          <p className="text-gray-600">
            Enter a property address to get demographic data, CFPB designation, and county information
          </p>
        </div>

        <Card className="ampvibe-card mb-6">
          <CardHeader>
            <CardTitle>Search Property</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddressAutocomplete
              value={address}
              onChange={setAddress}
              onAddressSelect={handleAddressSelect}
            />

            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Fetching demographic data...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {demographicsData && !loading && (
          <PropertyDemographicsCard data={demographicsData} />
        )}

        {demographicsData && (
          <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="font-semibold mb-2 text-gray-900">Form State Data</h3>
            <p className="text-sm text-gray-600 mb-2">
              This data is ready to be saved with your form/application:
            </p>
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-96">
              {JSON.stringify(demographicsData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}