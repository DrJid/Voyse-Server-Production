Parse.Cloud.afterSave(Parse.User, function(request, response) {
	console.log("afterSave fired");

	//If this is a new user? 
	var user = request.object;
	var isInitiated = user.get("isInitiated");

	var teamVoyseID = "lVKdY9ZuP5";

	console.log("The user is initiated?: " + isInitiated);

	if (!isInitiated) {
		console.log("This is a non initiated user");

		//Get the Team Voyse account and add the Team Voyse Parse User as a friend to this user.
		var query = new Parse.Query(Parse.User);
		query.get(teamVoyseID, {
			success: function(teamVoyse) {

				console.log("Got the teamVoyse account: " + teamVoyse);
				// The object was retrieved successfully.
				//Get the PFRelation object.
				var friendsRelation = user.relation("friendsRelation");
				friendsRelation.add(teamVoyse);

				//Get the initial Voyse message Object. 
				var message_query = new Parse.Query("Message");
				var onboarding_voyse_message_id = "OPeHUMbsZK"
				message_query.get(onboarding_voyse_message_id, {
					success: function(onboarding_voyse_message) {
						console.log("Got the onboarding_voyse_message: " + onboarding_voyse_message); 

						// Create a recipientAction for this Voyse message.

						var RecipientAction = Parse.Object.extend("RecipientActions");
						var action = new RecipientAction();
						action.set("hasListened", false);
						action.set("sender", teamVoyse); 
						action.set("message", onboarding_voyse_message); 

						user.set("isInitiated", true);
						action.set("recipient", user); // I can't do this..
						// console.log("ra: " + action);

						//Now save this action and call it a good day. 
						action.save(null, {
							success: function(action) {
								console.log("Saved the action successfully:"); 
								console.log("action.message: " + action.get("message"));
								console.log("action.sender" + action.get("sender")); 

								//Mark this user as initiated, so we don't add this voyse again.
								user.save(null, {
									success: function(user) {
										console.log("Saved user successfully");
										//response.success();
									},
									error: function(user, error) {
										console.log("Error occured saving user: " + error.code + " "); 
										//response.error(); 
									}
								});
							},
							error: function(action, error) {
								console.log("Error saving the first recipient action: " + error.code + " ");
								//response.error(); 
							}
						});
					}, 
					error: function(onboarding_voyse_message, error) {
						console.log("Error retrievig onboarding_voyse_message " + error.code + " "); 
						//response.error(); 
					}
				});
			},
			error: function(teamVoyse, error) {
				console.log("Error getting teamVoyse " + error.code + " "); 
				//response.error(); 
			}
		});
	} else {
		//response.success(); 
	}
});



Parse.Cloud.job("cleanUpOldVoyses", function(request, status) {
  // Set up to modify user data
  Parse.Cloud.useMasterKey();

	//Query for all messages whose listenCount is 0
	var query = new Parse.Query("Message");
	query.equalTo("listenCount", 0);

	// todo: Should let this query only query for messages created X time ago, since we
	// ran this on a regular schedule.

	query.find({
  	success: function(messages) {

			// todo: destroy all the actual PFFiles associated with this message.
			
		console.log("Fetched messages");

			Parse.Object.destroyAll(messages, {
				success: function() {
					status.success("Deleted old voyses successfully");
				},
				error: function() {
					// An error occurred while deleting one or more of the objects.
					// If this is an aggregate error, then we can inspect each error
					// object individually to determine the reason why a particular
					// object was not deleted.
					if (error.code == Parse.Error.AGGREGATE_ERROR) {
						for (var i = 0; i < error.errors.length; i++) {
							console.log("Couldn't delete " + error.errors[i].object.id +
								"due to " + error.errors[i].message);
						}
						status.error("Failed deleting a few things...");
					} else {
						status.error("Failed deleting thigns because of " + error.message);
					}
				},
			})

  	},
	  error: function(error) {
			console.log("There was an error: " + error.message);
			status.error("Something went wrong");
	  }
	});
});



































