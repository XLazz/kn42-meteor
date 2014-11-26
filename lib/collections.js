var Collections = {};

GeoLog = new Mongo.Collection('geo_log');
UserLocations = new Mongo.Collection('user_locations');

Places = new Mongo.Collection("places");
Merchants = new Mongo.Collection("merchants");

UI.registerHelper("Collections", Collections);

Meteor.publish(null, function() {
  return Meteor.users.find({_id: this.userId}, {fields: {api_key: 1}});
});

//People = Collections.People = new Mongo.Collection("People");
//People.attachSchema(Schemas.Person);

//Items = Collections.Items = new Mongo.Collection("Items");
//Items.attachSchema(Schemas.Item);