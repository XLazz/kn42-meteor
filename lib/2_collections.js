var Collections = {};

GeoLog = new Mongo.Collection('geo_log');
UserLocations = new Mongo.Collection('user_locations');
UserPlaces = new Mongo.Collection('user_places');
Services = new Mongo.Collection('place_services');
Experiences = new Mongo.Collection('user_experiences');
Experiences.attachSchema(Schemas.Experiences);

BeenPlaces = new Mongo.Collection("places_been");
AutoPlaces = new Mongo.Collection("places_auto");
ClaimedPlaces = Collections.ClaimedPlaces = new Mongo.Collection("places_claimed");
ClaimedPlaces.attachSchema(Schemas.ClaimForm);

GooglePlaces = new Mongo.Collection('google_places');
Places = new Mongo.Collection("places");
MerchantsCache = new Mongo.Collection("merchants_cache");

VenuesCache = new Mongo.Collection("venues_cache");
VenuesFsqr = new Mongo.Collection("venues_fsqr");
VenuesCheckins = new Mongo.Collection('venues_checkins');

Friends = new Mongo.Collection('friends');


//UI.registerHelper("Collections", Collections);



People = Collections.People = new Mongo.Collection("People");
People.attachSchema(Schemas.Person);

Items = Collections.Items = new Mongo.Collection("Items");
Items.attachSchema(Schemas.Item);

FitnessRoutes = new Mongo.Collection('fitness_routes');
FitnessTracks = new Mongo.Collection('fitness_tracks');
Tracks = new Mongo.Collection('tracks');
FitnessActivities = new Mongo.Collection('fitness_activities');
FitnessActivities.attachSchema(Schemas.FitnessActivities);

DriveTracks = new Mongo.Collection('drive_tracks');
Drives = new Mongo.Collection('drives');
Contacts = Collections.Contacts = new Mongo.Collection('contacts');
Contacts.attachSchema(Schemas.Contacts);




//Items = Collections.Items = new Mongo.Collection("Items");
//Items.attachSchema(Schemas.Item);