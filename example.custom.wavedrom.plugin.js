const examplePlugin = {

	name: 'example',
	exec: function(sig) {
		sig['wave'] = [];
		sig['wave'].push( 'tl', 
			{ 
				coords: [0,0.5], 
				text: ('This is an example of a custom plugin output! Eg. field of Plugin class : nativePWAttrList : ' + wd_.nativePWAttrList.join(':')),
				tlStyle: 'text-anchor:start'
			} );
		return sig ;
	}

};

wd_.register(examplePlugin);
