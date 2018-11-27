'use strict'; // strict mode. Errors cause real errors. 

var startTime;
var localStream;
var connection;
var servers = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] };

var sdpConstraints = {
    'mandatory': {
        'OfferToReceiveAudio': true,
        'OfferToReceiveVideo': true
    }
};

if ( navigator.mediaDevices.getUserMedia === undefined )
{
	navigator.mediaDevices.getUserMedia = function ( constraints )
	{

		// First get ahold of the legacy getUserMedia, if present
		var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

		// Some browsers just don't implement it - return a rejected promise with an error
		// to keep a consistent interface
		if ( !getUserMedia )
		{
			return Promise.reject( new Error( 'getUserMedia is not implemented in this browser' ) );
		}

		// Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
		return new Promise( function ( resolve, reject )
		{
			getUserMedia.call( navigator, constraints, resolve, reject );
		} );
	}
}

navigator.mediaDevices.getUserMedia( sdpConstraints )
	.then( function ( stream )
	{
		// Older browsers may not have srcObject
		if ( "srcObject" in $localVideo )
		{
			localStream				= stream;
			$localVideo.srcObject	= stream;
		} else
		{
			// Avoid using this in new browsers, as it is going away.
			localStream		= stream;
			$localVideo.src = window.URL.createObjectURL( stream );
		}
		$localVideo.onloadedmetadata = function ( e )
		{
			$localVideo.play();
		};
	} )
	.catch( function ( err )
	{
		alert( "Error occurred while recognizing devices!\n --> " + err.message );
	} );

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
            // Call the polyfill wrapper to attach the media stream to this element.
            $btnStartCall.prop( 'disabled', true );	
            $remoteVideo.srcObject = e.stream;		//Attach stream to remoteVideo object
            trace( 'received remote stream' );		
        };
    }
    else
    {
        alert( "Bişeyler oluyor. Bu nası if aq" );
    };
}

$btnStartCall.click( function () {
	connect();
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
			chat.server.offer( $displayName.val(), JSON.stringify(  { "sdp": desc } ) );
		}, ErrorHandler( "Error setting local description." )
	);
}

function answer( message ) {
    connection.setRemoteDescription( new RTCSessionDescription( message.sdp ), 
		function () {
			if ( localStream != null ) {
				connection.addStream(localStream);
			}
            connection.createAnswer( function ( desc ) {
                connection.setLocalDescription( desc, function () {
                    chat.server.answer( $displayName.val(), JSON.stringify( { "sdp": desc } ) );
                }, errorHandler( "Error setting local description." ) );                
            }, errorHandler( "Error creating answer." ));            
    }, errorHandler( "Error creating session description." ));
}

function getAnswer( message )
{
	if ( message.sdp != null )
	{
		connection.setRemoteDescription( new RTCSessionDescription( message.sdp ) );
	} else
	{
		ErrorHandler( "Error getting answer." );
	}
}