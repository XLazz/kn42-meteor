var Collections = {};

GeoLog = new Mongo.Collection('geo_log');
UserLocations = new Mongo.Collection('user_locations');

GooglePlaces = new Mongo.Collection('google_places');
Places = new Mongo.Collection("places");
MerchantsCache = new Mongo.Collection("merchants_cache");

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