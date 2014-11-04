// ==UserScript==
// @name        Github Stats
// @namespace   stratehm.github
// @include     https://github.com/*/*
// @version     1
// @grant       GM_xmlhttpRequest
// @require		http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js
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
	if(userProject != null) {
		getDownloadCount(userProject);
	}
}

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
	  url: url,
	  onload: parseDownloadStatsReponse
	});
}

function parseDownloadStatsReponse(response) {
	var data = $.parseJSON(response.responseText);
	if(data != null && data.length > 0) {
		var releaseName = data[0].name;
		var htmlUrl = data[0].html_url;
		lastReleaseItemList.append($('<a/>').attr({
			href: htmlUrl
		}).append(releaseName));
		if(data[0].assets != null && data[0].assets.length > 0) {
			for(i = 0 ; i < data[0].assets.length ; i++) {
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
	}).append("<b>Name:</b> <a href='" + assetUrl + "'>" + assetName + '</a>, <b>Dl Count:</b> ' + assetDlCount));
}