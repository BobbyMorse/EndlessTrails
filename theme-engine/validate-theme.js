const fs = require('fs');

const theme = JSON.parse(fs.readFileSync('themes/roswell-trail.json', 'utf8'));

console.log('Theme name:', theme.name);
console.log('Has events.early:', !!theme.events.early);
console.log('Has events.middle:', !!theme.events.middle);
console.log('Has events.late:', !!theme.events.late);
console.log('Events.early length:', theme.events.early?.length);
console.log('Events.middle length:', theme.events.middle?.length);
console.log('Events.late length:', theme.events.late?.length);
console.log('Professions:', theme.professions?.length);
console.log('Locations:', theme.locations?.length);
