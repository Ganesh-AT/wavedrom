'use strict';

const tt = require('onml/tt.js');

const getSignalRowCount = require('./get-signal-row-count.js');

function insertSVGTemplate (index, source, lane, waveSkin, content, lanes, groups) {
    
    if (source.config.wdScratchpad['markers2CloneWithAddedClass'] !== undefined) {
        source.config.wdScratchpad['markers2CloneWithAddedClass'].map( elem => {
            let origMarkers = JSON.parse(
                JSON.stringify(waveSkin.collated_wd_reserved[3].filter( x => 
                    ((x[0] === 'marker') && (['arrowhead', 'arrowtail', 'tee'].includes(x[1].id)))
                ))
            );
            origMarkers.map ( nMarker => {
                nMarker[1].id = 'D' + index + '_' + nMarker[1].id + '_E' + elem.idx ;
                nMarker[1].class = nMarker[1].class + ' ' + elem.class2Add ;
            } );
            waveSkin.collated_wd_reserved[3] = waveSkin.collated_wd_reserved[3].concat(origMarkers);
        } );
    }
    if (source.config.wdScratchpad['clipPath2Add2Defs'] !== undefined) {
        waveSkin.collated_wd_reserved[3] = waveSkin.collated_wd_reserved[3].concat(source.config.wdScratchpad.clipPath2Add2Defs);
    }
    if (source.config.colorMode === 'posterize') {
        const posterizeFilter = [['filter', { id: 'posterize', 'color-interpolation-filters': 'sRGB' }, 
            ['feColorMatrix', { 'type': 'saturate', 'values': 0 }],
            [ 
                'feComponentTransfer', {}, 
                ['feFuncR', { type: 'discrete', tableValues: '0 1' }],
                ['feFuncG', { type: 'discrete', tableValues: '0 1' }],
                ['feFuncB', { type: 'discrete', tableValues: '0 1' }]
            ]
        ]];
        waveSkin.collated_wd_reserved[3] = waveSkin.collated_wd_reserved[3].concat(posterizeFilter);
    }
    if (source.config.colorMode === 'purebw') {
        let styleStr = waveSkin.collated_wd_reserved[2][2] ;
        let tmpStyleStr = styleStr.replaceAll(/stroke:none[^(;|})]*/g, 'W-D-S-T-R-O-K-E-N-O-N-E-W-D');
        tmpStyleStr = tmpStyleStr.replaceAll(/fill:none[^(;|})]*/g, 'W-D-F-I-L-L-N-O-N-E-W-D');
        tmpStyleStr = tmpStyleStr.replaceAll(/fill:white[^(;|})]*/g, 'W-D-F-I-L-L-W-H-I-T-E-W-D');
        tmpStyleStr = tmpStyleStr.replaceAll(/fill:#fff[^(;|})]*/ig, 'W-D-F-I-L-L-W-H-I-T-E-W-D');
        tmpStyleStr = tmpStyleStr.replaceAll(/stroke:[^(;|})]*/g, 'stroke:#000');
        tmpStyleStr = tmpStyleStr.replaceAll(/fill:[^(;|})]*/g, 'fill:black');
        tmpStyleStr = tmpStyleStr.replaceAll('W-D-S-T-R-O-K-E-N-O-N-E-W-D', 'stroke:none') ;
        tmpStyleStr = tmpStyleStr.replaceAll('W-D-F-I-L-L-N-O-N-E-W-D', 'fill:none') ;
        styleStr = tmpStyleStr.replaceAll('W-D-F-I-L-L-W-H-I-T-E-W-D', 'fill:white') ;
        waveSkin.collated_wd_reserved[2][2] = styleStr ;
    }
    const e = waveSkin.collated_wd_reserved ;

    const rightPadding = (source.config.wdLegacyRightPaddingMode ? 0 : (lane.xg + 1 - lane.wlxmax)); 
    // Ientify gap to the left of the longest signal name to ensure waveform is centered
    const numActualBricks = lane.xmax + ((lane.xmax_cfg > 1e6) ? 0 : 1); // add a brick to get legacy behavior when hbounds[1] is specified
    const scaledWidth = (lane.xg + (lane.downscale * (lane.xs * numActualBricks)) + rightPadding);

    // content.length replaced by actualContentLength to ensure non-rendered lanes 
    // are not considered when computing height
    const actualContentLength = getSignalRowCount(content);
    const height = (actualContentLength * lane.yo + lane.yh0 + lane.yh1 + lane.yf0 + lane.yf1);

    const body = e[e.length - 1];

    body[1] = {id: 'waves_'  + index};
    if (source.config.colorMode === 'posterize') {
        body[1]['filter'] = 'url(#posterize)';
    }
    if (source.config.colorMode === 'grayscale') {
        body[1]['filter'] = 'grayscale(100%)' ;
    }

    body[2] = ['rect', {width: scaledWidth, height: height, class: 'background'}];

    body[3] = ['g', tt(
        lane.xg + 0.5,
        lane.yh0 + lane.yh1 + 0.5,
        {id: 'lanes_'  + index}
    )].concat(lanes);

    body[4] = ['g', {
        id: 'groups_' + index
    }, groups];

    const head = e[1];

    head.id = 'svgcontent_' + index ;
    if (source.config.fit2pane) {
        head.height = '100%' ;
        head.width = '100%' ;
    } else {
        head.height = height;
        head.width = scaledWidth;
    }
    head.viewBox = '0 0 ' + scaledWidth + ' ' + height;
    head.overflow = 'hidden';

    return e;
} /* eslint no-console:0 */

module.exports = insertSVGTemplate;
