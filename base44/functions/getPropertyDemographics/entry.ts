import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { placeId, address } = await req.json();
    
    if (!placeId && !address) {
      return Response.json({ error: 'placeId or address required' }, { status: 400 });
    }

    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    const censusApiKey = Deno.env.get('CENSUS_API_KEY');

    if (!googleApiKey) {
      return Response.json({ error: 'Google Places API key not configured' }, { status: 500 });
    }

    // Step 1: Get place details including coordinates
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,address_components,formatted_address&key=${googleApiKey}`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (detailsData.status !== 'OK') {
      return Response.json({ 
        error: 'Failed to fetch place details',
        details: detailsData.status 
      }, { status: 400 });
    }

    const location = detailsData.result.geometry.location;
    const addressComponents = detailsData.result.address_components;
    const formattedAddress = detailsData.result.formatted_address;

    // Extract county and state from address components
    let county = '';
    let state = '';
    let stateCode = '';
    let countyFips = '';

    for (const component of addressComponents) {
      if (component.types.includes('administrative_area_level_2')) {
        county = component.long_name.replace(' County', '');
      }
      if (component.types.includes('administrative_area_level_1')) {
        state = component.long_name;
        stateCode = component.short_name;
      }
    }

    // Step 2: Get Census data for population density
    let populationDensity = null;
    let totalPopulation = null;
    let landArea = null;

    if (censusApiKey && stateCode) {
      try {
        // Get county FIPS code first
        const geoUrl = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${location.lng}&y=${location.lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (geoData.result?.geographies?.['Counties']?.[0]) {
          const countyData = geoData.result.geographies['Counties'][0];
          countyFips = countyData.COUNTY;
          const stateFips = countyData.STATE;

          // Get population and land area from ACS 5-Year data
          const censusUrl = `https://api.census.gov/data/2021/acs/acs5?get=B01003_001E,B01001_001E&for=county:${countyFips}&in=state:${stateFips}&key=${censusApiKey}`;
          const censusResponse = await fetch(censusUrl);
          const censusData = await censusResponse.json();

          if (censusData && censusData.length > 1) {
            totalPopulation = parseInt(censusData[1][0]);

            // Get land area from county area API
            const areaUrl = `https://api.census.gov/data/2021/pep/population?get=DENSITY,POP,AREA&for=county:${countyFips}&in=state:${stateFips}`;
            const areaResponse = await fetch(areaUrl);
            const areaData = await areaResponse.json();

            if (areaData && areaData.length > 1) {
              const density = parseFloat(areaData[1][0]);
              populationDensity = density;
              landArea = parseFloat(areaData[1][2]);
            }
          }
        }
      } catch (censusError) {
        console.error('Census API error:', censusError);
      }
    }

    // Step 3: Determine classifications
    const isRural = populationDensity !== null && populationDensity < 500;
    
    // CFPB designation logic (simplified - you may need to use actual CFPB data)
    let cfpbDesignation = 'Not Designated';
    if (populationDensity !== null) {
      if (populationDensity < 100) {
        cfpbDesignation = 'Rural and Underserved';
      } else if (populationDensity < 500) {
        cfpbDesignation = 'Rural';
      } else if (populationDensity < 1000) {
        cfpbDesignation = 'Underserved';
      }
    }

    // Step 4: Determine verification status
    const verificationStatus = censusApiKey && populationDensity !== null ? 'Certified' : 'Partial Data';

    return Response.json({
      success: true,
      data: {
        address: formattedAddress,
        coordinates: {
          lat: location.lat,
          lng: location.lng
        },
        county: county || 'Unknown',
        state: state,
        stateCode: stateCode,
        populationDensity: populationDensity,
        totalPopulation: totalPopulation,
        landArea: landArea,
        isRural: isRural,
        cfpbDesignation: cfpbDesignation,
        verificationStatus: verificationStatus,
        lastUpdated: new Date().toISOString(),
        placeId: placeId
      }
    });

  } catch (error) {
    console.error('Error in getPropertyDemographics:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});