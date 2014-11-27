Meteor.publish('basic', function () {
	return GeoLog.find({}, {
	  fields: {userId: 0},
	  sort: {created: 1},
	  limit: 100
	});
});
