var lib = ctypes.open("C:\\WINDOWS\\system32\\user32.dll");

/* Declare the signature of the function we are going to call */
var msgBox = lib.declare("MessageBoxW",
                         ctypes.winapi_abi,
                         ctypes.int32_t,
                         ctypes.int32_t,
                         ctypes.jschar.ptr,
                         ctypes.jschar.ptr,
                         ctypes.int32_t);
var MB_OK = 0;

var ret = msgBox(0, "Hello world", "title", MB_OK);

//lib.close();

self.onmessage = function (msg) {
	//dump('incoming message to ChromeWorker, msg:' + uneval(msg)); //does not dump to Browser Console
	//console.log('msg from worker onmessage'); //does not work but doesnt interrtup code
	switch (msg.data.aTopic) {
		case 'msg1':
			var promise_xhr = xhr('http://www.bing.com/', {
				aTimeout: 10000,
				aResponseType: 'text'
			});
			promise_xhr.then(
				function(aVal) {
					console.log('Fullfilled - promise_xhr - ', aVal);
					// start - do stuff here - promise_xhr
					console.info('aVal.responseText:', aVal.responseText);
					/*
					for (var p in aVal) {
						console.info('pa', p.toString())
					}
					*/
					/* aVal has:
					"pa" "mozBackgroundRequest"
					"pa" "open"
					"pa" "setRequestHeader"
					"pa" "send"
					"pa" "abort"
					"pa" "getResponseHeader"
					"pa" "getAllResponseHeaders"
					"pa" "overrideMimeType"
					"pa" "sendAsBinary"
					"pa" "onreadystatechange"
					"pa" "readyState"
					"pa" "timeout"
					"pa" "withCredentials"
					"pa" "upload"
					"pa" "responseURL"
					"pa" "status"
					"pa" "statusText"
					"pa" "responseType"
					"pa" "response"
					"pa" "responseText"
					"pa" "mozAnon"
					"pa" "mozSystem"
					"pa" "UNSENT"
					"pa" "OPENED"
					"pa" "HEADERS_RECEIVED"
					"pa" "LOADING"
					"pa" "DONE"
					"pa" "onloadstart"
					"pa" "onprogress"
					"pa" "onabort"
					"pa" "onerror"
					"pa" "onload"
					"pa" "ontimeout"
					"pa" "onloadend"
					"pa" "addEventListener"
					"pa" "removeEventListener"
					"pa" "dispatchEvent"
					*/
					// end - do stuff here - promise_xhr
				},
				function(aReason) {
					var rejObj = {name:'promise_xhr', aReason:aReason};
					console.warn('Rejected - promise_xhr - ', rejObj);
				}
			).catch(
				function(aCaught) {
					var rejObj = {name:'promise_xhr', aCaught:aCaught};
					console.error('Caught - promise_xhr - ', rejObj);
				}
			);
			self.postMessage({aTopic:'msg1-reply'});
			break;
		default:
			throw 'no aTopic on incoming message to ChromeWorker';
	}
}

self.onerror = function(msg) {}

function Deferred() {
		try {
			/* A method to resolve the associated Promise with the value passed.
			 * If the promise is already settled it does nothing.
			 *
			 * @param {anything} value : This value is used to resolve the promise
			 * If the value is a Promise then the associated promise assumes the state
			 * of Promise passed as value.
			 */
			this.resolve = null;

			/* A method to reject the assocaited Promise with the value passed.
			 * If the promise is already settled it does nothing.
			 *
			 * @param {anything} reason: The reason for the rejection of the Promise.
			 * Generally its an Error object. If however a Promise is passed, then the Promise
			 * itself will be the reason for rejection no matter the state of the Promise.
			 */
			this.reject = null;

			/* A newly created Pomise object.
			 * Initially in pending state.
			 */
			this.promise = new Promise(function(resolve, reject) {
				this.resolve = resolve;
				this.reject = reject;
			}.bind(this));
			Object.freeze(this);
		} catch (ex) {
			throw new Error('Promise not available!');
		}
}

