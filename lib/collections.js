var Collections = {};

GeoLog = new Mongo.Collection('geo_log');
UserLocations = new Mongo.Collection('user_locations');
UserPlaces = new Mongo.Collection('user_places');
Services = new Mongo.Collection('place_services');
Experiences = new Mongo.Collection('user_experiences');

PlaceSubst = new Mongo.Collection("places_substitute");

GooglePlaces = new Mongo.Collection('google_places');
Places = new Mongo.Collection("places");
MerchantsCache = new Mongo.Collection("merchants_cache");
VenuesCache = new Mongo.Collection("venues_cache");

Friends = new Mongo.Collection('friends');

UI.registerHelper("Collections", Collections);

/* Meteor.publish(null, function() {
	if (this.userId) {
		return Meteor.users.find({_id: this.userId}, {fields: {api_key: 1, profile: 1}});
	}
}); */

//People = Collections.People = new Mongo.Collection("People");
//People.attachSchema(Schemas.Person);

//Items = Collections.Items = new Mongo.Collection("Items");
//Items.attachSchema(Schemas.Item);