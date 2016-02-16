Twilio.sendMessage("408-763-1969", "Code day 420");
Twilio.listenForMessages(function(data) {
  alert("I received an SMS from " + data.from);
  alert("They said " + data.body);
});