'use strict';

function fixWaveSkinForCustomSignals (source, waveSkin, ret) {

    const waveSkinNames = Object.keys(waveSkin);

    let skinsToInclude = [];
    let newDefsToInclude = [];
    if (waveSkin[source.config.skin]) {
        skinsToInclude[0] = source.config.skin ;
    } else {
        skinsToInclude[0] = waveSkinNames[0];
    }

    source.config.wdScratchpad['id2LaneIdx'] = {};
    ret.lanes.map( function (element, idx) {
        const idType = (typeof element.id);
        if (idType !== 'undefined') {
            // Check element.id is a string with english char, _, and numbers
            // but its first character should not be a number
            const alreadyExistingStr = typeof source.config.wdScratchpad['id2LaneIdx'][element.id] ;
            const vldSignalId = element.id.match(/^([a-z]|[A-Z]|_)([a-z]|[A-Z]|[0-9]|_)*$/);
            if (vldSignalId && (alreadyExistingStr === 'undefined')) {
                source.config.wdScratchpad['id2LaneIdx'][element.id] = idx ;
            }
        }
        if (element.overrideSkin && waveSkin[element.overrideSkin]) {
            skinsToInclude.push(element.overrideSkin);
        }
        if (element.skinStyle || element.skinClass) {
            // Grab index, actual skin style
            newDefsToInclude.push( { 
                'idx': idx, 
                'baseSkin': element.overrideSkin || skinsToInclude[0], 
                'style': element.skinStyle,
                'klass': element.skinClass
            } );
        }
    });

    let seenSkins = { };
    let skin = [];
    // Refactoring TODO: Change waveSkin / skin to be object instead of array
    // This will allow for more readable code instead of referring to array subscripts
    // that might be hard to keep track of
    skinsToInclude.map( function(elem, idx) {
        if (idx == 0) {
            skin = JSON.parse(JSON.stringify(waveSkin[elem])) ;
            // Need to ensure original waveskin is not altered, because we can modify the skin
            // in case multiple skins are used in the waveform (using overrideSkin)
            seenSkins[elem] = 1 ;
        }
        if (seenSkins[elem] == null) {
            seenSkins[elem] = 1 ;
            const styleStringInSkin = waveSkin[elem][2][2].replace(/text((?!\.s_wd).)*/, '') ;            
            let newDefs = JSON.parse(JSON.stringify(waveSkin[elem][3].slice(1))) ;
            // Markers are global and need to be from the master skin only
            // Avoid adding those to the overall skin.
            newDefs = newDefs.filter((ndef) => (ndef[0] !== 'marker'));
            skin[3] = skin[3].concat(newDefs) ;
            skin[2][2] = skin[2][2] + styleStringInSkin ;
        }
    });
    skin[2][2] = skin[2][2] + source.config.customStyle ;
    
    newDefsToInclude.map( function(elem) {
        let newDefs = JSON.parse(JSON.stringify(waveSkin[elem.baseSkin][3].slice(1))) ;
        newDefs = newDefs.filter((ndef) => (ndef[0] !== 'marker'));
        const idSkinOld = elem.baseSkin ;
        const idSkinNew = idSkinOld + '_L' + elem.idx ;
        let baseSkinClassSpecs = waveSkin[elem.baseSkin][2][2].split('}.') ;
        let cNames2Ignore = [] ;
        baseSkinClassSpecs.map( cSpec => {
            let cName2StyleStr = cSpec.split('{') ;
            if (cName2StyleStr[1].match(/stroke:none/) !== null) {
                cNames2Ignore.push(cName2StyleStr[0]);
                // These are 'invisible' bounding boxes in the original skin
                // Do not let the overriding skinStyle affect these
            }
        });
        for (let i = 0; i < newDefs.length; i++ ) {
            newDefs[i][1].id = newDefs[i][1].id.replace(idSkinOld, idSkinNew) ;
            for (let j = 2; j < newDefs[i].length; j++) {
                if (typeof newDefs[i][j][1] === 'object') {
                    let inclNewSkin = false ;
                    if (typeof newDefs[i][j][1].class !== 'undefined') {
                        inclNewSkin = !(cNames2Ignore.includes(newDefs[i][j][1].class)) ;
                    }
                    if (inclNewSkin) {
                        if (typeof elem.style !== 'undefined') {
                            newDefs[i][j][1].style = elem.style ;
                        }
                        if (typeof elem.klass !== 'undefined') {
                            newDefs[i][j][1].class += (' ' + elem.klass) ;
                        }
                    }
                    if (typeof newDefs[i][j][1].fill === 'string') {
                        // console.log (JSON.stringify(newDefs[i][j][1].fill) + ' :: ' + idSkinOld + ' -> ' + idSkinNew);
                        newDefs[i][j][1].fill = newDefs[i][j][1].fill.replace(idSkinOld, idSkinNew);
                        // console.log (JSON.stringify(newDefs[i][j][1].fill));
                    }
                }
            }
        }
        skin[3] = skin[3].concat(newDefs);
    });

    waveSkin.collated_wd_reserved = skin ;

}

module.exports = fixWaveSkinForCustomSignals;