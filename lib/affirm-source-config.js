'use strict';

function affirmSourceConfig (source, waveSkin) {

    // default fit2pane is false to match legacy behavior of rendering tiny waveforms
    // default wrapSvgInImg is not matching legacy behavior in order to allow waveforms
    //   with multiple skins to coexist on the same page.
    //   Group defs are on a per-skin basis, but markers use a common style
    //   Not matching the legacy behavior prevents the style bleeding
    // default colorMode is normal. Other supported values are:
    //   grayscale, posterize, purebw
    const defaultConfig = {
        skin                      : 'default',
        fit2pane                  : false,
        wrapSvgInImg              : true,
        hscale                    : 1,
        hbounds                   : [0, 5e11],
        marks                     : true,
        arcFontSize               : 11,
        txtBaseline               : undefined,
        customStyle               : '',
        colorMode                 : 'normal',
        // advanced flags / chicken bits
        wdLegacyRightPaddingMode  : false,
        wdDisableClipPaths        : false,
        wdClipPathModeCss         : false, // Need 2 remove
        wdPushCustomAttrToClasses : false,
        // data scratchpad to avoid touching too many files
        // to return data back for template insertion
        wdScratchpad              : {}
    };

    // Setup all source.config defaults here
    if (source.config === undefined) {
        source.config = {};
    }

    Object.keys(defaultConfig).forEach( (cfgAttr) => {
        if (source.config[cfgAttr] === undefined) {
            source.config[cfgAttr] = defaultConfig[cfgAttr] ;
        }
    } );

    const waveSkinNames = Object.keys(waveSkin);

    let skinsToInclude = [];
    let newDefsToInclude = [];
    if (waveSkin[source.config.skin]) {
        skinsToInclude[0] = source.config.skin ;
    } else {
        skinsToInclude[0] = waveSkinNames[0];
    }

    if (source.signal) {
        source.signal.map( function (element, idx) {        
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
    }

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
/*eslint no-console: 0*/
module.exports = affirmSourceConfig;