Meteor.methods({

	searchFsqr: function(email, userId){
		var url = 'https://api.foursquare.com/v2/users/self/friends?oauth_token=QCA425XBHN1QZJBSSX4EP5UAXZNXPABJT0D5UEF3KPEPFZN2&v=20141206';
	},
});
