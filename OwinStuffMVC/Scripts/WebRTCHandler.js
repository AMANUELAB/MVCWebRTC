'use strict'; // strict mode. Errors cause real errors. 

var startTime;
var localStream;
var connection;
var servers = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] };

var $displayName	= document.querySelector( '#displayname' );
var $groupName		= document.querySelector( '#groupName' );
var $discussion		= document.querySelector( '#discussion' );
var $message		= document.querySelector( '#message' );
var $btnSendMessage = document.querySelector( '#sendmessage' );
var $remoteVideo	= document.querySelector( '#remoteVideo' );
var $localVideo		= document.querySelector( '#localVideo' );
var $btnStartCall	= document.querySelector( '#startCall' );
var $btnHangUp		= document.querySelector( '#hangUp' );
var $BtnReady		= document.querySelector( '#BtnReady' );

var sdpConstraints = {
    audio: true,
	video: true
};

if ( navigator.mediaDevices === undefined )
{
	alert( "Güncel Firefox veya Chrome tarayıcısı kullanınız. Kullandığınız tarayıcı bu uygulamayı desteklemiyor." );
}
else{

navigator.mediaDevices.getUserMedia( sdpConstraints )
	.then( function ( stream )
	{
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
            // Call the polyfill wrapper to attach the media stream to this element.
            $btnStartCall.prop( 'disabled', true );	
            $remoteVideo.srcObject = e.stream;		//Attach stream to remoteVideo object
            trace( 'received remote stream' );		
        };
    }
    else
    {
        alert( "Bişeyler oluyor. Bu nası if aq" );
    }
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