function xhr(aStr, aOptions={}) {
	// currently only setup to support GET and POST
	// does an async request
	// aStr is either a string of a FileURI such as `OS.Path.toFileURI(OS.Path.join(OS.Constants.Path.desktopDir, 'test.png'));` or a URL such as `http://github.com/wet-boew/wet-boew/archive/master.zip`
	// Returns a promise
		// resolves with xhr object
		// rejects with object holding property "xhr" which holds the xhr object
	
	/*** aOptions
	{
		aLoadFlags: flags, // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/NsIRequest#Constants
		aTiemout: integer (ms)
		isBackgroundReq: boolean, // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#Non-standard_properties
		aResponseType: string, // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#Browser_Compatibility
		aPostData: string
	}
	*/
	
	var aOptions_DEFAULT = {
		//aLoadFlags: Ci.nsIRequest.LOAD_ANONYMOUS | Ci.nsIRequest.LOAD_BYPASS_CACHE | Ci.nsIRequest.INHIBIT_PERSISTENT_CACHING,
		aPostData: null,
		aResponseType: 'text',
		isBackgroundReq: true, // If true, no load group is associated with the request, and security dialogs are prevented from being shown to the user
		aTimeout: 0 // 0 means never timeout, value is in milliseconds
	}
	
	for (var opt in aOptions_DEFAULT) {
		if (!(opt in aOptions)) {
			aOptions[opt] = aOptions_DEFAULT[opt];
		}
	}
	
	// Note: When using XMLHttpRequest to access a file:// URL the request.status is not properly set to 200 to indicate success. In such cases, request.readyState == 4, request.status == 0 and request.response will evaluate to true.
	
	var deferredMain_xhr = new Deferred();
	console.log('here222');
	let xhr = new XMLHttpRequest(); //Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);

	let handler = ev => {
		evf(m => xhr.removeEventListener(m, handler, !1));

		switch (ev.type) {
			case 'load':
			
					if (xhr.readyState == 4) {
						if (xhr.status == 200) {
							deferredMain_xhr.resolve(xhr);
						} else {
							var rejObj = {
								name: 'deferredMain_xhr.promise',
								aReason: 'Load Not Success', // loaded but status is not success status
								xhr: xhr,
								message: xhr.statusText + ' [' + ev.type + ':' + xhr.status + ']'
							};
							deferredMain_xhr.reject(rejObj);
						}
					} else if (xhr.readyState == 0) {
						var uritest = Services.io.newURI(aStr, null, null);
						if (uritest.schemeIs('file')) {
							deferredMain_xhr.resolve(xhr);
						} else {
							var rejObj = {
								name: 'deferredMain_xhr.promise',
								aReason: 'Load Failed', // didnt even load
								xhr: xhr,
								message: xhr.statusText + ' [' + ev.type + ':' + xhr.status + ']'
							};
							deferredMain_xhr.reject(rejObj);
						}
					}
					
				break;
			case 'abort':
			case 'error':
			case 'timeout':
				
					var rejObj = {
						name: 'deferredMain_xhr.promise',
						aReason: ev.type[0].toUpperCase() + ev.type.substr(1),
						xhr: xhr,
						message: xhr.statusText + ' [' + ev.type + ':' + xhr.status + ']'
					};
					deferredMain_xhr.reject(rejObj);
				
				break;
			default:
				var rejObj = {
					name: 'deferredMain_xhr.promise',
					aReason: 'Unknown',
					xhr: xhr,
					message: xhr.statusText + ' [' + ev.type + ':' + xhr.status + ']'
				};
				deferredMain_xhr.reject(rejObj);
		}
	};

	let evf = f => ['load', 'error', 'abort'].forEach(f);
	evf(m => xhr.addEventListener(m, handler, false));

	if (aOptions.isBackgroundReq) {
		xhr.mozBackgroundRequest = true;
	}
	
	if (aOptions.aTimeout) {
		xhr.timeout
	}
	
	if (aOptions.aPostData) {
		xhr.open('POST', aStr, true);
		//xhr.channel.loadFlags |= aOptions.aLoadFlags; // i dont know how to do this from ChromeWorker yet
		xhr.responseType = aOptions.aResponseType;
		xhr.send(aOptions.aPostData);		
	} else {
		xhr.open('GET', aStr, true);
		//xhr.channel.loadFlags |= aOptions.aLoadFlags; // i dont know how to do this from ChromeWorker yet
		xhr.responseType = aOptions.aResponseType;
		xhr.send(null);
	}
	
	return deferredMain_xhr.promise;
}
