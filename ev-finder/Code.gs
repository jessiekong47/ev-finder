function doGet(e) {
  try {
    const p=e.parameter, props=PropertiesService.getScriptProperties();
    if (!props.getProperty('ACCESS_TOKEN') || p.token!==props.getProperty('ACCESS_TOKEN')) throw Error('Unauthorized');
    const lat=Number(p.lat), lng=Number(p.lng), radius=Math.min(30,Math.max(1,Number(p.radius)||10));
    if (!p.lat || !p.lng || !Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180) throw Error('Invalid location');
    const key=props.getProperty('AFDC_KEY');
    if(!key) throw Error('AFDC_KEY missing');
    const url='https://developer.nlr.gov/api/alt-fuel-stations/v1/nearest.json?api_key='+encodeURIComponent(key)+'&latitude='+lat+'&longitude='+lng+'&radius='+radius+'&fuel_type=ELEC&access=public&status=E&limit=50';
    const stations=JSON.parse(UrlFetchApp.fetch(url).getContentText()).fuel_stations||[];
    let places=[], warning='';
    const google=props.getProperty('GOOGLE_KEY');
    if(google) try {
      places=JSON.parse(UrlFetchApp.fetch('https://places.googleapis.com/v1/places:searchNearby',{method:'post',contentType:'application/json',headers:{'X-Goog-Api-Key':google,'X-Goog-FieldMask':'places.displayName,places.location,places.evChargeOptions'},payload:JSON.stringify({includedTypes:['electric_vehicle_charging_station'],maxResultCount:20,rankPreference:'DISTANCE',locationRestriction:{circle:{center:{latitude:lat,longitude:lng},radius:radius*1609.344}}})}).getContentText()).places||[];
    } catch(err){warning='Live availability request failed.';} else warning='Live availability not configured.';
    const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
    const data=stations.map(s=>{
      const network=norm(s.ev_network);
      const matches=places.filter(q=>q.location&&distance(s.latitude,s.longitude,q.location.latitude,q.location.longitude)<0.06&&network.length>=4&&norm(q.displayName?.text).includes(network));
      const groups=matches.length===1?(matches[0].evChargeOptions?.connectorAggregation||[]):[];
      const pricing=s.ev_pricing||'';
      const rates=[...new Set([...pricing.matchAll(/\$\s*(\d+(?:\.\d+)?)\s*(?:\/|per)\s*kwh/gi)].map(m=>Number(m[1])))];
      const rate=/^\s*free\s*$/i.test(pricing)?0:rates.length===1&&!/peak|member|variable|between|range/i.test(pricing)?rates[0]:null;
      return {id:s.id,name:s.station_name,network:s.ev_network,address:[s.street_address,s.city,s.state].filter(Boolean).join(', '),distance:distance(lat,lng,s.latitude,s.longitude),lat:s.latitude,lng:s.longitude,pricing,rate,fees:pricing.split(/[;\n]/).filter(x=>/fee|idle|parking|session|\/min/i.test(x)).join('; '),confirmed:s.date_last_confirmed,connectors:s.ev_connector_types||[],fast:s.ev_dc_fast_num||0,level2:s.ev_level2_evse_num||0,groups,hours:s.access_days_time};
    });
    return json({stations:data,warning});
  } catch(err){return json({error:'Request failed: '+String(err.message).replace(/api_key=[^&\s]+/gi,'api_key=REDACTED')});}
}
function json(x){return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON);}
function distance(a,b,c,d){const r=Math.PI/180;return 7917.6*Math.asin(Math.sqrt(Math.min(1,Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2)));}
