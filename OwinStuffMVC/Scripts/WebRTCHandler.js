'use strict'; // strict mode. Errors cause real errors. 

var startTime;
var localStream;
var connection;
var isReady = false;
var servers = {
	'iceServers': [{
		'urls': 'stun:stun4.l.google.com:19302'
	}] };

var sdpConstraints = {
	audio: true,
	video: true
};

var chat = $.connection.chatHub;

$( function ()
{

	while ( $displayName.value === '' ) {
		$displayName.value = prompt( 'Please enter your name:', '' );
	}
	while ( $groupName.innerHTML === '' ) {
		$groupName.innerHTML = prompt( 'Please enter the group name:', '' );

	}
	// Reference the auto-generated proxy for the hub.
	// Create a function that the hub can call back to display messages.
	chat.client.addNewMessageToPage = function ( name, message )
	{
		// Add the message to the page.
		let HtmlItem_LI = document.createElement( "LI" );
		let HtmlItem_STRONG = document.createElement( "STRONG" );
		let HtmlItem_P_Name = document.createTextNode( htmlEncode( name ) );
		let HtmlItem_P_Message = document.createTextNode( htmlEncode( message ) );

		HtmlItem_STRONG.appendChild( HtmlItem_P_Name );
		HtmlItem_LI.appendChild( HtmlItem_STRONG );
		HtmlItem_LI.appendChild( HtmlItem_P_Message );

		$discussion.appendChild( HtmlItem_LI );
	};
	chat.client.showStartCallButton = function ( state )
	{
		$btnStartCall.disabled = state;
	};
	chat.client.joinedInfo = function ( userName )
	{
		$InfoMessage.innerHTML = userName + " odaya katıldı.";
		$InfoField.classList.add( "show" );
	};
	chat.client.displayErrorMessage = function ( strErr )
	{
		alert( strErr );
	};
	chat.client.sendOffer = function ( desc )
	{
		console.log( "answering" );
		answer( JSON.parse( desc ) );
	};
	chat.client.sendAnswer = function ( desc )
	{
		console.log( "Getting Answer" );
		getAnswer( JSON.parse( desc ) );
	};
	chat.client.sendIce = function ( desc ) {
        trace('Ice sent ' + desc);
        addIceCandidate(JSON.parse(desc));
    };
	// Set initial focus to message input box.
	$message.focus();
	// Start the connection.
	$.connection.hub.start().done( function ()
	{
		// Get the user name and store it to prepend to messages.
		chat.server.joinOrCreateGroup( $displayName.value, $groupName.innerHTML );
		$btnSendMessage.onclick = function ()
		{
			// Call the Send method on the hub.orosp
			chat.server.send( $displayName.value, $message.value, $groupName.innerHTML );
			// Clear text box and reset focus for next comment.
			$message.value = '';
			$message.focus();
		};
	} );
} );
// This optional function html-encodes messages for display in the page.
function htmlEncode( value )
{
	var encodedValue = $( '<div />' ).text( value ).html();
	return encodedValue;
}

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
			localStream = stream;
			$localVideo.srcObject = stream;

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

var errorHandler = function ( err )
{
	alert( err );
};

function connect()
{
	if ( RTCPeerConnection )
	{
		connection = new RTCPeerConnection( null );	// If browser offers you a STUN server, take it. Servers you added are for turn.
		connection.onicecandidate = function ( e )
		{
			chat.server.iceCandidate( $displayName, JSON.stringify( { "candidate": e.candidate } ) );
		};
		connection.ontrack = function ( e )
		{
			$btnStartCall.attributes( 'disabled', true );
			$remoteVideo.srcObject = e.streams[0];
			console.log( 'Remote Stream Received' );
		};
		connection.onremovetrack = function ( e )
		{
			$btnStartCall.attributes( 'disabled', false );
			$remoteVideo.srcObject = null;
			console.log( 'Remote Stream Removed. Event: ', e );
		};
	}
	else
	{
		alert( "Bişeyler oluyor. Bu nası if aq" );
	}
}

$btnStartCall.onclick = function ()
{
	console.log( "Pressed call button." );
	call();
};

$btnHangUp.onclick = function ()
{
	//connection kapatmacalı bişeyler -- sonra bakarız
};

function call()	//To start the video&audio conference n'shit
{
	if ( localStream !== "undefined" )
	{
		connection.addStream( localStream );
		console.log( "Added local stream." );
		connection.createOffer( onCreateOfferSuccess,
			function ()
			{
				alert( "Error while creating offer." );
			},
			sdpConstraints );
	}
	else
	{
		alert( "Kendi mikrofon veya video bağlantınızı sağlamadan görüşmeye başlayamazsınız." );
	}
}

function onCreateOfferSuccess( desc )
{
	connection.setLocalDescription( desc,
		function ()
		{
			chat.server.offer( $displayName.value, JSON.stringify( { "sdp": desc } ) );
			onSetLocalSuccess();
		}, errorHandler
	);
}

function answer( message )
{
	connection.setRemoteDescription( new RTCSessionDescription( message.sdp ),
		function ()
		{
			if ( localStream !== null )
			{
				connection.addStream( localStream );
				console.log( "Added local stream to connection" );
			}
			connection.createAnswer( function ( desc )
			{
				connection.setLocalDescription( desc, function ()
				{
					chat.server.answer( $displayName.value, JSON.stringify( { "sdp": desc } ) );
				}, errorHandler );
			}, errorHandler );
		}, errorHandler );
}

function getAnswer( message )
{
	if ( message.sdp !== null )
	{
		console.log( "Remote Description set." );
		connection.setRemoteDescription( new RTCSessionDescription( message.sdp ) );
	} else
	{
		errorHandler;
	}
}

function onSetLocalSuccess()
{
	console.log( ' setLocalDescription complete' );
}

function addIceCandidate(message) {
    if (message.candidate !== null) {
        trace('ICE candidate added.');
        connection.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
}