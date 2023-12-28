class WaveDromPlugins {

	static sinTable ;
	static cosTable ;
	static nativePWAttrList ;
	static plugins ;

	constructor() {
		this.sinTable = [...Array(Math.ceil(2*Math.PI*1000)).keys()].map( x => Math.sin(x/1000) );
		this.cosTable = [...Array(Math.ceil(2*Math.PI*1000)).keys()].map( x => Math.cos(x/1000) );
		this.nativePWAttrList = ['d','pwStyle','pwClass'] ;
		this.plugins = {};
	}

	parseTrig (sig) {

        let tphase = sig.phase || 0 ;
        let tspec = JSON.parse(JSON.stringify(sig.wave)) ; // wave to mod
        sig.wave = [] ;
        let dspec = tspec[1] ;
        let nodspec = (typeof dspec === 'undefined') ;
        let dspecamp = (nodspec || (typeof dspec.amp === 'undefined')) ? 1 : dspec.amp ;
        let dspecf   = (nodspec || (typeof dspec.f === 'undefined') || (dspec.f == 0)) ? 1 : dspec.f ;
        let dspecphi = (nodspec || (typeof dspec.phi === 'undefined')) ? 0 : dspec.phi ;
        let drepeat  = (nodspec || (typeof dspec.repeat === 'undefined')) ? 1 : dspec.repeat ;
        let pathArr = [] ;
        for (let rn = 0; rn < drepeat; rn++) {
          for (let i = 0; i < (1/dspecf); i += 0.001) {
            let tblIdx = parseInt((2000 * Math.PI * i * dspecf) + (dspecphi * 1000 * Math.PI * dspecf / 180))
                         % parseInt(2000 * Math.PI) ;
            let scaledVal = (tspec[0] === "sin") ? this.sinTable[tblIdx] : 
				  (tspec[0] === "cos") ? this.cosTable[tblIdx] : 0 ;
            // scaledVal is between -1 and +1, but pw coords pre-scaling should be between 0 and 1
            // first shift the value to be between -0.5 and 0.5 and then apply the amplitude factor
            scaledVal /= 2.00 ;
            scaledVal *= dspecamp ;
            // shift to center around y = 0.5
            scaledVal += 0.5 ;
            if ((rn == 0) && (i == 0)) {
              pathArr.push('M');
            }
            pathArr.push((rn / dspecf) + i - tphase);
            pathArr.push(scaledVal);
          }
        }
        let pwObj = { 'd' : pathArr };
		if (!nodspec) {
			Object.keys(dspec).forEach( (pwAttr) => {
				if (this.nativePWAttrList.includes(pwAttr)) {
					pwObj[pwAttr] = dspec[pwAttr];
				}
			} );		
		}
        sig.wave = [ 'pw', pwObj ] ;
		return sig ;
		
	} // end parseTrig

	parseAsync (sig) {

        let tspec = JSON.parse(JSON.stringify(sig.wave)) ; // wave to mod
        sig.wave = [] ;
		if (tspec[0] !== 'async') {
			return [];
		}
		let dspec = tspec[1] ;
        let nodspec = (typeof dspec === 'undefined') ;
        let dspecSeq = (nodspec || (typeof dspec.seq === 'undefined')) ? '0' : dspec.seq ;
        let dspecCTimes = (nodspec || (typeof dspec.cTimes === 'undefined')) ? [0] : dspec.cTimes ;
        let dspecRT  = (nodspec || (typeof dspec.rTime === 'undefined')) ? 0 : dspec.rTime ;
        let dspecFT  = (nodspec || (typeof dspec.fTime === 'undefined')) ? 0 : dspec.fTime ;
        let dspecSharpZ  = (nodspec || (typeof dspec.sharpz === 'undefined')) ? false : dspec.sharpz ;
        let pathArr = [] ;
		let seqIdx = 0 ;
		pathArr.push('M');
		let xpos = dspecCTimes[seqIdx];
		let ypos = (dspecSeq[seqIdx] === '0') ? 0 : (dspecSeq[seqIdx] === '1') ? 1 :
			(dspecSeq[seqIdx] === 'z') ? 0.5 : 0 ;
		pathArr.push(xpos);
		pathArr.push(ypos);
		let prevSig = dspecSeq[seqIdx] ;
		for (seqIdx = 1; seqIdx < dspecSeq.length; seqIdx++) {
			let nxtSig = dspecSeq[seqIdx];
			let nxtCTime = dspecCTimes[seqIdx];
			// draw line up to the ctime as x pos, y pos will be from prevSig
			pathArr.push('L', nxtCTime, ypos); // 'L' not strictly necessary, but for readability
			// nxtXPos will depend on rise or fall time
			let nxtXPos = nxtCTime + dspecRT; // assume rise time
			let cpX = nxtCTime + (0.4 * dspecRT) ;
			ypos = (nxtSig === '0') ? 0 : (nxtSig === '1') ? 1 : (nxtSig === 'z') ? 0.5 : 0;
			if (prevSig == '1') { // we need to change to fall time
				nxtXPos = nxtCTime + dspecFT;
				cpX = nxtCTime + (0.4 * dspecFT) ;
			}
			if ((nxtSig !== 'z') || (dspecSharpZ === true)) {
				pathArr.push('L', nxtXPos, ypos);
			} else { // Not a straight transition, but We will need a slow rise or fall
				pathArr.push('Q', cpX, ypos, nxtXPos, ypos);
			}
			prevSig = nxtSig ;
		}
		// Handle the last dspecCTimes
		pathArr.push('H',dspecCTimes[seqIdx]);
        let pwObj = { 'd' : pathArr };
		if (!nodspec) {
			Object.keys(dspec).forEach( (pwAttr) => {
				if (this.nativePWAttrList.includes(pwAttr)) {
					pwObj[pwAttr] = dspec[pwAttr];
				}
			} );		
		}
        sig.wave = [ 'pw', pwObj ] ;
		return sig ;
		
	} // end parseAsync


	register (plugin) {
		const {name, exec} = plugin ;
		this.plugins[name] = exec ;
	}

	customParse (parseFunc, sig) {
		const func = this.plugins[parseFunc];
		return func(sig);
	}

}
let wd_ ;
try { 
	wd_ = new WaveDromPlugins(); 
	// export wd_ ;
} 
catch(err) { console.log("Unable to load WaveDromPlugins... " + err);  }
