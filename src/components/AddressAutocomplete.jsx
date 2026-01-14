import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function AddressAutocomplete({ onAddressSelect, value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sessionTokenRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    // Generate a new session token (UUID v4)
    sessionTokenRef.current = crypto.randomUUID();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (input) => {
    if (!input || input.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const apiKey = 'YOUR_GOOGLE_API_KEY'; // In production, this should come from env or backend
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&components=country:us&sessiontoken=${sessionTokenRef.current}&key=${apiKey}`;
      
      // Note: Due to CORS, this needs to be proxied through your backend
      // For now, we'll use the Geocoding API which can work client-side with restrictions
      const corsProxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
      
      const response = await fetch(corsProxyUrl);
      const data = await response.json();

      if (data.predictions) {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    fetchSuggestions(newValue);
  };

  const handleSelectSuggestion = async (suggestion) => {
    onChange(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Call the parent callback with the place_id
    if (onAddressSelect) {
      onAddressSelect({
        address: suggestion.description,
        placeId: suggestion.place_id
      });
    }

    // Reset session token after selection
    sessionTokenRef.current = crypto.randomUUID();
  };

  return (
    <div className="relative">
      <Label htmlFor="address">Property Address</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id="address"
          value={value}
          onChange={handleInputChange}
          placeholder="Start typing an address..."
          className="w-full"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="text-sm text-gray-900">{suggestion.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}