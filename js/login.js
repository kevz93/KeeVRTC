


var ref = new Firebase("https://i2u2robot.firebaseio.com/");

$( document ).ready(function() {
   

$("#loginbtn").click(function(){
	ref.authWithOAuthPopup("google", function(error, authData) {
  if (error) {
    alert("Login Failed!", error);
  } else {
    console.log("Authenticated successfully with payload:", authData);
    if(typeof(Storage) !== "undefined") {
    // Code for localStorage/sessionStorage.
    sessionStorage.setItem("authData",JSON.stringify(authData));
    window.location.href="admin/admin.html";
} else {
    // Sorry! No Web Storage support..handle this branch
}
  }
		});
	});
});
$( document ).mousemove( function( e ) {
			$( '.background' ).parallax( -30, e );
			$( '.lx2' ).parallax( -15, e );
			$( '.lx1' ).parallax( -7, e );
		});


