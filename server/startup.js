Meteor.startup(function() {
	if (!FitnessActivities.findOne()) {

		console.log('adding fit act');
		var timestamp = moment().valueOf();
		FitnessActivities.insert({activity: 'running', icon:'running31.png', timestamp:timestamp});
		FitnessActivities.insert({activity: 'walking', icon:'walking17.png', timestamp:timestamp});
		FitnessActivities.insert({activity: 'bicycling', icon:'regular2.png', timestamp:timestamp});
	}
  
});