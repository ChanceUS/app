// Script to update demo bar codes in localStorage
// Run this in the browser console to update your existing demo bar

const demoBarData = localStorage.getItem('demoBar');
if (demoBarData) {
  const demoBar = JSON.parse(demoBarData);
  console.log('Current demo bar:', demoBar);
  
  // Update with fixed codes
  demoBar.qr_code = 'DEMOBE1KH';
  demoBar.venue_code = 'CPU1';
  
  // Save back to localStorage
  localStorage.setItem('demoBar', JSON.stringify(demoBar));
  
  console.log('Updated demo bar with fixed codes:', demoBar);
  console.log('QR Code:', demoBar.qr_code);
  console.log('Venue Code:', demoBar.venue_code);
} else {
  console.log('No demo bar found in localStorage');
}
