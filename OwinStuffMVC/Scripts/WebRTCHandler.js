'use strict'; // strict mode. Errors cause real errors. 

var startTime;
var localStream;
var connection;
var servers = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] };

var sdpConstraints = {
    audio: true,
	video: true
};

if ( navigator.mediaDevices === undefined )
{
	alert( "Güncel Firefox veya Chrome tarayıcısı kullanınız. Kullandığınız tarayıcı bu uygulamayı desteklemiyor." );
}
else
{
	navigator.mediaDevices.getUserMedia( sdpConstraints )
		.then( function ( stream )
		{
			connect();
			localStream				= stream;
			$localVideo.srcObject	= stream;

			$localVideo.onloadedmetadata = function ( e )
			{
				$localVideo.play();
			};
		} )
		.catch( function ( err )
		{
			alert( "Error occurred while recognizing devices!\n --> " + err.message );
		} );
}

function ErrorHandler( message )
{
	alert( message );
}

function connect()
{
    if ( RTCPeerConnection )
    {
        connection = new RTCPeerConnection( servers );
        connection.onicecandidate = function ( e )
        {
            chat.server.iceCandidate( JSON.stringify( { "candidate": e.candidate } ) );
        };
        connection.onaddstream = function ( e )
        {
            $btnStartCall.prop( 'disabled', true );	
            $remoteVideo.srcObject = e.stream;
            trace( 'Remote Stream Received' );		
        };
    }
    else
    {
        alert( "Bişeyler oluyor. Bu nası if aq" );
    }
}

$btnStartCall.click( function () {
	call();
});

$btnHangUp.click( function ()
{
	//connection kapatmacalı bişeyler -- sonra bakarız
});

function call()	//To start the video&audio conference n'shit
{
	if ( localStream !== "undefined" )
	{
		connection.addStream( localStream );
		connection.createOffer( onCreateOfferSuccess, 
			function () {
				alert( "Error while creating offer." );
			}, 
			sdpConstraints );
	}
	else {
		alert( "LocalStream is not attached!" );
	}
}

function onCreateOfferSuccess( desc )
{
	connection.setLocalDescription( desc, 
		function ()
		{
			chat.server.offer( $displayName.value, JSON.stringify(  { "sdp": desc } ) );
		}, ErrorHandler( "Error setting local description." )
	);
}

function answer( message ) {
    connection.setRemoteDescription( new RTCSessionDescription( message.sdp ), 
		function () {
			if ( localStream !== null ) {
				connection.addStream(localStream);
			}
            connection.createAnswer( function ( desc ) {
                connection.setLocalDescription( desc, function () {
                    chat.server.answer( $displayName.value, JSON.stringify( { "sdp": desc } ) );
                }, errorHandler( "Error setting local description." ) );                
            }, errorHandler( "Error creating answer." ));            
    }, errorHandler( "Error creating session description." ));
}

function getAnswer( message )
{
	if ( message.sdp !== null )
	{
		connection.setRemoteDescription( new RTCSessionDescription( message.sdp ) );
	} else
	{
		ErrorHandler( "Error getting answer." );
	}
}