/*

	//if (user.isNew()) {
	if (!isInitiated) {
		console.log("This is a non initiated user");

		//The lVKdY stuff is the objectID for teamVoyse. 


		//Get the Team Voice account and add the Team Voice Parse User as a friend to this user.
		var query = new Parse.Query(Parse.User);
		query.get(teamVoyseID, {
			success: function(teamVoyse) {

				// The object was retrieved successfully.
				//Get the PFRelation object.     
				var friendsRelation = user.relation("friendsRelation");
				friendsRelation.add(teamVoyse);

				//Create that first message. 
				var Message = Parse.Object.extend("Messages");
				var firstMessage = new Message();

				var userid = user.id;
				console.log(typeof(userid)); 
				var username = user.get("username");
				console.log("The username is " + username);
				console.log("The user id is " + userid);

				var obj = { name: username, read: false}; 
				var innerObj = {}; 
				innerObj[userid] = obj; 
				var recipientActivityArray = [innerObj]; 

/*
				var recipientActivityArray = [{
					userid: {
						"name": username,
						"read": false
					}
				}];
				*/



				/* [{"userid":{"read":false}}]
				[{"SmicZ7G4Xa":{"name":"reggie","read":true}}]
				[{"userid":{"name":"alkalosis","read":false}}] */

/*
				var audioFileQuery = new Parse.Query("TeamVoyseMessages");
				audioFileQuery.get("B9TBxht7kW", {
					success: function(voycemessage) {
						var audioFile = voycemessage.get("audioFile");
						console.log(audioFile); 

						firstMessage.set("audio", audioFile);
						firstMessage.set("recipientActivityArray", recipientActivityArray);
						firstMessage.set("sender", teamVoyse);
						firstMessage.set("recipientIds", [userid]);
						//Need Team Voyse Account for production. 
						firstMessage.set("senderId", teamVoyseID);
						firstMessage.set("senderName", "Team Voyse");

						firstMessage.save(null, {
							success: function(firstMessage) {
								console.log("Saved first message successfully");

								user.set("isInitiated", true);
								//Save the user now. 
								user.save(null, {
									success: function(user) {
										console.log("Saved the user successfully!!");
										response.success();
									},
									error: function(user, error) {
										console.log("Error occured saveing the user " + error.code + " ");
										response.error();
									}
								});
							},
							error: function(firstMessage, error) {
								console.log("Error saving first message" + error.description + error.code);
								response.error();
							}
						});

					},
					error: function(voycemessage, error) {
						console.log("Unable to fetch audioFile " + error.code);
						response.error();
					}
				});
			},
			error: function(object, error) {
				// The object was not retrieved successfully.
				// error is a Parse.Error with an error code and description.
				console.log("Error saving user: " + error.code);
				response.error();
			}
		});
	} else {
		response.success();
	}
});

*/





/*
Parse.Cloud.afterSave(Parse.User, function(request, response) {
	console.log("afterSave fired");

	var user = request.object;
	var isFriendsWithTeamVoyse = user.get("isFriendsWithTeamVoyse");
	console.log("User is friends with TV: " + isFriendsWithTeamVoyse);

	//Is this user friends with Team Voyse?
	if (!isFriendsWithTeamVoyse) {
		//Fetch Team Voyce. 
		var query = new Parse.Query(Parse.User);
		query.get("sCbK0ihJz6", {
			success: function(teamVoyse) {

				// The object was retrieved successfully.
				//Get the PFRelation object.     
				var teamVoyseFriendsRelation = teamVoyse.relation("friendsRelation");
				teamVoyseFriendsRelation.add(user);

				//save team voyce. 
				teamVoyse.save(null, {
					success: function(teamVoyse) {
						// Execute any logic that should take place after the object is saved.
						// The user should be marked as "friends with Team Voyce"

						console.log('Team Voyse saved ' + teamVoyse.id);
						user.set("isFriendsWithTeamVoyse", true);
						user.save(null, {
							success: function(user) {
								console.log("Success!!");
								response.success();
							},
							error: function(user, error) {
								console.log("Failed to save the user: " + error.code);
								response.error();
							}
						});
					},
					error: function(teamVoyse, error) {
						// Execute any logic that should take place if the save fails.
						// error is a Parse.Error with an error code and description.
						console.log('Failed to save teamVoyse ' + error.code);
						response.error();
					}
				});
			},
			error: function(object, error) {
				// The object was not retrieved successfully.
				// error is a Parse.Error with an error code and description.
				console.log("Error saving user: " + error.code);
				response.error();
			}
		});
	}
});
xuzonma toperhob
*/