using System;
using System.Collections;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNet.SignalR;
using System.Linq;

namespace SignalRChat
{
	public class ChatHub : Hub
	{
		public string noGroupMessage    = "Bir gruba katılmadın. Katılmak için tekrar giriş yap.";

		public static List<string>               GroupNameList      = new List<string>();
		public static Dictionary<string,string>  UserConnectionList = new Dictionary<string, string>(); //	< UserName, ConnectionId >
		public static Dictionary<string, string> UserGroupList      = new Dictionary<string, string>(); //	< UserName, GroupName >

		public void Send( string name, string message, string groupName )
		{
			// Call the addNewMessageToPage method to update clients.
			if ( GroupNameList.Contains( groupName ) )
			{
				Clients.Group( groupName ).addNewMessageToPage( name, message );
			}
			else
			{
				Clients.User( Context.User.Identity.Name ).DisplayErrorMessage( noGroupMessage );
			}
		}

		public void HangUp()
		{
			Clients.All.hangUpVideo();
		}
		public void Offer( string userName, string sdp )
		{
			var groupName		= UserGroupList[ userName ];
			var connectionId    = UserConnectionList[ userName ];
			Clients.Group( groupName, connectionId ).sendOffer( sdp );
		}

		public void Answer( string userName, string sdp )
		{
			var groupName       = UserGroupList[ userName ];
			var connectionId    = UserConnectionList[ userName ];
			Clients.Group( groupName, connectionId ).sendAnswer( sdp );
		}

		public void IceCandidate( string ice )
		{
			var groupName           = UserGroupList[ UserConnectionList.FirstOrDefault( x => x.Value == Context.ConnectionId ).Key ];
			var otherConnectionId   = UserConnectionList[ UserGroupList.FirstOrDefault( x => x.Value == groupName ).Key ];
			Clients.Group( groupName, otherConnectionId ).sendIce( ice );
		}
		public void JoinOrCreateGroup( string userName, string groupName )
		{
			if ( !GroupNameList.Contains( groupName ) ) //If group is formed for the first time
			{
				GroupNameList.Add( groupName );
			}
			if ( !UserConnectionList.ContainsKey( userName ) ) // If the user entered for the first time
			{
				UserConnectionList.Add( userName, Context.ConnectionId );
			}
			UserGroupList.Add( userName, groupName );
			Groups.Add( Context.ConnectionId, groupName );
		}
		public override Task OnDisconnected( bool stopCalled )
		{
			return base.OnDisconnected( stopCalled );
		}
	}
}