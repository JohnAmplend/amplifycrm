import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Building2, CheckCircle2, AlertCircle, ExternalLink, Calendar } from "lucide-react";

export default function PropertyDemographicsCard({ data }) {
  if (!data) return null;

  const getCfpbBadgeColor = (designation) => {
    switch (designation) {
      case 'Rural':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Underserved':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Rural and Underserved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVerificationBadgeColor = (status) => {
    return status === 'Certified' 
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : 'bg-amber-100 text-amber-800 border-amber-200';
  };

  const openInMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}`;
    window.open(url, '_blank');
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">Property Demographics</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{data.address}</span>
            </div>
          </div>
          <Badge className={`${getVerificationBadgeColor(data.verificationStatus)} border`}>
            {data.verificationStatus === 'Certified' ? (
              <CheckCircle2 className="w-3 h-3 mr-1" />
            ) : (
              <AlertCircle className="w-3 h-3 mr-1" />
            )}
            {data.verificationStatus}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Population Density */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">Population Density</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data.populationDensity !== null 
              ? `${data.populationDensity.toFixed(1)} people/sq mi`
              : 'Data unavailable'}
          </div>
          {data.isRural && (
            <Badge className="mt-2 bg-green-100 text-green-800 border-green-200 border">
              Rural Area
            </Badge>
          )}
        </div>

        {/* CFPB Designation */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-gray-700">CFPB Designation</span>
          </div>
          <Badge className={`${getCfpbBadgeColor(data.cfpbDesignation)} border text-sm px-3 py-1`}>
            {data.cfpbDesignation}
          </Badge>
        </div>

        {/* County Information */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-1">County</div>
          <div className="text-lg font-medium text-gray-900">
            {data.county}, {data.stateCode}
          </div>
        </div>

        {/* Additional Info */}
        {(data.totalPopulation || data.landArea) && (
          <div className="bg-white rounded-lg p-3 border border-gray-200 text-sm text-gray-600">
            {data.totalPopulation && (
              <div className="mb-1">
                <span className="font-medium">Total Population:</span> {data.totalPopulation.toLocaleString()}
              </div>
            )}
            {data.landArea && (
              <div>
                <span className="font-medium">Land Area:</span> {data.landArea.toFixed(2)} sq mi
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>Updated: {new Date(data.lastUpdated).toLocaleDateString()}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={openInMaps}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Check on Map
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}