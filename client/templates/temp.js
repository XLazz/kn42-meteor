Template.test.helpers({
	mytypes: function(){
		var myTypes = Places.find({},{fields:{types:1}});
//		console.log(' types ', myTypes.fetch());
		myTypes.forEach(function (item, index, array) {
//			console.log(' foreach ', item.types );
			item.types.forEach(function (item2, index, array) {

				var myId = Services.findOne({type:item2});
//				console.log(' foreach ', item2, myId );
				if (!myId._id) {
//					console.log(' inserting ', item2 );
					Services.insert({type:item2});
				}
			});
		});
		return Services.find({});
	},
	status: function() {
		if (Session.get('geoback')) {
			return 'running';
		} else {
			return 'stopped';
		}
	},
});

