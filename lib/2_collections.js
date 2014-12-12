var Collections = {};

GeoLog = new Mongo.Collection('geo_log');
UserLocations = new Mongo.Collection('user_locations');
UserPlaces = new Mongo.Collection('user_places');
Services = new Mongo.Collection('place_services');
Experiences = new Mongo.Collection('user_experiences');

BeenPlaces = new Mongo.Collection("places_been");
ClaimedPlaces = Collections.ClaimedPlaces = new Mongo.Collection("places_claimed");

GooglePlaces = new Mongo.Collection('google_places');
Places = new Mongo.Collection("places");
MerchantsCache = new Mongo.Collection("merchants_cache");
VenuesCache = new Mongo.Collection("venues_cache");

Friends = new Mongo.Collection('friends');

//UI.registerHelper("Collections", Collections);

ClaimedPlaces.attachSchema(Schemas.ClaimForm);

People = Collections.People = new Mongo.Collection("People");
People.attachSchema(Schemas.Person);

Items = Collections.Items = new Mongo.Collection("Items");
Items.attachSchema(Schemas.Item);


Meteor.publish(null, function () {
  return People.find();
});

People.allow({
  insert: function () {
    return true;
  },
  remove: function () {
    return true;
  }
});

//Items = Collections.Items = new Mongo.Collection("Items");
//Items.attachSchema(Schemas.Item);