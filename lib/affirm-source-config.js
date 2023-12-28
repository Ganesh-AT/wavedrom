'use strict';

function affirmSourceConfig (source) {

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

}
/*eslint no-console: 0*/
module.exports = affirmSourceConfig;