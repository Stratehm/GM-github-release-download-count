// ==UserScript==
// @name	Github Stats
// @namespace	stratehm.github
// @include	https://github.com/*/*
// @version	2
// @grant	GM_xmlhttpRequest
// @grant	GM_getValue
// @grant	GM_setValue
// @require	http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js
// @require	http://userscripts-mirror.org/scripts/source/107941.user.js
// ==/UserScript==

var lastReleaseItemList;

this.$ = this.jQuery = jQuery.noConflict(true);
$(document).ready(function() { 
	init();
});

function init() {
	lastReleaseItemList = $('<ul/>').attr({
		style: 'font-size: 11px; line-height: 10px; white-space: nowrap;'
	}).append('<b>Last release: </b>');
	$('h1.entry-title.public').append(lastReleaseItemList);
	var userProject = getCurrentUserProjectUrlPart();
	if(userProject !== null) {
		getDownloadCount(userProject);
	}
	if(window.location.pathname.indexOf("/settings/tokens") !== 0) {
		return;
	}
	$('.column.three-fourths').append('<div class="boxed-group access-token-group" id="GM_Form"><h3>Set personal access token for userscript</h3><div class="boxed-group-inner"><p>This token will be used by the userscript to show the number of downloads for a repo.</p><ul class="boxed-group-list"><li style="line-height:32px;"><p>Login Username: <input type="text" id="clientId" style="float:right;width:480px;" /></p><p style="line-height:32px;">Client Secret: <input type="password" id="clientSecret" style="float:right;width:480px;"/></p></li><li><button id="GM_submit" type="submit" type="button" class="btn btn-primary">Generate token</button>&nbsp;&nbsp;<button id="GM_reset" type="submit" type="button" class="btn btn-danger">Clear token</button></li></ul><p class="help"><i class="octicon octicon-question"></i>Without a personal access token, you are rate limited to <a href="https://developer.github.com/v3/#rate-limiting">60 api calls per hour</a>, which may not be enough.</p></div></div>');
	$('#clientId').val(GM_SuperValue.get('clientId',''));
	$('#clientSecret').val(GM_SuperValue.get('clientSecret',''));
	$('#GM_submit').click(function(){
		GM_SuperValue.set("clientId",$('#clientId').val());
		GM_SuperValue.set("clientSecret",$('#clientSecret').val());
		console.log({clientId:GM_SuperValue.get("clientId",""),clientSecret:GM_SuperValue.get("clientSecret","")});
		$('#GM_submit').fadeTo(1000,0.01).fadeTo(1000,1);
	});
	$('#GM_done').fadeIn(1000).fadeOut(1000);
	$('#GM_reset').click(function(){
		$('#clientId').val('');
		$('#clientSecret').val('');
		GM_SuperValue.set("clientId","");
		GM_SuperValue.set("clientSecret","");
		console.log({clientId:GM_SuperValue.set("clientId",""),clientSecret:GM_SuperValue.set("clientSecret","")});
		$('#GM_reset').fadeTo(1000,0.01).fadeTo(1000,1);
	});
});

function getCurrentUserProjectUrlPart() {
	var splittedPath = window.location.pathname.split('/');
	if(splittedPath.length >= 3) {
		return splittedPath[1] + '/' + splittedPath[2];
	}
}

function getDownloadCount(userProjectUserPart) {
	var url = "https://api.github.com/repos/" + userProjectUserPart + "/releases";
	GM_xmlhttpRequest({
	  method: "GET",
	  headers: {
		"Cache-Control": "no-cache",
		"Authorization":"Basic " + btoa(GM_SuperValue.get("clientId","")+":"+GM_SuperValue.get("clientSecret",""))
	  },
	  url: url,
	  onload: parseDownloadStatsReponse
	});
}

function parseDownloadStatsReponse(response) {
	var data = $.parseJSON(response.responseText);
	if(data.message && data.message.indexOf("API rate limit exceeded") >-1) {
		accessTokenNeeded();
	} else if(data !== null && data.length > 0) {
		var releaseName = data[0].name;
		var htmlUrl = data[0].html_url;
		lastReleaseItemList.append($('<a/>').attr({
			href: htmlUrl
		}).append(releaseName));
		if(data[0].assets !== null && data[0].assets.length > 0) {
			for(var i = 0 ; i < data[0].assets.length ; i++) {
				var assetName = data[0].assets[i].name;
				var assetDlCount = data[0].assets[i].download_count;
				var assetUrl = data[0].assets[i].browser_download_url;
				appendAssetDlItem(assetName, assetDlCount, assetUrl);
			}
		} else {
			lastReleaseItemList.append("<br>No binaries in release");
		}
	} else {
		lastReleaseItemList.append("No release");
	}
}

function appendAssetDlItem(assetName, assetDlCount, assetUrl) {
	lastReleaseItemList.append($('<li/>').attr({
		style: "margin-left: 20px;"
	})).append("<b>Name:</b> <a href='" + assetUrl + "'>" + assetName + '</a>, <b>Dl Count:</b> ' + assetDlCount);
}
function accessTokenNeeded() {
	lastReleaseItemList.append($('<li/>').attr({
		style: "margin-left: 20px;"
	})).append("Your api limit has been hit. Please add a <a href='https://github.com/settings/tokens'>personal access token</a> (The form to add it to the script will pop up after you create it)");
}
