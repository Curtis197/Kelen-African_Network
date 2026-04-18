
import { reverseGeocode } from '../lib/utils/geocoding';

const logs = [
  {"id":"235e5340-3e7c-4b50-b2f0-2bb05783ed50","gps_latitude":0.0,"gps_longitude":0.0},
  {"id":"5edc583a-f83b-481d-b510-1cca3bdc48c7","gps_latitude":48.5262078,"gps_longitude":2.6654654},
  {"id":"416b79c2-350d-4ec0-9ef6-d412e71782d4","gps_latitude":0.0,"gps_longitude":0.0},
  {"id":"0e269642-75fa-487f-afd9-3b2fc3b56ba1","gps_latitude":0.0,"gps_longitude":0.0},
  {"id":"58c361bc-63cb-4b41-90ec-ae29e3ed8c54","gps_latitude":48.5262889,"gps_longitude":2.6654798}
];

async function run() {
  console.log('Starting backfill for', logs.length, 'logs...');
  
  for (const log of logs) {
    if (log.gps_latitude === 0 && log.gps_longitude === 0) {
      console.log(`Skipping log ${log.id} (0,0 coordinate)`);
      continue;
    }
    
    console.log(`Processing log ${log.id}...`);
    const result = await reverseGeocode(log.gps_latitude, log.gps_longitude);
    
    if (result) {
      console.log(`Log ${log.id}: Resolved to ${result.city}`);
      console.log(`SQL: UPDATE public.project_logs SET location_name = '${result.city.replace(/'/g, "''")}' WHERE id = '${log.id}';`);
    } else {
      console.warn(`Log ${log.id}: Could not resolve`);
    }
  }
}

run().catch(console.error);
